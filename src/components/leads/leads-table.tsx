import { useState } from "react";
import { Table, TableBody } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DeleteDialog } from "@/components/agents/table/delete-dialog";
import { SelectionHeader } from "@/components/agents/table/selection-header";
import { useQuery } from "@tanstack/react-query";
import { LeadTableHeader } from "./components/lead-table-header";
import { LeadRow } from "./components/lead-row";
import { LeadsTableProps, LeadWithHandlers } from "./types/lead-types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { NewVariableForm } from "./variables/new-variable-form";
import { EditVariablesDialog } from "./components/edit-variables-dialog";

export function LeadsTable({ leads, isLoading, onLeadUpdated }: LeadsTableProps) {
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBulkVariablesOpen, setIsBulkVariablesOpen] = useState(false);
  const [newVariables, setNewVariables] = useState<{name: string; value: string}[]>([]);
  const [editingLead, setEditingLead] = useState<any>(null);
  const [isEditVariablesOpen, setIsEditVariablesOpen] = useState(false);

  const { data: pipelines = [], refetch: refetchPipelines } = useQuery({
    queryKey: ["pipelines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipelines")
        .select("id, name")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const handleToggleSelect = (id: string) => {
    setSelectedLeads(prev =>
      prev.includes(id) ? prev.filter(leadId => leadId !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    setSelectedLeads(prev => 
      prev.length === leads.length ? [] : leads.map(lead => lead.id)
    );
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .in('id', selectedLeads);

      if (error) throw error;

      toast.success(`Successfully deleted ${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''}`);
      setSelectedLeads([]);
      onLeadUpdated();
    } catch (error) {
      console.error('Error deleting leads:', error);
      toast.error('Failed to delete leads');
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleMoveToPipeline = async (pipelineId: string) => {
    try {
      const updateData = pipelineId === "none" 
        ? { pipeline_id: null, updated_at: new Date().toISOString() }
        : { pipeline_id: pipelineId, updated_at: new Date().toISOString() };
        
      const { error } = await supabase
        .from('leads')
        .update(updateData)
        .in('id', selectedLeads);

      if (error) throw error;

      const message = pipelineId === "none" 
        ? `Removed ${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''} from pipeline` 
        : `Moved ${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''} to pipeline`;
        
      toast.success(message);
      onLeadUpdated();
    } catch (error) {
      console.error('Error moving leads:', error);
      toast.error('Failed to move leads');
    }
  };

  const handleChangeStatus = async (status: string) => {
    try {
      const { error } = await supabase
        .from('leads')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .in('id', selectedLeads);

      if (error) throw error;

      toast.success(`Updated status for ${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''}`);
      onLeadUpdated();
    } catch (error) {
      console.error('Error updating lead status:', error);
      toast.error('Failed to update lead status');
    }
  };

  const handleAddVariable = () => {
    setNewVariables([...newVariables, { name: '', value: '' }]);
  };

  const handleRemoveVariable = (index: number) => {
    const updated = [...newVariables];
    updated.splice(index, 1);
    setNewVariables(updated);
  };

  const handleVariableChange = (index: number, field: "name" | "value", value: string) => {
    const updated = [...newVariables];
    updated[index][field] = value;
    setNewVariables(updated);
  };

  const handleBulkAddVariables = async () => {
    if (newVariables.some(v => !v.name.trim())) {
      toast.error("Variable names cannot be empty");
      return;
    }

    try {
      const variablesToAdd = selectedLeads.flatMap(leadId => 
        newVariables.map(v => ({
          lead_id: leadId,
          name: v.name.trim(),
          value: v.value.trim() || null
        }))
      );

      const { error } = await supabase
        .from('lead_variables')
        .insert(variablesToAdd);

      if (error) throw error;

      toast.success(`Added ${newVariables.length} variable${newVariables.length > 1 ? 's' : ''} to ${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''}`);
      setNewVariables([]);
      setIsBulkVariablesOpen(false);
      onLeadUpdated();
    } catch (error) {
      console.error('Error adding variables:', error);
      toast.error('Failed to add variables');
    }
  };

  const handleOpenVariableEditor = (lead: any) => {
    setEditingLead(lead);
    setIsEditVariablesOpen(true);
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading leads...</div>;
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No leads found. Add your first lead to get started.
      </div>
    );
  }

  return (
    <>
      <SelectionHeader
        selectedCount={selectedLeads.length}
        onDelete={() => setIsDeleteDialogOpen(true)}
        isDeleting={isDeleting}
        onMoveToPipeline={handleMoveToPipeline}
        onChangeStatus={handleChangeStatus}
        onAddVariables={() => setIsBulkVariablesOpen(true)}
        pipelines={pipelines}
      />

      <div className="border rounded-lg overflow-hidden shadow-sm">
        <Table>
          <LeadTableHeader
            onToggleSelectAll={handleToggleSelectAll}
            isAllSelected={selectedLeads.length === leads.length}
            isDeleting={isDeleting}
          />
          <TableBody>
            {leads.map((lead) => {
              const pipelineName = lead.pipeline_id ? 
                pipelines.find(p => p.id === lead.pipeline_id)?.name || 'Unknown' : 
                'No Pipeline';
              
              const leadWithHandlers: LeadWithHandlers = {
                ...lead,
                onVariableClick: handleOpenVariableEditor,
                onEditClick: (lead) => {
                  if (typeof window !== 'undefined') {
                    const event = new CustomEvent('editLead', { detail: lead });
                    window.dispatchEvent(event);
                  }
                }
              };
                
              return (
                <LeadRow
                  key={lead.id}
                  lead={leadWithHandlers}
                  isSelected={selectedLeads.includes(lead.id)}
                  onToggleSelect={handleToggleSelect}
                  onLeadUpdated={onLeadUpdated}
                  isDeleting={isDeleting}
                  pipelineName={pipelineName}
                />
              );
            })}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isBulkVariablesOpen} onOpenChange={setIsBulkVariablesOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Variables to {selectedLeads.length} Lead{selectedLeads.length > 1 ? 's' : ''}</DialogTitle>
          </DialogHeader>
          
          <div className="pt-4 space-y-6">
            <div className="space-y-4">
              {newVariables.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No variables added yet. Click the button below to add a variable.
                </div>
              )}
              
              {newVariables.map((variable, index) => (
                <NewVariableForm
                  key={index}
                  name={variable.name}
                  value={variable.value}
                  onChange={(field, value) => handleVariableChange(index, field, value)}
                  onRemove={() => handleRemoveVariable(index)}
                />
              ))}
            </div>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleAddVariable}
              className="w-full"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Variable
            </Button>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setNewVariables([]);
                  setIsBulkVariablesOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleBulkAddVariables}
                disabled={newVariables.length === 0}
              >
                Save {newVariables.length} Variable{newVariables.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {editingLead && (
        <EditVariablesDialog
          lead={editingLead}
          isOpen={isEditVariablesOpen}
          onOpenChange={setIsEditVariablesOpen}
          onLeadUpdated={onLeadUpdated}
        />
      )}

      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
        title={`Delete ${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''}?`}
        description="This action cannot be undone. This will permanently delete the selected leads and remove their data from our servers."
      />
    </>
  );
}
