
import { useState, useEffect } from "react";
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
  } = usePipelineQueries(selectedPipeline?.id);

  const {
    handleEditColumnTitle,
    createNewPipeline,
    handleDeletePipeline: deletePipeline,
    handleEditPipelineName,
  } = usePipelineMutations(refetchPipelines, refetchLeads);

  // Ensure selected pipeline has unique columns
  useEffect(() => {
    if (selectedPipeline) {
      // Check for duplicate column IDs
      const columnIds = selectedPipeline.columns.map(col => col.id);
      const uniqueIds = new Set(columnIds);
      
      if (columnIds.length !== uniqueIds.size) {
        console.warn("Fixing duplicate column IDs in selected pipeline");
        
        // Create a new pipeline object with unique columns
        const uniqueColumnsMap = new Map();
        selectedPipeline.columns.forEach(col => uniqueColumnsMap.set(col.id, col));
        
        setSelectedPipeline({
          ...selectedPipeline,
          columns: Array.from(uniqueColumnsMap.values())
        });
      }
    }
  }, [selectedPipeline]);

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

    // Queries
    refetchPipelines,
    refetchLeads,
    invalidateAndRefetch,

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
