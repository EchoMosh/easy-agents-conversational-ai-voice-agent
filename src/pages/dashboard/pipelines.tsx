
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useDroppable } from "@dnd-kit/core";
import { Lead } from "@/pages/dashboard/leads";
import { PipelineHeader } from "@/components/pipelines/pipeline-header";
import { PipelineStages } from "@/components/pipelines/pipeline-stages";
import { LeadDetailsDialog } from "@/components/pipelines/lead-details-dialog";
import { NewPipelineDialog } from "@/components/pipelines/new-pipeline-dialog";
import { DeletePipelineDialog } from "@/components/pipelines/delete-pipeline-dialog";
import { usePipeline } from "@/hooks/use-pipeline";
import { useDeletePipeline } from "@/hooks/pipeline/use-delete-pipeline";
import { usePipelineDrag } from "@/hooks/pipeline/use-pipeline-drag";
import { usePipelineColumns } from "@/hooks/pipeline/use-pipeline-columns";
import { defaultColumns } from "@/hooks/use-pipeline";
import { useQueryClient } from "@tanstack/react-query";

export function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef} className="h-full">{children}</div>;
}

export default function PipelinesPage() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const queryClient = useQueryClient();
  const location = useLocation();
  
  const {
    pipelines,
    leads,
    selectedPipeline,
    showNewPipelineDialog,
    setSelectedPipeline,
    setShowNewPipelineDialog,
    handleEditColumnTitle,
    handleEditPipelineName,
    handleDeletePipeline,
    createNewPipeline,
    refetchPipelines,
    refetchLeads,
  } = usePipeline();

  // Extract the selected pipeline ID from the URL query parameters
  useEffect(() => {
    if (pipelines?.length > 0) {
      // Get the 'selected' query parameter from the URL
      const params = new URLSearchParams(location.search);
      const selectedPipelineId = params.get('selected');
      
      if (selectedPipelineId) {
        // Find the pipeline with the matching ID
        const pipelineToSelect = pipelines.find(p => p.id === selectedPipelineId);
        if (pipelineToSelect) {
          console.log("Setting selected pipeline from URL parameter:", pipelineToSelect.name);
          setSelectedPipeline(pipelineToSelect);
          return;
        }
      }
      
      // If no pipeline is selected or the selected pipeline doesn't exist,
      // default to the first pipeline
      if (!selectedPipeline) {
        setSelectedPipeline(pipelines[0]);
      }
    }
  }, [pipelines, location.search, setSelectedPipeline, selectedPipeline]);

  const {
    showDeleteDialog,
    setShowDeleteDialog,
    isDeleting,
    onDelete,
  } = useDeletePipeline(handleDeletePipeline, selectedPipeline?.id);

  // Custom drag handler with optimistic updates
  const { handleDragEnd: baseHandleDragEnd } = usePipelineDrag(selectedPipeline, leads, refetchLeads);
  
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (!over || !selectedPipeline) return;
    
    const leadId = String(active.id);
    const newColumnId = String(over.id);
    
    // Apply optimistic update
    if (leadId && newColumnId) {
      const targetColumn = selectedPipeline.columns.find(col => col.id === newColumnId);
      if (!targetColumn) return;
      
      // Optimistically update the cache
      queryClient.setQueryData(["leads", selectedPipeline.id], (oldData: any) => {
        if (!oldData) return oldData;
        
        return oldData.map((lead: Lead) => {
          if (lead.id === leadId) {
            return {
              ...lead,
              status: targetColumn.title
            };
          }
          return lead;
        });
      });
    }
    
    // Call the original handler for database updates
    baseHandleDragEnd(event);
  };
  
  const {
    editedColumns,
    handleAddStage,
    handleReorderColumns,
  } = usePipelineColumns(setSelectedPipeline);

  // Get other pipelines (excluding the selected one)
  const otherPipelines = pipelines?.filter(p => p.id !== selectedPipeline?.id) || [];
  
  // Check if the selected pipeline has any leads
  const hasLeads = leads?.some(lead => lead.pipeline_id === selectedPipeline?.id) || false;

  return (
    <div className="relative">
      <div className="p-8 min-h-screen bg-gradient-to-b from-background to-muted/50">
        <div className="mb-6">
          {/* Removed the RefreshButton and its container */}
        </div>
        
        <PipelineHeader 
          pipelines={pipelines || []}
          selectedPipeline={selectedPipeline}
          onCreatePipeline={() => setShowNewPipelineDialog(true)}
          onSelectPipeline={setSelectedPipeline}
        />

        {selectedPipeline && (
          <PipelineStages
            selectedPipeline={selectedPipeline}
            leads={leads || []}
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
          hasLeads={hasLeads}
          otherPipelines={otherPipelines}
        />
      </div>
    </div>
  );
}
