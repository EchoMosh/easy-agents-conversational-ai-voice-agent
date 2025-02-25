
import { useState } from "react";
import { Plus, Trash, Check, X, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LeadVariable } from "@/pages/dashboard/leads";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

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
        {variables.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {variables.map((variable) => (
              editingVariables[variable.id] ? (
                <div key={variable.id} className="flex items-center gap-2 w-full">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <Input
                      value={editingVariables[variable.id].name}
                      onChange={(e) => updateEditingVariable(variable.id, "name", e.target.value)}
                      className="h-11 text-base border border-border/50 bg-background/50 hover:bg-background/80 focus-visible:ring-1 transition-colors"
                    />
                    <Input
                      value={editingVariables[variable.id].value}
                      onChange={(e) => updateEditingVariable(variable.id, "value", e.target.value)}
                      className="h-11 text-base border border-border/50 bg-background/50 hover:bg-background/80 focus-visible:ring-1 transition-colors"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => saveEditing(variable.id)}
                    className="h-11 w-11"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => cancelEditing(variable.id)}
                    className="h-11 w-11"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Badge
                  key={variable.id}
                  variant="secondary"
                  className="pl-3 pr-2 py-1.5 h-8 text-sm bg-background/80 hover:bg-background/90 transition-all duration-200 border border-border/50 shadow-sm"
                >
                  <Tag className="w-3 h-3 mr-2 opacity-50" />
                  <span className="font-normal">{variable.name}:</span>
                  <span className="font-medium ml-1">{variable.value}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => startEditing(variable)}
                    className="h-5 w-5 ml-2 hover:bg-background/80 rounded-full"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteVariable(variable.id)}
                    className="h-5 w-5 hover:bg-background/80 rounded-full"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Tag className="w-8 h-8 mb-3 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              No variables added yet
            </p>
            <p className="text-xs text-muted-foreground/80">
              Click "Add Variable" to start adding custom fields to this lead
            </p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {newVariables.map((variable, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="flex-1 grid grid-cols-2 gap-2">
              <Input
                placeholder="Variable name"
                value={variable.name}
                onChange={(e) => updateNewVariable(index, "name", e.target.value)}
                required
                className="h-11 text-base border border-border/50 bg-background/50 hover:bg-background/80 focus-visible:ring-1 transition-colors"
              />
              <Input
                placeholder="Value"
                value={variable.value}
                onChange={(e) => updateNewVariable(index, "value", e.target.value)}
                required
                className="h-11 text-base border border-border/50 bg-background/50 hover:bg-background/80 focus-visible:ring-1 transition-colors"
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeNewVariable(index)}
              className="h-11 w-11"
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
