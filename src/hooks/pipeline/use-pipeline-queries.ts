
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

  // Fetch all available tags for filtering
  const {
    data: availableTags = [],
    isLoading: isTagsLoading,
  } = useQuery({
    queryKey: ["tags", currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];
      
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("workspace_id", currentWorkspace.id)
        .order("name");

      if (error) {
        console.error("Failed to load tags", error);
        return [];
      }
      
      return data || [];
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
          lead_tags!inner(tag_id)
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

      // Now fetch tags for all leads in a single query for better performance
      const leadTagsMap = new Map();
      
      // Get unique tag IDs from all leads
      const tagIds = new Set<string>();
      data.forEach(lead => {
        if (lead.lead_tags && lead.lead_tags.length > 0) {
          lead.lead_tags.forEach((tagRelation: any) => {
            if (typeof tagRelation.tag_id === 'string') {
              tagIds.add(tagRelation.tag_id);
            }
          });
        }
      });
      
      if (tagIds.size > 0) {
        // Fetch all tag data in a single query
        const { data: tagsData, error: tagsError } = await supabase
          .from("tags")
          .select("*")
          .in("id", Array.from(tagIds) as string[]);
  
        if (!tagsError && tagsData) {
          // Create a map of tag id -> tag data for easy lookup
          tagsData.forEach(tag => {
            leadTagsMap.set(tag.id, tag);
          });
        }
      }
      
      // Process the leads data with the tags
      const processedLeads = data.map(lead => {
        const tags = [];
        if (lead.lead_tags && lead.lead_tags.length > 0) {
          lead.lead_tags.forEach((tagRelation: any) => {
            const tag = leadTagsMap.get(tagRelation.tag_id);
            if (tag) {
              tags.push(tag);
            }
          });
        }
        
        return {
          ...lead,
          tags,
          lead_tags: undefined // Remove the original lead_tags array
        };
      });

      return processedLeads as Lead[];
    },
    enabled: !!currentWorkspace?.id,
  });

  const isLoading = isPipelinesLoading || isLeadsLoading || isTagsLoading;

  const invalidateAndRefetch = async () => {
    await queryClient.invalidateQueries({ queryKey: ["pipelines"] });
    await queryClient.invalidateQueries({ queryKey: ["leads"] });
    await queryClient.invalidateQueries({ queryKey: ["tags"] });
    await refetchPipelines();
    await refetchLeads();
  };

  return {
    pipelines,
    leads,
    availableTags,
    isLoading,
    isPipelinesLoading,
    isLeadsLoading,
    refetchPipelines,
    refetchLeads,
    invalidateAndRefetch,
  };
}
