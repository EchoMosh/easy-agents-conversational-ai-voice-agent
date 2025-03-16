
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
        console.warn("Fixing duplicate column IDs in selected pipeline", {
          pipelineName: selectedPipeline.name,
          pipelineId: selectedPipeline.id,
          originalColumnCount: columnIds.length,
          uniqueColumnCount: uniqueIds.size
        });
        
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

  // Custom handler for adding a new stage that prevents duplicates
  const handleAddStage = (stage: PipelineColumn) => {
    if (!selectedPipeline) return;
    
    // Check if a column with this ID already exists
    const existingColumn = selectedPipeline.columns.find(col => col.id === stage.id);
    if (existingColumn) {
      console.warn("Attempted to add a stage with duplicate ID, generating new ID", {
        stageId: stage.id,
        stageTitle: stage.title
      });
      
      // Generate a new unique ID for the stage
      stage = {
        ...stage,
        id: crypto.randomUUID()
      };
    }
    
    // Add the stage using the provided handler
    if (selectedPipeline) {
      const uniqueColumns = Array.from(
        new Map(selectedPipeline.columns.map(col => [col.id, col])).values()
      );
      
      // Create a new array with the unique existing columns plus the new stage
      const newColumns = [...uniqueColumns, stage];
      
      // Update the selected pipeline
      setSelectedPipeline({
        ...selectedPipeline,
        columns: newColumns
      });
    }
  };

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
        // Ensure we're working with unique columns
        const uniqueColumnsMap = new Map();
        selectedPipeline.columns.forEach(col => uniqueColumnsMap.set(col.id, col));
        const uniqueColumns = Array.from(uniqueColumnsMap.values());
        
        // Create a pipeline with unique columns for the edit operation
        const uniquePipeline = {
          ...selectedPipeline,
          columns: uniqueColumns
        };
        
        handleEditColumnTitle(uniquePipeline, columnId, newTitle);
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
    handleAddStage,
  };
}
