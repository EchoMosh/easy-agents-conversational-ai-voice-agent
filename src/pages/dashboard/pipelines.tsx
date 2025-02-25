
import { useState } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Lead } from "@/pages/dashboard/leads";
import { useToast } from "@/hooks/use-toast";
import { PipelineHeader } from "@/components/pipelines/pipeline-header";
import { PipelineStages } from "@/components/pipelines/pipeline-stages";
import { LeadDetailsDialog } from "@/components/pipelines/lead-details-dialog";
import { NewPipelineDialog } from "@/components/pipelines/new-pipeline-dialog";
import { DeletePipelineDialog } from "@/components/pipelines/delete-pipeline-dialog";
import { RefreshButton } from "@/components/pipelines/refresh-button";
import { usePipeline } from "@/hooks/use-pipeline";
import { useDeletePipeline } from "@/hooks/pipeline/use-delete-pipeline";
import { usePipelineDrag } from "@/hooks/pipeline/use-pipeline-drag";
import { PipelineColumn } from "@/types/pipeline";
import { defaultColumns } from "@/hooks/use-pipeline";

export function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef} className="h-full">{children}</div>;
}

export default function PipelinesPage() {
  const { toast } = useToast();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
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
    refetchPipelines,
    refetchLeads,
  } = usePipeline();

  const {
    showDeleteDialog,
    setShowDeleteDialog,
    isDeleting,
    onDelete,
  } = useDeletePipeline(handleDeletePipeline);

  const { handleDragEnd } = usePipelineDrag(selectedPipeline, leads, refetchLeads);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchPipelines(), refetchLeads()]);
    } catch (error) {
      console.error("Error refreshing:", error);
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
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

  return (
    <div className="relative">
      <div className="p-8 min-h-screen bg-gradient-to-b from-background to-muted/50">
        <div className="flex justify-between items-center mb-6">
          <RefreshButton isRefreshing={isRefreshing} onRefresh={handleRefresh} />
        </div>
        
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

        <DeletePipelineDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          onDelete={onDelete}
          isDeleting={isDeleting}
        />
      </div>
    </div>
  );
}
