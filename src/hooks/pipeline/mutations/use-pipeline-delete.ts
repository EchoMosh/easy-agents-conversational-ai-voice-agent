
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Pipeline } from "@/types/pipeline";

export function usePipelineDelete(refetchPipelines: () => void, refetchLeads: () => void) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleDeletePipeline = async (pipelineId: string) => {
    try {
      // First, get all leads for this pipeline
      const { data: leads, error: leadsError } = await supabase
        .from("leads")
        .select("id")
        .eq("pipeline_id", pipelineId);

      if (leadsError) throw leadsError;

      // Delete lead activities first
      if (leads && leads.length > 0) {
        const leadIds = leads.map(lead => lead.id);
        const { error: activitiesError } = await supabase
          .from("lead_activities")
          .delete()
          .in("lead_id", leadIds);

        if (activitiesError) throw activitiesError;
      }

      // Delete lead variables
      if (leads && leads.length > 0) {
        const leadIds = leads.map(lead => lead.id);
        const { error: variablesError } = await supabase
          .from("lead_variables")
          .delete()
          .in("lead_id", leadIds);

        if (variablesError) throw variablesError;
      }

      // Delete lead tags
      if (leads && leads.length > 0) {
        const leadIds = leads.map(lead => lead.id);
        const { error: tagsError } = await supabase
          .from("lead_tags")
          .delete()
          .in("lead_id", leadIds);

        if (tagsError) throw tagsError;
      }

      // Delete leads
      const { error: leadsDeleteError } = await supabase
        .from("leads")
        .delete()
        .eq("pipeline_id", pipelineId);

      if (leadsDeleteError) throw leadsDeleteError;

      // Finally delete pipeline
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
        description: "Pipeline and associated leads have been deleted successfully",
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
