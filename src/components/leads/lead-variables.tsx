
import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeadVariable } from "@/pages/dashboard/leads";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { VariableBadge } from "./variables/variable-badge";
import { VariableEditor } from "./variables/variable-editor";
import { NewVariableForm } from "./variables/new-variable-form";
import { EmptyState } from "./variables/empty-state";

interface LeadVariablesProps {
  leadId: string;
  variables: LeadVariable[];
  onVariablesUpdated: () => void;
}

export function LeadVariables({
  leadId,
  variables,
  onVariablesUpdated,
}: LeadVariablesProps) {
  const [newVariables, setNewVariables] = useState<
    { name: string; value: string }[]
  >([]);
  const [editingVariables, setEditingVariables] = useState<Record<string, { name: string; value: string }>>({});
  const [isLoading, setIsLoading] = useState(false);

  const addVariable = () => {
    setNewVariables([...newVariables, { name: "", value: "" }]);
  };

  const removeNewVariable = (index: number) => {
    setNewVariables(newVariables.filter((_, i) => i !== index));
  };

  const updateNewVariable = (
    index: number,
    field: "name" | "value",
    value: string
  ) => {
    const updated = [...newVariables];
    updated[index][field] = value;
    setNewVariables(updated);
  };

  const startEditing = (variable: LeadVariable) => {
    setEditingVariables({
      ...editingVariables,
      [variable.id]: { name: variable.name, value: variable.value || "" }
    });
  };

  const cancelEditing = (variableId: string) => {
    const updated = { ...editingVariables };
    delete updated[variableId];
    setEditingVariables(updated);
  };

  const saveEditing = async (variableId: string) => {
    try {
      const editedVariable = editingVariables[variableId];
      
      const isDuplicate = variables.some(v => 
        v.id !== variableId && 
        v.name.toLowerCase() === editedVariable.name.toLowerCase()
      );

      if (isDuplicate) {
        toast.error("A variable with this name already exists");
        return;
      }

      const { error } = await supabase
        .from("lead_variables")
        .update({
          name: editedVariable.name,
          value: editedVariable.value
        })
        .eq("id", variableId);

      if (error) throw error;

      toast.success("Variable updated successfully");
      cancelEditing(variableId);
      onVariablesUpdated();
    } catch (error) {
      toast.error("Failed to update variable");
      console.error("Error updating variable:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const duplicateInNew = newVariables.some((v1, i1) =>
        newVariables.some((v2, i2) => 
          i1 !== i2 && v1.name.toLowerCase() === v2.name.toLowerCase()
        )
      );

      const duplicateWithExisting = newVariables.some(newVar =>
        variables.some(existingVar => 
          existingVar.name.toLowerCase() === newVar.name.toLowerCase()
        )
      );

      if (duplicateInNew || duplicateWithExisting) {
        toast.error("Duplicate variable names are not allowed");
        return;
      }

      const { error } = await supabase.from("lead_variables").insert(
        newVariables.map((v) => ({
          lead_id: leadId,
          name: v.name,
          value: v.value,
        }))
      );

      if (error) throw error;

      toast.success("Variables added successfully");
      setNewVariables([]);
      onVariablesUpdated();
    } catch (error) {
      toast.error("Failed to add variables");
      console.error("Error adding variables:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteVariable = async (variableId: string) => {
    try {
      const { error } = await supabase
        .from("lead_variables")
        .delete()
        .eq("id", variableId);

      if (error) throw error;

      toast.success("Variable deleted successfully");
      onVariablesUpdated();
    } catch (error) {
      toast.error("Failed to delete variable");
      console.error("Error deleting variable:", error);
    }
  };

  return (
    <div className="space-y-6 pt-6">
      <div className="space-y-4">
        {variables.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {variables.map((variable) => (
              editingVariables[variable.id] ? (
                <VariableEditor
                  key={variable.id}
                  name={editingVariables[variable.id].name}
                  value={editingVariables[variable.id].value}
                  onNameChange={(value) => setEditingVariables({
                    ...editingVariables,
                    [variable.id]: { ...editingVariables[variable.id], name: value }
                  })}
                  onValueChange={(value) => setEditingVariables({
                    ...editingVariables,
                    [variable.id]: { ...editingVariables[variable.id], value: value }
                  })}
                  onSave={() => saveEditing(variable.id)}
                  onCancel={() => cancelEditing(variable.id)}
                />
              ) : (
                <VariableBadge
                  key={variable.id}
                  variable={variable}
                  onEdit={startEditing}
                  onDelete={deleteVariable}
                />
              )
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {newVariables.map((variable, index) => (
          <NewVariableForm
            key={index}
            name={variable.name}
            value={variable.value}
            onChange={(field, value) => updateNewVariable(index, field, value)}
            onRemove={() => removeNewVariable(index)}
          />
        ))}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={addVariable}
            className="flex-1 h-11 text-base border border-border/50 bg-background/50 hover:bg-background/80 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Variable
          </Button>
          {newVariables.length > 0 && (
            <Button 
              type="submit" 
              disabled={isLoading} 
              className="flex-1 h-11 text-base bg-primary/90 hover:bg-primary transition-all duration-200"
            >
              {isLoading ? "Saving..." : "Save Variables"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
