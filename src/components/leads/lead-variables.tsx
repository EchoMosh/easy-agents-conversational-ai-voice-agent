import { useState } from "react";
import { Plus, Trash, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LeadVariable } from "@/pages/dashboard/leads";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  const updateEditingVariable = (
    variableId: string,
    field: "name" | "value",
    value: string
  ) => {
    setEditingVariables({
      ...editingVariables,
      [variableId]: {
        ...editingVariables[variableId],
        [field]: value
      }
    });
  };

  return (
    <div className="space-y-6 pt-6">
      <div className="space-y-4">
        {variables.map((variable) => (
          <div key={variable.id} className="flex items-center gap-2">
            {editingVariables[variable.id] ? (
              <>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Input
                    value={editingVariables[variable.id].name}
                    onChange={(e) => updateEditingVariable(variable.id, "name", e.target.value)}
                  />
                  <Input
                    value={editingVariables[variable.id].value}
                    onChange={(e) => updateEditingVariable(variable.id, "value", e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => saveEditing(variable.id)}
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => cancelEditing(variable.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <Input value={variable.name} readOnly onClick={() => startEditing(variable)} />
                  <Input value={variable.value || ""} readOnly onClick={() => startEditing(variable)} />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => startEditing(variable)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteVariable(variable.id)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {newVariables.map((variable, index) => (
          <div key={index} className="flex items-start gap-2">
            <div className="flex-1 space-y-2">
              <Input
                placeholder="Variable name"
                value={variable.name}
                onChange={(e) => updateNewVariable(index, "name", e.target.value)}
                required
              />
              <Input
                placeholder="Value"
                value={variable.value}
                onChange={(e) => updateNewVariable(index, "value", e.target.value)}
                required
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeNewVariable(index)}
            >
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={addVariable}
            className="flex-1"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Variable
          </Button>
          {newVariables.length > 0 && (
            <Button type="submit" disabled={isLoading} className="flex-1">
              {isLoading ? "Saving..." : "Save Variables"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
