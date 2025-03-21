
import { supabase } from "@/integrations/supabase/client";
import { Pipeline, PipelineColumn } from "@/types/pipeline";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function useColumnMutations() {
  const queryClient = useQueryClient();

  // Helper function to get the first column/stage of a pipeline
  const getFirstColumnTitle = (pipeline: Pipeline): string => {
    if (pipeline.columns && pipeline.columns.length > 0) {
      return pipeline.columns[0].title;
    }
    return "New"; // Fallback in case there are no columns (shouldn't happen)
  };

  const handleEditColumnTitle = async (pipeline: Pipeline, columnId: string, newTitle: string) => {
    console.log("Updating column title...", { columnId, newTitle });
    const newColumns = [...pipeline.columns];
    const index = newColumns.findIndex(c => c.id === columnId);
    
    if (index === -1) {
      console.error("Column not found:", columnId);
      toast.error("Column not found");
      return;
    }
    
    // Check if the new title already exists (case insensitive)
    const duplicateTitle = newColumns.some((col, idx) => 
      idx !== index && col.title.toLowerCase() === newTitle.toLowerCase()
    );
    
    if (duplicateTitle) {
      console.error("Duplicate column title:", newTitle);
      toast.error("A stage with this name already exists");
      return;
    }
    
    const oldTitle = newColumns[index].title;
    newColumns[index] = { ...newColumns[index], title: newTitle };

    try {
      const columnsJson = newColumns.map(col => ({
        id: col.id,
        title: col.title,
        color: col.color,
      }));

      // First update pipeline columns
      const { error } = await supabase
        .from("pipelines")
        .update({
          columns: columnsJson
        })
        .eq("id", pipeline.id);

      if (error) throw error;

      // Then update lead statuses - make sure we use case-insensitive matching
      // This is critical for the leads to stay visible after a stage rename
      const { error: leadsError } = await supabase
        .from("leads")
        .update({ status: newTitle })
        .filter('status', 'ilike', oldTitle)
        .eq('pipeline_id', pipeline.id);

      if (leadsError) throw leadsError;

      // Create a completely new pipeline object to force a re-render
      const updatedPipeline = {
        ...pipeline,
        columns: newColumns,
      };

      // Update the pipeline in the cache with the new object
      queryClient.setQueryData(["pipelines"], (old: Pipeline[] | undefined) => {
        if (!old) return old;
        return old.map(p => 
          p.id === pipeline.id ? updatedPipeline : p
        );
      });

      // Also update the leads cache to reflect the new status
      queryClient.setQueryData(["leads"], (oldLeads: any[] | undefined) => {
        if (!oldLeads) return oldLeads;
        return oldLeads.map(lead => 
          (lead.pipeline_id === pipeline.id && 
           lead.status.toLowerCase() === oldTitle.toLowerCase()) 
            ? { ...lead, status: newTitle } 
            : lead
        );
      });

      console.log("Column title updated successfully");
      toast.success("Pipeline stage has been updated successfully");
    } catch (error) {
      console.error("Error updating pipeline stage:", error);
      toast.error("Failed to update pipeline stage");
    }
  };

  return { handleEditColumnTitle, getFirstColumnTitle };
}
