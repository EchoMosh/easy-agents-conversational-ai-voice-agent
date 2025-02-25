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

export function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef} className="h-full">{children}</div>;
}

export default function PipelinesPage() {
  const { toast } = useToast();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
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
      // Update the local state immediately
      setEditedColumns(newColumns);
      
      // Also update the selectedPipeline state
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
          onDeletePipeline={handleDeletePipeline}
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
    </div>
  );
}
