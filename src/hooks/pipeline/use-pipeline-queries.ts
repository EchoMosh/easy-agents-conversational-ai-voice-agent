
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, withWorkspace } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pipeline, convertJsonToPipeline } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";
import { useWorkspace } from "@/context/workspace-context";
import { useState, useRef } from "react";

export function usePipelineQueries(selectedPipelineId?: string) {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspace();
  const [page, setPage] = useState(1);
  const [hasMoreLeads, setHasMoreLeads] = useState(true);
  const pageSize = 25; // Number of leads to load per page
  const accumulatedLeadsRef = useRef<Lead[]>([]);
  
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
    data: currentPageLeads = [],
    isLoading: isLeadsLoading,
    refetch: refetchLeads,
  } = useQuery({
    queryKey: ["leads", selectedPipelineId, currentWorkspace?.id, page],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];
      
      // Start building the query
      let query = supabase
        .from("leads")
        .select(`
          *,
          variables:lead_variables(*)
        `)
        .eq("workspace_id", currentWorkspace.id);
      
      // Add pipeline filter if a specific pipeline is selected
      if (selectedPipelineId && selectedPipelineId !== "all") {
        query = query.eq("pipeline_id", selectedPipelineId);
      }

      // Add pagination
      query = query
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      // Execute the query
      const { data, error } = await query;

      if (error) {
        toast.error("Failed to load leads");
        throw error;
      }

      // Check if we have more leads to load
      setHasMoreLeads(data.length === pageSize);

      // If there are no leads, return empty array
      if (data.length === 0) {
        return [];
      }

      // Now fetch tags for all leads in a single query
      const leadIds = data.map(lead => lead.id);
      
      const { data: leadTagsData, error: leadTagsError } = await supabase
        .from("lead_tags")
        .select("lead_id, tag_id")
        .in("lead_id", leadIds);
      
      if (leadTagsError) {
        console.error("Failed to load lead tags", leadTagsError);
        return data;
      }

      // Create a map of lead_id -> tag_ids
      const leadTagsMap = new Map<string, string[]>();
      
      leadTagsData?.forEach(lt => {
        if (!leadTagsMap.has(lt.lead_id)) {
          leadTagsMap.set(lt.lead_id, []);
        }
        leadTagsMap.get(lt.lead_id)?.push(lt.tag_id);
      });
      
      // Get all unique tag IDs to fetch tag data
      const tagIds = Array.from(new Set(leadTagsData?.map(lt => lt.tag_id) || []));
      
      if (tagIds.length === 0) {
        // No tags to fetch, return leads without tags
        return data.map(lead => ({ ...lead, tags: [] }));
      }
      
      // Fetch all tags data in a single query
      const { data: tagsData, error: tagsError } = await supabase
        .from("tags")
        .select("*")
        .in("id", tagIds);
      
      if (tagsError) {
        console.error("Failed to load tags data", tagsError);
        return data.map(lead => ({ ...lead, tags: [] }));
      }
      
      // Create a map of tag_id -> tag data
      const tagsMap = new Map();
      tagsData?.forEach(tag => {
        tagsMap.set(tag.id, tag);
      });
      
      // Combine lead data with tags
      const leadsWithTags = data.map(lead => {
        const leadTagIds = leadTagsMap.get(lead.id) || [];
        const tags = leadTagIds.map(tagId => tagsMap.get(tagId)).filter(Boolean);
        
        return {
          ...lead,
          tags
        };
      });
      
      return leadsWithTags as Lead[];
    },
    enabled: !!currentWorkspace?.id,
  });

  // Combine previous and current page leads
  if (currentPageLeads.length > 0) {
    // If it's the first page, replace accumulated leads
    if (page === 1) {
      accumulatedLeadsRef.current = [...currentPageLeads];
    } else {
      // For subsequent pages, filter out any duplicates and append
      const newLeads = currentPageLeads.filter(
        newLead => !accumulatedLeadsRef.current.some(
          existingLead => existingLead.id === newLead.id
        )
      );
      accumulatedLeadsRef.current = [...accumulatedLeadsRef.current, ...newLeads];
    }
  }

  // Use the accumulated leads as our data source
  const leads = accumulatedLeadsRef.current;

  const isLoading = isPipelinesLoading || isLeadsLoading || isTagsLoading;

  const invalidateAndRefetch = async () => {
    // Reset accumulated leads when explicitly refreshing
    accumulatedLeadsRef.current = [];
    setPage(1);
    
    await queryClient.invalidateQueries({ queryKey: ["pipelines"] });
    await queryClient.invalidateQueries({ queryKey: ["leads"] });
    await queryClient.invalidateQueries({ queryKey: ["tags"] });
    await refetchPipelines();
    await refetchLeads();
  };

  const loadMoreLeads = async () => {
    setPage(prev => prev + 1);
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
    hasMoreLeads,
    loadMoreLeads,
  };
}
