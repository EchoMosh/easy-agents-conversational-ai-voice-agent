
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query"; // Added
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2 } from "lucide-react";
import { VariableBadge } from "./variables/variable-badge";
import { LeadVariable } from "@/pages/dashboard/leads";
import { EmptyState } from "./variables/empty-state";
import { VariableEditor } from "./variables/variable-editor";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface LeadVariablesProps {
  leadId: string;
  variables: LeadVariable[];
  onEdit?: (variable: LeadVariable) => void;
  onDelete?: (id: string) => void;
  onAddClick?: () => void;
  onVariablesUpdated?: () => void;
}

export function LeadVariables({
  leadId,
  variables,
  onEdit = () => {},
  onDelete = () => {},
  onAddClick = () => {},
  onVariablesUpdated = () => {},
}: LeadVariablesProps) {
  const [editingVariable, setEditingVariable] = useState<LeadVariable | null>(null);
  const [editName, setEditName] = useState("");
  const [editValue, setEditValue] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient(); // Added

  const handleEditClick = (variable: LeadVariable) => {
    setEditingVariable(variable);
    setEditName(variable.name);
    setEditValue(variable.value || "");
  };

  const handleSaveEdit = async () => {
    if (!editingVariable) return;
    if (!editName.trim()) {
      toast.error("Variable name cannot be empty");
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("lead_variables")
        .update({
          name: editName.trim(),
          value: editValue.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq("id", editingVariable.id);

      if (error) throw error;

      toast.success("Variable updated");
      setEditingVariable(null);
      queryClient.invalidateQueries({ queryKey: ['leadVariables'] }); // Added
      onVariablesUpdated();
    } catch (error) {
      console.error("Error updating variable:", error);
      toast.error("Failed to update variable");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingVariable(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Variables</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={onAddClick}
          className="h-9 px-4 rounded-lg"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Variable
        </Button>
      </div>

      {variables.length === 0 ? (
        <EmptyState onAddClick={onAddClick} />
      ) : (
        <div className="space-y-3">
          {variables.map((variable) => (
            <div key={variable.id}>
              {editingVariable?.id === variable.id ? (
                <VariableEditor
                  name={editName}
                  value={editValue}
                  onNameChange={setEditName}
                  onValueChange={setEditValue}
                  onSave={handleSaveEdit}
                  onCancel={handleCancelEdit}
                />
              ) : (
                <VariableBadge
                  variable={variable}
                  onEdit={() => handleEditClick(variable)}
                  onDelete={onDelete}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {isUpdating && (
        <div className="flex justify-center py-2">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
