
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Pipeline, convertJsonToPipeline } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";

export function usePipelineQueries(selectedPipelineId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: pipelines = [], refetch: refetchPipelines, isLoading: isPipelinesLoading } = useQuery({
    queryKey: ["pipelines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipelines")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(convertJsonToPipeline);
    },
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0, // Don't cache the data
  });

  const { data: leads = [], refetch: refetchLeads, isLoading: isLeadsLoading } = useQuery({
    queryKey: ["leads", selectedPipelineId],
    queryFn: async () => {
      if (!selectedPipelineId) return [];
      
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq('pipeline_id', selectedPipelineId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as unknown as Lead[];
    },
    enabled: !!selectedPipelineId,
    staleTime: 0,
    cacheTime: 0,
  });

  const invalidateAndRefetch = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["pipelines"] }),
      queryClient.invalidateQueries({ queryKey: ["leads", selectedPipelineId] }),
      refetchPipelines(),
      refetchLeads()
    ]);
  };

  return {
    pipelines,
    leads,
    refetchPipelines,
    refetchLeads,
    invalidateAndRefetch,
    isLoading: isPipelinesLoading || isLeadsLoading
  };
}
