
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
    queryKey: ["leads"],
    queryFn: async () => {
      console.log("Fetching all leads...");
      
      // Always fetch all leads regardless of the selected pipeline
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      console.log("All leads fetched:", data?.length);
      
      // Make sure status is never null, set default value
      const processedLeads = (data || []).map(lead => ({
        ...lead,
        status: lead.status || 'New',
        // Ensure all other properties have default values if needed
        name: lead.name || 'Unnamed Lead',
        email: lead.email || null,
        phone: lead.phone || null,
      }));
      
      // Log leads by pipeline for debugging
      const leadsByPipeline = {};
      processedLeads.forEach(lead => {
        if (!leadsByPipeline[lead.pipeline_id]) {
          leadsByPipeline[lead.pipeline_id] = 0;
        }
        leadsByPipeline[lead.pipeline_id]++;
      });
      console.log("Leads by pipeline:", leadsByPipeline);
      
      return processedLeads as Lead[];
    },
    enabled: true, // Always enabled to fetch all leads
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

  // Filter leads for the selected pipeline if needed (for convenience but not essential)
  const filteredLeads = selectedPipelineId 
    ? leads.filter(lead => lead.pipeline_id === selectedPipelineId)
    : leads;

  console.log(`Filtered leads for pipeline ${selectedPipelineId}: ${filteredLeads.length} out of ${leads.length} total leads`);

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
    leads, // Return all leads, not just filtered ones
    filteredLeads, // Also provide pre-filtered leads if needed
    refetchPipelines,
    refetchLeads,
    invalidateAndRefetch,
    isLoading: isPipelinesLoading || isLeadsLoading,
    isFetching: isPipelinesFetching || isLeadsFetching,
    isPending: isPipelinesPending || isLeadsPending
  };
}
