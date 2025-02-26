
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Pipeline } from "@/types/pipeline";

export function usePipelineDelete(refetchPipelines: () => void, refetchLeads: () => void) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDeletePipeline = async (
    pipelineId: string,
    option: "keep" | "move" | "delete" = "keep",
    targetPipelineId?: string
  ) => {
    try {
      // First, handle the leads based on the selected option
      if (option === "move" && targetPipelineId) {
        // Move leads to the target pipeline
        const { error: moveError } = await supabase
          .from("leads")
          .update({ pipeline_id: targetPipelineId })
          .eq("pipeline_id", pipelineId);

        if (moveError) throw moveError;
      } else if (option === "delete") {
        // Delete all leads in this pipeline
        const { error: deleteLeadsError } = await supabase
          .from("leads")
          .delete()
          .eq("pipeline_id", pipelineId);

        if (deleteLeadsError) throw deleteLeadsError;
      } else if (option === "keep") {
        // Set pipeline_id to null for all leads in this pipeline
        const { error: keepLeadsError } = await supabase
          .from("leads")
          .update({ pipeline_id: null })
          .eq("pipeline_id", pipelineId);

        if (keepLeadsError) throw keepLeadsError;
      }

      // Finally delete the pipeline
      const { error: pipelineError } = await supabase
        .from("pipelines")
        .delete()
        .eq("id", pipelineId);

      if (pipelineError) throw pipelineError;

      // Remove the pipeline from the cache immediately
      queryClient.setQueryData(["pipelines"], (old: Pipeline[] | undefined) => {
        if (!old) return old;
        return old.filter(p => p.id !== pipelineId);
      });

      // Remove the leads data for this pipeline from the cache
      queryClient.removeQueries({
        queryKey: ["leads", pipelineId],
      });

      toast({
        title: "Pipeline deleted",
        description: "Pipeline has been deleted successfully",
      });

      // Refresh data to ensure everything is in sync
      await Promise.all([
        refetchPipelines(),
        refetchLeads()
      ]);
    } catch (error) {
      console.error("Error deleting pipeline:", error);
      toast({
        title: "Error",
        description: "Failed to delete pipeline",
        variant: "destructive",
      });
    }
  };

  return { handleDeletePipeline };
}
