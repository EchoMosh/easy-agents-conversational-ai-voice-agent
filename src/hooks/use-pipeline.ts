
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
    invalidateAndRefetch
  } = usePipelineQueries(selectedPipeline?.id);

  const {
    handleEditColumnTitle,
    createNewPipeline,
    handleDeletePipeline: deletePipeline,
    handleEditPipelineName,
  } = usePipelineMutations(invalidateAndRefetch, invalidateAndRefetch);

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

    // Queries - explicitly expose these
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
