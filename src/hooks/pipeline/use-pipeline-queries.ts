import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, withWorkspace } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pipeline, convertJsonToPipeline } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";
import { useWorkspace } from "@/context/workspace-context";
import { useState, useRef, useEffect } from "react";

export function usePipelineQueries(selectedPipelineId?: string) {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspace();
  const [page, setPage] = useState(1);
  const [hasMoreLeads, setHasMoreLeads] = useState(true);
  const pageSize = 10;
  const accumulatedLeadsRef = useRef<Lead[]>([]);
  const [totalFilteredCount, setTotalFilteredCount] = useState<number | null>(null);
  
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

  useEffect(() => {
    const fetchTotalCount = async () => {
      if (!currentWorkspace?.id) return;

      try {
        let query = supabase
          .from("leads")
          .select("id", { count: 'exact' })
          .eq("workspace_id", currentWorkspace.id);
        
        if (selectedPipelineId && selectedPipelineId !== "all") {
          query = query.eq("pipeline_id", selectedPipelineId);
        }

        const { count, error } = await query;
        
        if (error) {
          console.error("Failed to fetch total count", error);
          return;
        }
        
        if (count !== null) {
          setTotalFilteredCount(count);
          
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('totalFilteredLeads', { detail: count }));
          }
        }
      } catch (error) {
        console.error("Error fetching total count:", error);
      }
    };

    fetchTotalCount();
  }, [currentWorkspace?.id, selectedPipelineId]);

  const {
    data: currentPageLeads = [],
    isLoading: isLeadsLoading,
    refetch: refetchLeads,
  } = useQuery({
    queryKey: ["leads", selectedPipelineId, currentWorkspace?.id, page],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];
      
      console.log(`🔄 Loading page ${page} of leads, ${pageSize} leads per page`);
      
      let query = supabase
        .from("leads")
        .select(`
          *,
          variables:lead_variables(*)
        `)
        .eq("workspace_id", currentWorkspace.id);
      
      if (selectedPipelineId && selectedPipelineId !== "all") {
        query = query.eq("pipeline_id", selectedPipelineId);
      }

      query = query
        .order("created_at", { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      const { data, error } = await query;

      if (error) {
        toast.error("Failed to load leads");
        throw error;
      }

      const hasMore = data.length === pageSize;
      console.log(`📊 Loaded ${data.length} leads, hasMore: ${hasMore}`);
      setHasMoreLeads(hasMore);

      if (data.length === 0) {
        return [];
      }

      const leadIds = data.map(lead => lead.id);
      
      const { data: leadTagsData, error: leadTagsError } = await supabase
        .from("lead_tags")
        .select("lead_id, tag_id")
        .in("lead_id", leadIds);
      
      if (leadTagsError) {
        console.error("Failed to load lead tags", leadTagsError);
        return data.map(lead => ({ ...lead, tags: [] })) as Lead[];
      }

      const leadTagsMap = new Map<string, string[]>();
      
      leadTagsData?.forEach(lt => {
        if (!leadTagsMap.has(lt.lead_id)) {
          leadTagsMap.set(lt.lead_id, []);
        }
        leadTagsMap.get(lt.lead_id)?.push(lt.tag_id);
      });
      
      const tagIds = Array.from(new Set(leadTagsData?.map(lt => lt.tag_id) || []));
      
      if (tagIds.length === 0) {
        return data.map(lead => ({ ...lead, tags: [] })) as Lead[];
      }
      
      const { data: tagsData, error: tagsError } = await supabase
        .from("tags")
        .select("*")
        .in("id", tagIds);
      
      if (tagsError) {
        console.error("Failed to load tags data", tagsError);
        return data.map(lead => ({ ...lead, tags: [] })) as Lead[];
      }
      
      const tagsMap = new Map();
      tagsData?.forEach(tag => {
        tagsMap.set(tag.id, tag);
      });
      
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

  useEffect(() => {
    if (currentPageLeads.length > 0) {
      if (page === 1) {
        console.log(`📋 Resetting accumulated leads with ${currentPageLeads.length} leads from page 1`);
        accumulatedLeadsRef.current = [...currentPageLeads];
      } else {
        const existingIds = new Set(accumulatedLeadsRef.current.map(lead => lead.id));
        const newLeads = currentPageLeads.filter(lead => !existingIds.has(lead.id));
        
        console.log(`📋 Adding ${newLeads.length} new leads from page ${page} to existing ${accumulatedLeadsRef.current.length} leads`);
        
        if (newLeads.length > 0) {
          accumulatedLeadsRef.current = [...accumulatedLeadsRef.current, ...newLeads];
        } else {
          console.log(`⚠️ No new unique leads found on page ${page}`);
        }
      }
    }
  }, [currentPageLeads, page]);

  const leads = accumulatedLeadsRef.current;

  const isLoading = isPipelinesLoading || isLeadsLoading || isTagsLoading;

  const invalidateAndRefetch = async () => {
    console.log("🔄 Invalidating queries and resetting state");
    accumulatedLeadsRef.current = [];
    setPage(1);
    setHasMoreLeads(true);
    
    await queryClient.invalidateQueries({ queryKey: ["pipelines"] });
    await queryClient.invalidateQueries({ queryKey: ["leads"] });
    await queryClient.invalidateQueries({ queryKey: ["tags"] });
    await refetchPipelines();
    await refetchLeads();
  };

  const loadMoreLeads = async () => {
    if (!hasMoreLeads) {
      console.log("⚠️ No more leads to load");
      return;
    }
    
    console.log(`⏩ Loading more leads, incrementing page from ${page} to ${page + 1}`);
    setPage(prev => prev + 1);
    
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 100);
    });
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
    totalFilteredCount
  };
}
