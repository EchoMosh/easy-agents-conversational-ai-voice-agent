
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Pipeline } from "@/types/pipeline";
import { useQueryClient } from "@tanstack/react-query";

export function useColumnMutations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleEditColumnTitle = async (pipeline: Pipeline, columnId: string, newTitle: string) => {
    console.log("Updating column title...", { columnId, newTitle });
    const newColumns = [...pipeline.columns];
    const index = newColumns.findIndex(c => c.id === columnId);
    
    if (index === -1) {
      console.error("Column not found:", columnId);
      toast({
        title: "Error",
        description: "Column not found",
        variant: "destructive"
      });
      return;
    }
    
    const oldTitle = newColumns[index].title;
    
    // Check for duplicate stage name
    const isDuplicate = newColumns.some(col => 
      col.id !== columnId && col.title.toLowerCase() === newTitle.toLowerCase()
    );
    
    if (isDuplicate) {
      console.error("Duplicate stage name:", newTitle);
      toast({
        title: "Duplicate stage name",
        description: `A stage named "${newTitle}" already exists in this pipeline. Please choose a different name.`,
        variant: "destructive"
      });
      return;
    }
    
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

      // Then update lead statuses
      const { error: leadsError } = await supabase
        .from("leads")
        .update({ status: newTitle })
        .eq("status", oldTitle)
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

      // Also update the leads cache
      queryClient.setQueryData(["leads", pipeline.id], (oldLeads: any[] | undefined) => {
        if (!oldLeads) return oldLeads;
        return oldLeads.map(lead => 
          lead.status === oldTitle ? { ...lead, status: newTitle } : lead
        );
      });

      console.log("Column title updated successfully");
      toast({
        title: "Stage updated",
        description: "Pipeline stage has been updated successfully"
      });
    } catch (error) {
      console.error("Error updating pipeline stage:", error);
      toast({
        title: "Error",
        description: "Failed to update pipeline stage",
        variant: "destructive"
      });
    }
  };

  return { handleEditColumnTitle };
}
