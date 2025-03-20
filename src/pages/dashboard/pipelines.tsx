
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Lead } from "@/pages/dashboard/leads";
import { Pipeline, PipelineColumn } from "@/types/pipeline";
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

export default function PipelinesPage() {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
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
    invalidateAndRefetch,
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

  const {
    showDeleteDialog,
    setShowDeleteDialog,
    isDeleting,
    onDelete,
  } = useDeletePipeline(handleDeletePipeline, selectedPipeline?.id);

  const { handleDragEnd, handleDragOver, isUpdating, previewColumnId, previewIndex } = usePipelineDrag(selectedPipeline, leads, invalidateAndRefetch);
  
  const {
    handleAddStage,
    handleReorderColumns,
  } = usePipelineColumns(setSelectedPipeline);

  const otherPipelines = pipelines?.filter(p => p.id !== selectedPipeline?.id) || [];
  
  const hasLeads = leads?.some(lead => lead.pipeline_id === selectedPipeline?.id) || false;

  const pipelineColumns: PipelineColumn[] = selectedPipeline?.columns.map(col => ({
    id: col.id,
    title: col.title,
    color: col.color || "bg-gray-500" // Default color if missing
  })) || defaultColumns;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 md:px-6 pt-2 pb-1">
          <PipelineHeader 
            pipelines={pipelines || []}
            selectedPipeline={selectedPipeline}
            onCreatePipeline={() => setShowNewPipelineDialog(true)}
            onSelectPipeline={handleSelectPipeline}
          />
        </div>

        {selectedPipeline && (
          <div className="flex-1 overflow-hidden">
            <PipelineStages
              selectedPipeline={selectedPipeline}
              leads={leads || []}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              previewColumnId={previewColumnId}
              previewIndex={previewIndex}
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
          columns={pipelineColumns}
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

  function handleSelectPipeline(pipeline: Pipeline) {
    console.log("Pipeline selected:", pipeline.name);
    setSelectedPipeline(pipeline);
    navigate(`/dashboard/pipelines?selected=${pipeline.id}`, { replace: true });
    
    // This forces a re-render with the updated pipeline selection
    setTimeout(() => {
      invalidateAndRefetch();
    }, 100);
  }
}
