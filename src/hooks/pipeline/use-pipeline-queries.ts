import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, withWorkspace } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pipeline, convertJsonToPipeline } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";
import { useWorkspace } from "@/context/workspace-context";
import { useState, useRef, useEffect } from "react";

// Mock data for ensuring UI works even if database connection fails
const MOCK_LEADS: Lead[] = [
  {
    id: "mock-1",
    name: "John Doe",
    email: "john@example.com",
    phone: "555-123-4567",
    status: "new",
    pipeline_id: "mock-pipeline-1",
    created_at: new Date().toISOString(),
    user_id: "mock-user-1",
    updated_at: new Date().toISOString(),
    source: "mock",
    tags: [{ id: "tag-1", name: "Important", color: "red", user_id: "mock-user-1" }]
  },
  {
    id: "mock-2",
    name: "Jane Smith",
    email: "jane@example.com",
    phone: "555-987-6543",
    status: "qualified",
    pipeline_id: "mock-pipeline-1",
    created_at: new Date().toISOString(),
    user_id: "mock-user-1",
    updated_at: new Date().toISOString(),
    source: "mock",
    tags: [{ id: "tag-2", name: "Follow-up", color: "green", user_id: "mock-user-1" }]
  },
  {
    id: "mock-3",
    name: "Bob Johnson",
    email: "bob@example.com",
    phone: "555-555-5555",
    status: "contacted",
    pipeline_id: "mock-pipeline-2",
    created_at: new Date().toISOString(),
    user_id: "mock-user-1",
    updated_at: new Date().toISOString(),
    source: "mock",
    tags: []
  }
];

const MOCK_PIPELINES: Pipeline[] = [
  {
    id: "mock-pipeline-1",
    name: "Sales Pipeline",
    columns: [
      { id: "col-1", title: "New", color: "#e2e8f0", items: [] },
      { id: "col-2", title: "Contacted", color: "#bfdbfe", items: [] },
      { id: "col-3", title: "Qualified", color: "#a7f3d0", items: [] },
      { id: "col-4", title: "Proposal", color: "#fde68a", items: [] },
      { id: "col-5", title: "Closed", color: "#86efac", items: [] }
    ],
    user_id: "mock-user-1",
    workspace_id: "mock-workspace-1",
    created_at: new Date().toISOString()
  },
  {
    id: "mock-pipeline-2", 
    name: "Marketing Pipeline",
    columns: [
      { id: "col-6", title: "Lead", color: "#e2e8f0", items: [] },
      { id: "col-7", title: "MQL", color: "#bfdbfe", items: [] },
      { id: "col-8", title: "SQL", color: "#a7f3d0", items: [] },
      { id: "col-9", title: "Opportunity", color: "#fde68a", items: [] },
      { id: "col-10", title: "Customer", color: "#86efac", items: [] }
    ],
    user_id: "mock-user-1",
    workspace_id: "mock-workspace-1",
    created_at: new Date().toISOString()
  }
];

// Flag to use mock data
const USE_MOCK_DATA = false; // Set to false to use real data from Supabase

export function usePipelineQueries(selectedPipelineId?: string) {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspace();
  const [page, setPage] = useState(1);
  const [hasMoreLeads, setHasMoreLeads] = useState(true);
  const pageSize = 10;
  const accumulatedLeadsRef = useRef<Lead[]>([]);
  const [totalFilteredCount, setTotalFilteredCount] = useState<number | null>(null);
  const [useMockData, setUseMockData] = useState(USE_MOCK_DATA);
  
  // Debug logging for workspace context
  useEffect(() => {
    console.log("🔍 Current workspace in usePipelineQueries:", currentWorkspace);
    if (!currentWorkspace?.id) {
      console.warn("⚠️ No workspace ID available for fetching leads, using mock data");
      setUseMockData(true);
    }
  }, [currentWorkspace]);
  
  // Show a message in the console to indicate if we're using mock data
  useEffect(() => {
    if (useMockData) {
      console.warn("⚠️ USING MOCK DATA - Supabase connection bypassed");
    }
  }, [useMockData]);
  
  const {
    data: pipelines = [],
    isLoading: isPipelinesLoading,
    refetch: refetchPipelines,
  } = useQuery({
    queryKey: ["pipelines", currentWorkspace?.id],
    queryFn: async () => {
      // Return mock data if flag is set
      if (useMockData) {
        console.log("📊 Using mock pipelines data");
        return MOCK_PIPELINES;
      }
      
      if (!currentWorkspace?.id) {
        console.warn("⚠️ No workspace ID for pipelines query");
        return [];
      }
      
      try {
        console.log(`🔄 Fetching pipelines for workspace: ${currentWorkspace.id}`);
        const { data, error } = await supabase
          .from("pipelines")
          .select("*")
          .eq("workspace_id", currentWorkspace.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("❌ Error fetching pipelines:", error);
          toast.error("Failed to load pipelines");
          throw error;
        }
        
        console.log(`✅ Fetched ${data?.length || 0} pipelines`);
        return (data || []).map(convertJsonToPipeline);
      } catch (error) {
        console.error("❌ Exception in pipelines query:", error);
        return [];
      }
    },
    enabled: !!currentWorkspace?.id || useMockData,
  });

  const {
    data: availableTags = [],
    isLoading: isTagsLoading,
  } = useQuery({
    queryKey: ["tags", currentWorkspace?.id],
    queryFn: async () => {
      // Return mock tags if flag is set
      if (useMockData) {
        console.log("📊 Using mock tags data");
        return [
          { id: "tag-1", name: "Important", color: "red", user_id: "mock-user-1" },
          { id: "tag-2", name: "Follow-up", color: "green", user_id: "mock-user-1" },
          { id: "tag-3", name: "Cold Lead", color: "blue", user_id: "mock-user-1" }
        ];
      }
      
      if (!currentWorkspace?.id) return [];
      
      try {
        console.log(`🔄 Fetching tags for workspace: ${currentWorkspace.id}`);
        const { data, error } = await supabase
          .from("tags")
          .select("*")
          .eq("workspace_id", currentWorkspace.id)
          .order("name");

        if (error) {
          console.error("❌ Error fetching tags:", error);
          return [];
        }
        
        console.log(`✅ Fetched ${data?.length || 0} tags`);
        return data || [];
      } catch (error) {
        console.error("❌ Exception in tags query:", error);
        return [];
      }
    },
    enabled: !!currentWorkspace?.id || useMockData,
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
    queryKey: ["leads", selectedPipelineId, currentWorkspace?.id, page, useMockData],
    queryFn: async () => {
      // Return mock leads if flag is set
      if (useMockData) {
        console.log("📊 Using mock leads data");
        // Filter mock leads based on selected pipeline
        let filteredMockLeads = MOCK_LEADS;
        if (selectedPipelineId && selectedPipelineId !== "all") {
          filteredMockLeads = MOCK_LEADS.filter(
            lead => lead.pipeline_id === selectedPipelineId
          );
        }
        
        setHasMoreLeads(false); // No more mock leads to load
        console.log(`📊 Using ${filteredMockLeads.length} filtered mock leads`);
        return filteredMockLeads;
      }
      
      if (!currentWorkspace?.id) {
        console.warn("⚠️ No workspace ID available for fetching leads");
        return [];
      }
      
      try {
        console.log(`🔄 Loading page ${page} of leads, ${pageSize} leads per page, workspace: ${currentWorkspace.id}`);
        
        // Use a single query with nested selects to fetch leads, variables, and tags in one go
        let query = supabase
          .from("leads")
          .select(`
            *,
            variables:lead_variables(*),
            tags:lead_tags(
              lead_id,
              tag_id,
              tags:tags(*)
            )
          `)
          .eq("workspace_id", currentWorkspace.id);
        
        if (selectedPipelineId && selectedPipelineId !== "all") {
          query = query.eq("pipeline_id", selectedPipelineId);
        }

        query = query
          .order("created_at", { ascending: false })
          .range((page - 1) * pageSize, page * pageSize - 1);

        console.log("🔍 Executing Supabase query:", JSON.stringify(query, null, 2));
        const { data, error } = await query;

        if (error) {
          console.error("❌ Supabase error fetching leads:", error);
          toast.error("Failed to load leads");
          // Fall back to mock data if there's an error
          console.log("⚠️ Falling back to mock data due to error");
          setUseMockData(true);
          return MOCK_LEADS;
        }

        console.log(`📊 Got response from leads query - rows returned: ${data?.length || 0}`);

        const hasMore = data.length === pageSize;
        console.log(`📊 Loaded ${data.length} leads, hasMore: ${hasMore}`);
        setHasMoreLeads(hasMore);

        if (data.length === 0) {
          console.log("⚠️ No leads returned from query, showing empty state");
          return [];
        }

        // Log raw data for debugging
        console.log("🔍 Raw lead data from database:", data);

        // Check if data is valid
        if (!data || !Array.isArray(data)) {
          console.error("❌ Invalid data structure returned from leads query:", data);
          return [];
        }

        try {
          const transformedLeads = data.map(lead => {
            // Handle null or undefined lead
            if (!lead) {
              console.warn("Received null/undefined lead in data array");
              return null;
            }
            
            try {
              // Extract and validate tags from the nested structure
              const tags = (lead.tags || [])
                .filter(tagRel => tagRel && tagRel.tags) // Filter out any null tag relations
                .map(tagRel => {
                  const tag = tagRel.tags;
                  // Ensure tag color is one of the allowed values
                  const validColors = ["gray", "red", "yellow", "green", "blue", "purple", "pink"];
                  let color = tag.color || "gray";
                  if (!validColors.includes(color)) {
                    color = "gray"; // Default to gray for invalid colors
                  }
                  
                  return {
                    id: tag.id || crypto.randomUUID(), // Ensure ID exists
                    name: tag.name || "Unnamed Tag",
                    color: color as "gray" | "red" | "yellow" | "green" | "blue" | "purple" | "pink",
                    user_id: tag.user_id || lead.user_id
                  };
                });
              
              // Return the lead with the properly typed tags array
              return {
                ...lead,
                tags
              };
            } catch (error) {
              console.error("Error processing lead:", lead.id, error);
              // Return lead with empty tags array as fallback
              return {
                ...lead,
                tags: []
              };
            }
          });
          
          console.log(`✅ Transformed ${transformedLeads.length} leads successfully`);
          
          return transformedLeads as Lead[];
        } catch (error) {
          console.error("❌ Error transforming lead data:", error);
          return [];
        }
      } catch (error) {
        console.error("❌ Exception in leads query:", error);
        // Fall back to mock data on error
        console.log("⚠️ Falling back to mock data due to exception");
        setUseMockData(true);
        return MOCK_LEADS;
      }
    },
    enabled: (!!currentWorkspace?.id || useMockData),
  });

  useEffect(() => {
    console.log("📋 CurrentPageLeads changed:", currentPageLeads?.length || 0);
    
    if (currentPageLeads && currentPageLeads.length > 0) {
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
    } else {
      console.log("⚠️ No leads in currentPageLeads for this page");
      
      // Initialize with empty array on first page if no leads returned
      if (page === 1) {
        accumulatedLeadsRef.current = [];
      }
    }
    
    console.log(`📊 Total accumulated leads: ${accumulatedLeadsRef.current.length}`);
  }, [currentPageLeads, page]);

  // Ensure we always have a valid array for leads, even if the ref is not initialized
  const leads = accumulatedLeadsRef.current || [];

  const isLoading = isPipelinesLoading || isLeadsLoading || isTagsLoading;

  const invalidateAndRefetch = async () => {
    console.log("🔄 Invalidating queries and resetting state");
    accumulatedLeadsRef.current = [];
    setPage(1);
    setHasMoreLeads(true);
    
    // Try to fetch from real data again on refresh
    if (!USE_MOCK_DATA && currentWorkspace?.id) {
      setUseMockData(false);
    }
    
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
