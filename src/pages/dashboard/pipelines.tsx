
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useDroppable } from "@dnd-kit/core";
import { Lead } from "@/pages/dashboard/leads";
import { Pipeline } from "@/types/pipeline";
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
  const navigate = useNavigate();
  
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

  useEffect(() => {
    if (pipelines?.length > 0) {
      const params = new URLSearchParams(location.search);
      const selectedPipelineId = params.get('selected');
      
      if (selectedPipelineId) {
        const pipelineToSelect = pipelines.find(p => p.id === selectedPipelineId);
        if (pipelineToSelect) {
          console.log("Setting selected pipeline from URL parameter:", pipelineToSelect.name);
          setSelectedPipeline(pipelineToSelect);
          return;
        }
      }
      
      if (!selectedPipeline) {
        setSelectedPipeline(pipelines[0]);
      }
    }
  }, [pipelines, location.search, setSelectedPipeline, selectedPipeline]);

  const handleSelectPipeline = (pipeline: Pipeline) => {
    console.log("Pipeline selected:", pipeline.name);
    setSelectedPipeline(pipeline);
    navigate(`/dashboard/pipelines?selected=${pipeline.id}`, { replace: true });
  };

  const {
    showDeleteDialog,
    setShowDeleteDialog,
    isDeleting,
    onDelete,
  } = useDeletePipeline(handleDeletePipeline, selectedPipeline?.id);

  const { handleDragEnd: baseHandleDragEnd } = usePipelineDrag(selectedPipeline, leads, refetchLeads);
  
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (!over || !selectedPipeline) return;
    
    const leadId = String(active.id);
    const newColumnId = String(over.id);
    
    if (leadId && newColumnId) {
      const targetColumn = selectedPipeline.columns.find(col => col.id === newColumnId);
      if (!targetColumn) return;
      
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
    
    baseHandleDragEnd(event);
  };
  
  const {
    editedColumns,
    handleAddStage,
    handleReorderColumns,
  } = usePipelineColumns(setSelectedPipeline);

  const otherPipelines = pipelines?.filter(p => p.id !== selectedPipeline?.id) || [];
  
  const hasLeads = leads?.some(lead => lead.pipeline_id === selectedPipeline?.id) || false;

  return (
    <div className="relative">
      <div className="px-8 py-6 min-h-screen bg-gradient-to-b from-background to-muted/10">
        <PipelineHeader 
          pipelines={pipelines || []}
          selectedPipeline={selectedPipeline}
          onCreatePipeline={() => setShowNewPipelineDialog(true)}
          onSelectPipeline={handleSelectPipeline}
        />

        {selectedPipeline && (
          <div className="mt-6">
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
              allPipelines={pipelines || []}
            />
          </div>
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
