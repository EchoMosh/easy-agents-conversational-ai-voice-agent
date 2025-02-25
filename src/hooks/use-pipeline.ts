
import { useState } from "react";
import { Pipeline, PipelineColumn } from "@/types/pipeline";
import { usePipelineQueries } from "./pipeline/use-pipeline-queries";
import { usePipelineMutations } from "./pipeline/use-pipeline-mutations";
export { defaultColumns } from "./pipeline/default-columns";

export function usePipeline() {
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [editedColumns, setEditedColumns] = useState<PipelineColumn[]>([]);
  const [showNewPipelineDialog, setShowNewPipelineDialog] = useState(false);

  const { 
    pipelines, 
    leads, 
    refetchPipelines, 
    refetchLeads 
  } = usePipelineQueries(selectedPipeline?.id);

  const {
    handleEditColumnTitle,
    createNewPipeline,
    handleDeletePipeline: deletePipeline,
    handleEditPipelineName,
  } = usePipelineMutations(refetchPipelines, refetchLeads);

  return {
    // State
    pipelines,
    leads,
    selectedPipeline,
    editedColumns,
    showNewPipelineDialog,

    // State setters
    setSelectedPipeline,
    setEditedColumns,
    setShowNewPipelineDialog,

    // Actions
    handleEditColumnTitle: (columnId: string, newTitle: string) => {
      if (selectedPipeline) {
        handleEditColumnTitle(selectedPipeline, columnId, newTitle);
      }
    },
    handleEditPipelineName: (name: string) => {
      if (selectedPipeline) {
        handleEditPipelineName(selectedPipeline.id, name);
      }
    },
    handleDeletePipeline: async () => {
      if (selectedPipeline) {
        const pipelineId = selectedPipeline.id;
        // First set selected pipeline to null to ensure consistent hook behavior
        setSelectedPipeline(null);
        // Then perform the delete operation
        await deletePipeline(pipelineId);
      }
    },
    createNewPipeline: async (name: string) => {
      await createNewPipeline(name);
      setShowNewPipelineDialog(false);
    },
  };
}
