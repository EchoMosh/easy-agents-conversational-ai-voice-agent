
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, withWorkspace } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pipeline, convertJsonToPipeline } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";
import { useWorkspace } from "@/context/workspace-context";

export function usePipelineQueries(selectedPipelineId?: string) {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspace();
  
  // Fetch pipelines
  const {
    data: pipelines = [],
    isLoading: isPipelinesLoading,
    refetch: refetchPipelines,
  } = useQuery({
    queryKey: ["pipelines", currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];
      
      const { data, error } = await supabase
        .from("pipelines")
        .select("*")
        .eq("workspace_id", currentWorkspace.id)
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load pipelines");
        throw error;
      }
      
      return (data || []).map(convertJsonToPipeline);
    },
    enabled: !!currentWorkspace?.id,
  });

  // Fetch leads for the selected pipeline or all leads if no pipeline is selected
  const {
    data: leads = [],
    isLoading: isLeadsLoading,
    refetch: refetchLeads,
  } = useQuery({
    queryKey: ["leads", selectedPipelineId, currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];
      
      let query = supabase
        .from("leads")
        .select(`
          *,
          variables:lead_variables(*),
          tags:lead_tags(tag_id)
        `)
        .eq("workspace_id", currentWorkspace.id);
      
      if (selectedPipelineId && selectedPipelineId !== "all") {
        query = query.eq("pipeline_id", selectedPipelineId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load leads");
        throw error;
      }

      // Process the tags to get the actual tag data
      const leadsWithTags = await Promise.all(
        (data || []).map(async (lead) => {
          if (!lead.tags || lead.tags.length === 0) {
            return { ...lead, tags: [] };
          }

          const tagIds = lead.tags.map((tag: any) => tag.tag_id);
          
          const { data: tagsData, error: tagsError } = await supabase
            .from("tags")
            .select("*")
            .in("id", tagIds);

          if (tagsError) {
            console.error("Failed to load tags", tagsError);
            return { ...lead, tags: [] };
          }

          return { ...lead, tags: tagsData || [] };
        })
      );

      return leadsWithTags as Lead[];
    },
    enabled: !!currentWorkspace?.id,
  });

  const isLoading = isPipelinesLoading || isLeadsLoading;

  const invalidateAndRefetch = async () => {
    await queryClient.invalidateQueries({ queryKey: ["pipelines"] });
    await queryClient.invalidateQueries({ queryKey: ["leads"] });
    await refetchPipelines();
    await refetchLeads();
  };

  return {
    pipelines,
    leads,
    isLoading,
    isPipelinesLoading,
    isLeadsLoading,
    refetchPipelines,
    refetchLeads,
    invalidateAndRefetch,
  };
}
