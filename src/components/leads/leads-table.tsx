
import { useState } from "react";
import { Table, TableBody } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DeleteDialog } from "@/components/agents/table/delete-dialog";
import { SelectionHeader } from "@/components/agents/table/selection-header";
import { useQuery } from "@tanstack/react-query";
import { LeadTableHeader } from "./components/lead-table-header";
import { LeadRow } from "./components/lead-row";
import { LeadsTableProps } from "./types/lead-types";

export function LeadsTable({ leads, isLoading, onLeadUpdated }: LeadsTableProps) {
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch available pipelines
  const { data: pipelines = [] } = useQuery({
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
      const { error } = await supabase
        .from('leads')
        .update({ 
          pipeline_id: pipelineId,
          updated_at: new Date().toISOString() // Add timestamp to ensure trigger fires
        })
        .in('id', selectedLeads);

      if (error) throw error;

      toast.success(`Successfully moved ${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''} to pipeline`);
      setSelectedLeads([]);
      onLeadUpdated();
    } catch (error) {
      console.error('Error moving leads:', error);
      toast.error('Failed to move leads');
    }
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
        pipelines={pipelines}
      />

      <div className="border rounded-lg">
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
                
              return (
                <LeadRow
                  key={lead.id}
                  lead={lead}
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
