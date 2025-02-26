
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
      console.log("Deleting pipeline with option:", option);

      // First, handle the leads based on the selected option
      if (option === "move" && targetPipelineId) {
        console.log("Moving leads to pipeline:", targetPipelineId);
        const { error: moveError } = await supabase
          .from("leads")
          .update({ pipeline_id: targetPipelineId })
          .eq("pipeline_id", pipelineId);

        if (moveError) {
          throw new Error(`Failed to move leads: ${moveError.message}`);
        }
      } else if (option === "delete") {
        console.log("Deleting all leads in pipeline:", pipelineId);
        
        // First verify if there are any leads to delete
        const { data: leadsToDelete, error: checkError } = await supabase
          .from("leads")
          .select("id")
          .eq("pipeline_id", pipelineId);

        if (checkError) {
          throw new Error(`Failed to check leads: ${checkError.message}`);
        }

        console.log(`Found ${leadsToDelete?.length || 0} leads to delete`);

        if (leadsToDelete && leadsToDelete.length > 0) {
          // Delete all leads in this pipeline
          const { error: deleteLeadsError } = await supabase
            .from("leads")
            .delete()
            .eq("pipeline_id", pipelineId);

          if (deleteLeadsError) {
            throw new Error(`Failed to delete leads: ${deleteLeadsError.message}`);
          }

          // Verify deletion
          const { data: checkRemaining, error: verifyError } = await supabase
            .from("leads")
            .select("id")
            .eq("pipeline_id", pipelineId);

          if (verifyError) {
            throw new Error(`Failed to verify lead deletion: ${verifyError.message}`);
          }

          if (checkRemaining && checkRemaining.length > 0) {
            throw new Error("Failed to delete all leads in the pipeline");
          }

          console.log("Successfully deleted all leads in the pipeline");
        }
      } else if (option === "keep") {
        console.log("Keeping leads without pipeline");
        const { error: keepLeadsError } = await supabase
          .from("leads")
          .update({ pipeline_id: null })
          .eq("pipeline_id", pipelineId);

        if (keepLeadsError) {
          throw new Error(`Failed to update leads: ${keepLeadsError.message}`);
        }

        // Verify the update was successful
        const { data: checkLeads, error: checkError } = await supabase
          .from("leads")
          .select("id")
          .eq("pipeline_id", pipelineId);

        if (checkError) {
          throw new Error(`Failed to verify lead updates: ${checkError.message}`);
        }

        if (checkLeads && checkLeads.length > 0) {
          throw new Error("Failed to remove pipeline from leads");
        }
      }

      // Only delete the pipeline if lead operations were successful
      console.log("Deleting pipeline:", pipelineId);
      const { error: pipelineError } = await supabase
        .from("pipelines")
        .delete()
        .eq("id", pipelineId);

      if (pipelineError) {
        throw new Error(`Failed to delete pipeline: ${pipelineError.message}`);
      }

      // Remove the pipeline from the cache immediately
      queryClient.setQueryData(["pipelines"], (old: Pipeline[] | undefined) => {
        if (!old) return old;
        return old.filter(p => p.id !== pipelineId);
      });

      // Remove the leads data for this pipeline from the cache
      queryClient.removeQueries({
        queryKey: ["leads", pipelineId],
      });

      console.log("Pipeline deletion completed successfully");
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
        description: error instanceof Error ? error.message : "Failed to delete pipeline",
        variant: "destructive",
      });
      throw error; // Re-throw to be handled by the calling code
    }
  };

  return { handleDeletePipeline };
}
