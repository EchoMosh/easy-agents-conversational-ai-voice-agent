
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
          // Delete the leads first
          const { error: deleteLeadsError } = await supabase
            .from("leads")
            .delete()
            .eq("pipeline_id", pipelineId);

          if (deleteLeadsError) {
            throw new Error(`Failed to delete leads: ${deleteLeadsError.message}`);
          }
          
          // Clear the leads cache
          queryClient.setQueryData(["leads", pipelineId], []);
          queryClient.setQueryData(["leads", undefined], (old: any[] | undefined) => {
            if (!old) return [];
            return old.filter(lead => lead.pipeline_id !== pipelineId);
          });

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

        // Update the leads cache to reflect the changes
        queryClient.setQueryData(["leads", undefined], (old: any[] | undefined) => {
          if (!old) return [];
          return old.map(lead => 
            lead.pipeline_id === pipelineId 
              ? { ...lead, pipeline_id: null }
              : lead
          );
        });
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

      // Update the cache
      queryClient.setQueryData(["pipelines"], (old: Pipeline[] | undefined) => {
        if (!old) return [];
        return old.filter(p => p.id !== pipelineId);
      });

      console.log("Pipeline deletion completed successfully");
      toast({
        title: "Pipeline deleted",
        description: "Pipeline has been deleted successfully",
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
