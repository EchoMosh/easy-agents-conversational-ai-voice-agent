
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
      
      const rawPipelines = data || [];
      console.log("Pipelines fetched:", rawPipelines.length);
      
      // Process pipelines and ensure each column is unique by ID
      const processedPipelines = rawPipelines.map(pipeline => {
        const convertedPipeline = convertJsonToPipeline(pipeline);
        
        // Deduplicate columns by ID
        const uniqueColumnsMap = new Map();
        convertedPipeline.columns.forEach(col => uniqueColumnsMap.set(col.id, col));
        convertedPipeline.columns = Array.from(uniqueColumnsMap.values());
        
        return convertedPipeline;
      });
      
      return processedPipelines;
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
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
      
      let query;
      
      // If no pipeline is selected, fetch all leads
      if (!selectedPipelineId) {
        query = supabase
          .from("leads")
          .select("*")
          .order("created_at", { ascending: false });
      } else {
        // If a pipeline is selected, fetch leads for that pipeline
        query = supabase
          .from("leads")
          .select("*")
          .eq('pipeline_id', selectedPipelineId)
          .order("created_at", { ascending: false });
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      const logMessage = selectedPipelineId 
        ? "Pipeline leads fetched:" 
        : "All leads fetched:";
      console.log(logMessage, data?.length);
      
      // Make sure status is never null, set default value
      const processedLeads = (data || []).map(lead => ({
        ...lead,
        status: lead.status || 'New',
        // Ensure all other properties have default values if needed
        name: lead.name || 'Unnamed Lead',
        email: lead.email || null,
        phone: lead.phone || null,
        pipeline_id: lead.pipeline_id || null,
      }));
      
      return processedLeads as Lead[];
    },
    enabled: true, // Always enabled to fetch all leads when no pipeline is selected
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
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
    
    // First invalidate the queries
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ["pipelines"],
        exact: false
      }),
      queryClient.invalidateQueries({
        queryKey: ["leads"],
        exact: false
      })
    ]);
    
    // Then explicitly trigger refetches
    await Promise.all([
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
