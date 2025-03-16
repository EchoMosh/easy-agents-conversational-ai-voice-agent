
import { DragEndEvent } from "@dnd-kit/core";
import { PipelineColumn } from "@/types/pipeline";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useStageReordering(
  onReorderColumns: (newOrder: PipelineColumn[]) => void
) {
  const { toast } = useToast();

  const handleStageReorder = async (
    event: DragEndEvent,
    pipelineId: string,
    columns: PipelineColumn[]
  ) => {
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
    
    // Update the pipeline with the new column order
    const columnsForDb = newColumns.map(col => ({
      id: col.id,
      title: col.title,
      color: col.color
    }));
    
    try {
      const { error } = await supabase
        .from("pipelines")
        .update({
          columns: columnsForDb
        })
        .eq("id", pipelineId);
        
      if (error) throw error;
      
      // Update the UI
      onReorderColumns(newColumns);
      
      toast({
        title: "Stages reordered",
        description: "Pipeline stages have been reordered successfully"
      });
    } catch (error) {
      console.error("Error reordering stages:", error);
      toast({
        title: "Error",
        description: "Failed to reorder stages",
        variant: "destructive"
      });
    }
  };

  return { handleStageReorder };
}
