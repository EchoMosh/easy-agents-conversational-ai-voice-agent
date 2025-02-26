
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
          // Delete all lead associations first
          await Promise.all([
            // Delete lead variables
            supabase
              .from("lead_variables")
              .delete()
              .in("lead_id", leadsToDelete.map(l => l.id)),
            
            // Delete lead tags
            supabase
              .from("lead_tags")
              .delete()
              .in("lead_id", leadsToDelete.map(l => l.id)),
            
            // Delete lead activities
            supabase
              .from("lead_activities")
              .delete()
              .in("lead_id", leadsToDelete.map(l => l.id)),
            
            // Delete lead notes
            supabase
              .from("lead_notes")
              .delete()
              .in("lead_id", leadsToDelete.map(l => l.id))
          ]);

          // Then delete the leads
          const { error: deleteLeadsError } = await supabase
            .from("leads")
            .delete()
            .eq("pipeline_id", pipelineId);

          if (deleteLeadsError) {
            throw new Error(`Failed to delete leads: ${deleteLeadsError.message}`);
          }

          // Invalidate all related queries
          await queryClient.invalidateQueries({ queryKey: ["leads"] });
          
          console.log("Successfully deleted all leads and their associated data");
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
        description: "Pipeline and associated data deleted successfully",
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
