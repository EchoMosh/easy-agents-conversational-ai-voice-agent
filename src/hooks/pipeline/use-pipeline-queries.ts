
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Pipeline, convertJsonToPipeline } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";

export function usePipelineQueries(selectedPipelineId: string | undefined) {
  const queryClient = useQueryClient();

  const { 
    data: pipelines = [], 
    refetch: refetchPipelines, 
    isLoading: isPipelinesLoading,
    isFetching: isPipelinesFetching,
    isPending: isPipelinesPending
  } = useQuery({
    queryKey: ["pipelines"],
    queryFn: async () => {
      console.log("Fetching pipelines...");
      const { data, error } = await supabase
        .from("pipelines")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      console.log("Pipelines fetched:", data?.length);
      return (data || []).map(convertJsonToPipeline);
    },
    staleTime: 0,
    gcTime: 0,
  });

  const { 
    data: leads = [], 
    refetch: refetchLeads, 
    isLoading: isLeadsLoading,
    isFetching: isLeadsFetching,
    isPending: isLeadsPending 
  } = useQuery({
    queryKey: ["leads", selectedPipelineId],
    queryFn: async () => {
      console.log("Fetching leads for pipeline:", selectedPipelineId);
      if (!selectedPipelineId) return [];
      
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq('pipeline_id', selectedPipelineId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      console.log("Leads fetched:", data?.length);
      return data as unknown as Lead[];
    },
    enabled: !!selectedPipelineId,
    staleTime: 0,
    gcTime: 0,
  });

  console.log("Query States:", {
    isPipelinesLoading,
    isPipelinesFetching,
    isPipelinesPending,
    isLeadsLoading,
    isLeadsFetching,
    isLeadsPending
  });

  const invalidateAndRefetch = async () => {
    console.log("Starting invalidation and refetch...");
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["pipelines"] }),
      queryClient.invalidateQueries({ queryKey: ["leads", selectedPipelineId] }),
      refetchPipelines(),
      refetchLeads()
    ]);
    console.log("Invalidation and refetch completed");
  };

  return {
    pipelines,
    leads,
    refetchPipelines,
    refetchLeads,
    invalidateAndRefetch,
    isLoading: isPipelinesLoading || isLeadsLoading,
    isFetching: isPipelinesFetching || isLeadsFetching,
    isPending: isPipelinesPending || isLeadsPending
  };
}
