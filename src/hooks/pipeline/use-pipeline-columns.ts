
import { useState } from "react";
import { PipelineColumn } from "@/types/pipeline";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function usePipelineColumns(
  setSelectedPipeline: (updateFn: ((prev: any) => any) | null) => void
) {
  const [editedColumns, setEditedColumns] = useState<PipelineColumn[]>([]);
  const queryClient = useQueryClient();

  const handleAddStage = (newStage: PipelineColumn) => {
    setEditedColumns(prev => [...prev, newStage]);
    
    // Update the selected pipeline with the new column
    setSelectedPipeline(prev => {
      if (!prev) return null;
      return { 
        ...prev, 
        columns: [...(prev.columns || []), newStage] 
      };
    });
  };

  const handleReorderColumns = async (newColumns: PipelineColumn[]) => {
    try {
      setEditedColumns(newColumns);
      
      // Update the selected pipeline with the new columns
      setSelectedPipeline(prev => {
        if (!prev) return null;
        return { ...prev, columns: newColumns };
      });
      
    } catch (error) {
      console.error("Error updating columns:", error);
      toast.error("Failed to update pipeline columns");
    }
  };

  return {
    editedColumns,
    setEditedColumns,
    handleAddStage,
    handleReorderColumns,
  };
}
