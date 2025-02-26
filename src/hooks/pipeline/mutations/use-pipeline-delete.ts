import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Pipeline } from "@/types/pipeline";

export function usePipelineDelete(refetchPipelines: () => void, refetchLeads: () => void) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDeletePipeline = async (
    pipelineId: string,
    option: "keep" | "move" = "keep",
    targetPipelineId?: string
  ) => {
    try {
      console.log("Deleting pipeline with option:", option);

      if (option === "move" && targetPipelineId) {
        console.log("Moving leads to pipeline:", targetPipelineId);
        const { error: moveError } = await supabase
          .from("leads")
          .update({ pipeline_id: targetPipelineId })
          .eq("pipeline_id", pipelineId);

        if (moveError) {
          throw new Error(`Failed to move leads: ${moveError.message}`);
        }
      } else {
        // Default to keeping leads without pipeline
        console.log("Keeping leads without pipeline");
        const { error: keepLeadsError } = await supabase
          .from("leads")
          .update({ pipeline_id: null })
          .eq("pipeline_id", pipelineId);

        if (keepLeadsError) {
          throw new Error(`Failed to update leads: ${keepLeadsError.message}`);
        }
      }

      // Delete the pipeline
      console.log("Deleting pipeline:", pipelineId);
      const { error: pipelineError } = await supabase
        .from("pipelines")
        .delete()
        .eq("id", pipelineId);

      if (pipelineError) {
        throw new Error(`Failed to delete pipeline: ${pipelineError.message}`);
      }

      // Invalidate both pipelines and leads queries
      await queryClient.invalidateQueries({ queryKey: ["pipelines"] });
      await queryClient.invalidateQueries({ queryKey: ["leads"] });

      console.log("Pipeline deletion completed successfully");
      toast({
        title: "Pipeline deleted",
        description: "Pipeline deleted successfully",
      });

      // Refresh the data
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
      throw error;
    }
  };

  return { handleDeletePipeline };
}
