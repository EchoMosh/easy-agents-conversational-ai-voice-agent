
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { PipelineColumn } from "@/types/pipeline";
import { useQueryClient } from "@tanstack/react-query";

export function usePipelineColumns(
  setSelectedPipeline: (updateFn: ((prev: any) => any) | null) => void
) {
  const { toast } = useToast();
  const [editedColumns, setEditedColumns] = useState<PipelineColumn[]>([]);
  const queryClient = useQueryClient();

  const handleAddStage = (newStage: PipelineColumn) => {
    setEditedColumns(prev => [...prev, newStage]);
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
      toast({
        title: "Error",
        description: "Failed to update pipeline columns",
        variant: "destructive",
      });
    }
  };

  return {
    editedColumns,
    setEditedColumns,
    handleAddStage,
    handleReorderColumns,
  };
}
