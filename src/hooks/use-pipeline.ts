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
    refetchLeads,
    invalidateAndRefetch,
    isLoading,
    isFetching,
    isPending
  } = usePipelineQueries(selectedPipeline?.id);

  const {
    handleEditColumnTitle,
    createNewPipeline,
    handleDeletePipeline: deletePipeline,
    handleEditPipelineName,
    isUpdatingPipelineName,
  } = usePipelineMutations(invalidateAndRefetch, invalidateAndRefetch);

  console.log("Pipeline Hook States:", {
    isLoading,
    isFetching,
    isPending,
    isUpdatingPipelineName
  });

  return {
    // State
    pipelines,
    leads,
    selectedPipeline,
    editedColumns,
    showNewPipelineDialog,
    isLoading: isLoading || isPending || isFetching || isUpdatingPipelineName,

    // State setters
    setSelectedPipeline,
    setEditedColumns,
    setShowNewPipelineDialog,

    // Queries
    refetchPipelines,
    refetchLeads,

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
        await deletePipeline(selectedPipeline.id);
        setSelectedPipeline(null);
      }
    },
    createNewPipeline: async (name: string) => {
      await createNewPipeline(name);
      setShowNewPipelineDialog(false);
    },
  };
}
