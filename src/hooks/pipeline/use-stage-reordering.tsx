
import { DragEndEvent } from "@dnd-kit/core";
import { PipelineColumn } from "@/types/pipeline";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export function useStageReordering(
  onReorderColumns: (newOrder: PipelineColumn[]) => void
) {
  const { toast } = useToast();
  const [isReordering, setIsReordering] = useState(false);
  const queryClient = useQueryClient();

  const handleStageReorder = async (
    event: DragEndEvent,
    pipelineId: string,
    columns: PipelineColumn[]
  ) => {
    // Only proceed if not already reordering to prevent multiple reorder operations
    if (isReordering) return;
    
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    // Find indices of the columns being reordered
    const oldIndex = columns.findIndex(col => col.id === active.id);
    const newIndex = columns.findIndex(col => col.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    // Create a new array with the columns in the new order
    const newColumns = [...columns];
    const [movedColumn] = newColumns.splice(oldIndex, 1);
    newColumns.splice(newIndex, 0, movedColumn);
    
    // Set reordering state to prevent multiple concurrent reorderings
    setIsReordering(true);
    
    // Important: Update the UI first to prevent the jumping
    onReorderColumns(newColumns);
    
    // Update all relevant states with the new order immediately
    queryClient.setQueryData(["pipelines"], (oldData: any) => {
      if (!oldData) return oldData;
      
      return oldData.map((pipeline: any) => {
        if (pipeline.id === pipelineId) {
          return {
            ...pipeline,
            columns: newColumns
          };
        }
        return pipeline;
      });
    });
    
    // Prepare the data for database update
    const columnsForDb = newColumns.map(col => ({
      id: col.id,
      title: col.title,
      color: col.color
    }));
    
    try {
      // Update the database in the background
      const { error } = await supabase
        .from("pipelines")
        .update({
          columns: columnsForDb
        })
        .eq("id", pipelineId);
        
      if (error) throw error;
      
      toast({
        title: "Stages reordered",
        description: "Pipeline stages have been reordered successfully"
      });
    } catch (error) {
      console.error("Error reordering stages:", error);
      
      // In case of error, revert back to original order in the cache
      queryClient.setQueryData(["pipelines"], (oldData: any) => {
        if (!oldData) return oldData;
        
        return oldData.map((pipeline: any) => {
          if (pipeline.id === pipelineId) {
            return {
              ...pipeline,
              columns
            };
          }
          return pipeline;
        });
      });
      
      // Also revert the UI
      onReorderColumns(columns);
      
      toast({
        title: "Error",
        description: "Failed to reorder stages",
        variant: "destructive"
      });
    } finally {
      // Clear the reordering flag after a brief delay to ensure smooth animation
      setTimeout(() => {
        setIsReordering(false);
      }, 300);
    }
  };

  return { handleStageReorder, isReordering };
}
