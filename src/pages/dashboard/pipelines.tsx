
import { useState } from "react";
import { DragEndEvent } from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { Lead } from "@/pages/dashboard/leads";
import { useToast } from "@/components/ui/use-toast";
import { PipelineHeader } from "@/components/pipelines/pipeline-header";
import { PipelineStages } from "@/components/pipelines/pipeline-stages";
import { LeadDetailsDialog } from "@/components/pipelines/lead-details-dialog";
import { NewPipelineDialog } from "@/components/pipelines/new-pipeline-dialog";
import { usePipeline } from "@/hooks/use-pipeline";
import { supabase } from "@/integrations/supabase/client";
import { PipelineColumn } from "@/types/pipeline";
import { defaultColumns } from "@/hooks/use-pipeline";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef} className="h-full">{children}</div>;
}

export default function PipelinesPage() {
  const { toast } = useToast();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const {
    pipelines,
    leads,
    selectedPipeline,
    editedColumns,
    showNewPipelineDialog,
    setSelectedPipeline,
    setEditedColumns,
    setShowNewPipelineDialog,
    handleEditColumnTitle,
    handleEditPipelineName,
    handleDeletePipeline,
    createNewPipeline,
  } = usePipeline();

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const leadId = String(active.id);
    const newStatus = over.id as Lead["status"];

    // Don't update if dropping in the same column
    const lead = leads.find(l => l.id === leadId);
    if (lead?.status === newStatus) return;

    try {
      const { error } = await supabase
        .from("leads")
        .update({ status: newStatus })
        .eq("id", leadId);

      if (error) throw error;

      toast({
        title: "Lead status updated",
        description: `Lead moved to ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating lead status:", error);
      toast({
        title: "Error",
        description: "Failed to update lead status",
        variant: "destructive",
      });
    }
  };

  const handleAddStage = (newStage: PipelineColumn) => {
    setEditedColumns(prev => [...prev, newStage]);
  };

  const handleReorderColumns = async (newColumns: PipelineColumn[]) => {
    if (!selectedPipeline) return;
    
    try {
      setEditedColumns(newColumns);
      setSelectedPipeline(prev => prev ? { ...prev, columns: newColumns } : null);
    } catch (error) {
      console.error("Error updating columns:", error);
      toast({
        title: "Error",
        description: "Failed to update pipeline columns",
        variant: "destructive",
      });
    }
  };

  const onDeleteConfirm = async () => {
    setIsDeleting(true);
    try {
      await handleDeletePipeline();
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleCloseDialog = (open: boolean) => {
    if (!isDeleting) {
      setShowDeleteDialog(open);
    }
  };

  return (
    <div className="p-8 min-h-screen bg-gradient-to-b from-background to-muted/50">
      <PipelineHeader 
        pipelines={pipelines}
        selectedPipeline={selectedPipeline}
        onCreatePipeline={() => setShowNewPipelineDialog(true)}
        onSelectPipeline={setSelectedPipeline}
      />

      {selectedPipeline && (
        <PipelineStages
          selectedPipeline={selectedPipeline}
          leads={leads}
          onDragEnd={handleDragEnd}
          onEditColumnTitle={handleEditColumnTitle}
          onLeadClick={setSelectedLead}
          onAddStage={handleAddStage}
          onDeletePipeline={() => setShowDeleteDialog(true)}
          onEditPipelineName={handleEditPipelineName}
          onReorderColumns={handleReorderColumns}
        />
      )}

      <NewPipelineDialog
        open={showNewPipelineDialog}
        onOpenChange={setShowNewPipelineDialog}
        onSubmit={createNewPipeline}
      />

      <LeadDetailsDialog
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        columns={selectedPipeline?.columns || defaultColumns}
      />

      <Dialog open={showDeleteDialog} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Pipeline</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this pipeline? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-4 mt-4">
            <DialogClose asChild>
              <Button variant="outline" disabled={isDeleting}>
                Cancel
              </Button>
            </DialogClose>
            <Button 
              variant="destructive" 
              onClick={onDeleteConfirm} 
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
