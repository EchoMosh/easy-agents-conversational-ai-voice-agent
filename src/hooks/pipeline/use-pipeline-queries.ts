
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Pipeline, convertJsonToPipeline } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";

export function usePipelineQueries(selectedPipelineId: string | undefined) {
  const { data: pipelines = [], refetch: refetchPipelines } = useQuery({
    queryKey: ["pipelines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipelines")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(convertJsonToPipeline);
    },
  });

  const { data: leads = [], refetch: refetchLeads } = useQuery({
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
  });

  return {
    pipelines,
    leads,
    refetchPipelines,
    refetchLeads,
  };
}
