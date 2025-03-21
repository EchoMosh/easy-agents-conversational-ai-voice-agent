
import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LeadVariables } from "../lead-variables";
import { LeadVariable } from "@/pages/dashboard/leads";
import { NewVariableForm } from "../variables/new-variable-form";

interface EditVariablesDialogProps {
  lead: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadUpdated: () => void;
}

export function EditVariablesDialog({ 
  lead, 
  isOpen, 
  onOpenChange,
  onLeadUpdated 
}: EditVariablesDialogProps) {
  const [variables, setVariables] = useState<LeadVariable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newVariables, setNewVariables] = useState<{name: string; value: string}[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && lead?.id) {
      fetchVariables();
    }
  }, [isOpen, lead?.id]);

  const fetchVariables = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("lead_variables")
        .select("*")
        .eq("lead_id", lead.id)
        .order("name", { ascending: true });

      if (error) throw error;
      setVariables(data || []);
    } catch (error) {
      console.error("Error fetching variables:", error);
      toast.error("Failed to load variables");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditVariable = (variable: LeadVariable) => {
    // Dialog will take care of the edit
  };

  const handleDeleteVariable = async (id: string) => {
    try {
      const { error } = await supabase
        .from("lead_variables")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Variable deleted");
      setVariables(variables.filter(v => v.id !== id));
      onLeadUpdated();
    } catch (error) {
      console.error("Error deleting variable:", error);
      toast.error("Failed to delete variable");
    }
  };

  const handleAddVariable = () => {
    setNewVariables([...newVariables, { name: '', value: '' }]);
  };

  const handleRemoveNewVariable = (index: number) => {
    const updated = [...newVariables];
    updated.splice(index, 1);
    setNewVariables(updated);
  };

  const handleNewVariableChange = (index: number, field: "name" | "value", value: string) => {
    const updated = [...newVariables];
    updated[index][field] = value;
    setNewVariables(updated);
  };

  const handleSaveVariables = async () => {
    if (newVariables.some(v => !v.name.trim())) {
      toast.error("Variable names cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      // Format variable names (convert spaces to underscores)
      const variablesToAdd = newVariables.map(v => {
        // Convert spaces to underscores
        const formattedName = v.name.trim().replace(/\s+/g, '_');
        
        return {
          lead_id: lead.id,
          name: formattedName,
          value: v.value.trim() || null
        };
      });

      // Check for name modifications to show in notification
      const modifiedNames = newVariables.filter(v => 
        v.name.trim() !== v.name.trim().replace(/\s+/g, '_')
      );

      const { error } = await supabase
        .from('lead_variables')
        .insert(variablesToAdd);

      if (error) throw error;

      if (modifiedNames.length > 0) {
        toast.info(
          "Spaces converted to underscores in variable names", 
          { description: "Variables have been saved with underscores instead of spaces" }
        );
      } else {
        toast.success(`Added ${newVariables.length} variable${newVariables.length > 1 ? 's' : ''}`);
      }
      
      setNewVariables([]);
      fetchVariables();
      onLeadUpdated();
    } catch (error) {
      console.error('Error adding variables:', error);
      toast.error('Failed to add variables');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Manage Variables for {lead?.name}</DialogTitle>
        </DialogHeader>
        
        <div className="pt-4 space-y-6">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Current Variables */}
              <LeadVariables
                leadId={lead.id}
                variables={variables}
                onEdit={handleEditVariable}
                onDelete={handleDeleteVariable}
                onAddClick={handleAddVariable}
                onVariablesUpdated={() => {
                  fetchVariables();
                  onLeadUpdated();
                }}
              />

              {/* New Variables Forms */}
              {newVariables.length > 0 && (
                <div className="border-t pt-4 mt-6">
                  <h3 className="text-lg font-medium mb-4">Add New Variables</h3>
                  <div className="space-y-3">
                    {newVariables.map((variable, index) => (
                      <NewVariableForm
                        key={index}
                        name={variable.name}
                        value={variable.value}
                        onChange={(field, value) => handleNewVariableChange(index, field, value)}
                        onRemove={() => handleRemoveNewVariable(index)}
                      />
                    ))}
                    {newVariables.some(v => v.name.includes(' ')) && (
                      <p className="text-xs text-amber-600 mt-2">
                        Note: Spaces in variable names will be converted to underscores when saved
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Add Variable Button */}
              <Button
                type="button"
                variant="outline"
                onClick={handleAddVariable}
                className="w-full"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add New Variable
              </Button>

              {/* Save Button (only shown if there are new variables) */}
              {newVariables.length > 0 && (
                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleSaveVariables}
                    disabled={isSaving}
                  >
                    {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save {newVariables.length} Variable{newVariables.length !== 1 ? 's' : ''}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
