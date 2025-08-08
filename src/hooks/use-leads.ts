import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Lead } from '@/pages/dashboard/leads';
import { useWorkspace } from '@/context/workspace-context';
import { Tag } from '@/types/tag-types';
import { LoadingPriority } from '@/context/app-loading-context';
import { useApiLoading } from '@/hooks/use-api-loading';

export function useLeads(initialPipelineId?: string) {
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | undefined>(initialPipelineId);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const pageSize = 15;
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspace();
  
  // Fetch pipelines
  const {
    data: pipelines = [],
    isLoading: isPipelinesLoading,
  } = useQuery({
    queryKey: ['pipelines', currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];
      
      const { data, error } = await supabase
        .from('pipelines')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data;
    },
    enabled: !!currentWorkspace?.id,
  });
  
  // Fetch tags
  const {
    data: rawAvailableTags = [],
    isLoading: isTagsLoading,
  } = useQuery({
    queryKey: ['tags', currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];
      
      const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('workspace_id', currentWorkspace.id)
        .order('name');
        
      if (error) return [];
      return data;
    },
    enabled: !!currentWorkspace?.id,
  });
  
  // Transform raw tags to ensure they match the Tag type
  const availableTags = rawAvailableTags.map((tag) => {
    const validColors = [
      "gray",
      "red",
      "yellow",
      "green",
      "blue",
      "purple",
      "pink",
    ] as const;
    let color = (tag.color || "gray") as
      | "gray"
      | "red"
      | "yellow"
      | "green"
      | "blue"
      | "purple"
      | "pink";

    // Ensure color is valid
    if (!validColors.includes(color as any)) {
      color = "gray";
    }

    return {
      id: tag.id,
      name: tag.name,
      color,
      user_id: tag.user_id,
    } as Tag;
  });

  // Fetch leads with pagination
  const {
    data: leadsData = { leads: [], totalCount: 0 },
    isLoading: isLeadsLoading,
    isFetching: isLeadsFetching,
  } = useQuery({
    queryKey: ['leads', selectedPipelineId, currentWorkspace?.id, page, searchQuery, selectedTagIds],
    queryFn: async () => {
      if (!currentWorkspace?.id) {
        console.warn("⚠️ No workspace ID available for fetching leads");
        return { leads: [], totalCount: 0 };
      }
      
      console.log(`🔄 Fetching leads for workspace: ${currentWorkspace.id}`);
      console.log(`🔄 Page: ${page}, Pipeline: ${selectedPipelineId || 'all'}`);
      
      try {
        // Build the base query
        let query = supabase
          .from('leads')
          .select(`
            *,
            variables:lead_variables(*),
            tags:lead_tags(
              lead_id,
              tag_id,
              tags:tags(*)
            )
          `, { count: 'exact' })
          .eq('workspace_id', currentWorkspace.id);
        
        // Apply pipeline filter if needed
        if (selectedPipelineId && selectedPipelineId !== 'all') {
          query = query.eq('pipeline_id', selectedPipelineId);
        }
        
        // Apply tag filters if needed
        if (selectedTagIds.length > 0) {
          // This assumes a join table called lead_tags that links leads to tags
          // We need to get all leads that have ANY of the selected tags
          const leadIds = await supabase
            .from('lead_tags')
            .select('lead_id')
            .in('tag_id', selectedTagIds);
          
          if (!leadIds.error && leadIds.data) {
            const ids = leadIds.data.map(item => item.lead_id);
            if (ids.length > 0) {
              query = query.in('id', ids);
            } else {
              // If no leads have the selected tags, return empty result
              return { leads: [], totalCount: 0 };
            }
          }
        }
        
        // Apply search query if provided
        if (searchQuery) {
          query = query.or(`name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%,status.ilike.%${searchQuery}%`);
        }
        
        // Apply pagination
        query = query
          .order('created_at', { ascending: false })
          .range((page - 1) * pageSize, page * pageSize - 1);
          
        console.log("🔍 Executing Supabase query");
        const { data, error, count } = await query;
        
        if (error) {
          console.error("❌ Error fetching leads:", error);
          throw error;
        }
        
        console.log(`✅ Fetched ${data?.length || 0} leads (total: ${count || 0})`);
        
        if (data.length === 0) {
          return { leads: [], totalCount: count || 0 };
        }
        
        // Transform the data for the frontend
        const transformedLeads = data.map(lead => {
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
        
        // Log the first few leads for debugging
        console.log("🔍 First few leads:", transformedLeads.slice(0, 2));
            
        return { 
          leads: transformedLeads as Lead[], 
          totalCount: count || 0 
        };
      } catch (error) {
        console.error('❌ Error in leads query:', error);
        return { leads: [], totalCount: 0 };
      }
    },
    enabled: !!currentWorkspace?.id,
  });
  
  // Register the loading state with the AppLoadingContext using our enhanced hook with better debouncing
  const { isLoading: leadsApiLoading } = useApiLoading('leads', {
    initialState: isLeadsLoading || isPipelinesLoading || isTagsLoading,
    priority: LoadingPriority.MEDIUM,
    debounce: {
      start: 50,  // Start showing loading quickly for better UX
      end: 500    // But hold the loading state longer to prevent flickering
    }
  });
  
  // Track stable loading state for components
  const [stableLoading, setStableLoading] = useState(isLeadsLoading || isPipelinesLoading || isTagsLoading);
  
  // Use an effect to smooth out loading state transitions 
  useEffect(() => {
    const isCurrentlyLoading = isLeadsLoading || isPipelinesLoading || isTagsLoading;
    
    // If we're going from not loading to loading, update immediately
    if (isCurrentlyLoading && !stableLoading) {
      setStableLoading(true);
    }
    // If we're going from loading to not loading, debounce it
    else if (!isCurrentlyLoading && stableLoading) {
      const timer = setTimeout(() => {
        setStableLoading(false);
      }, 500); // Additional delay before considering content "stable"
      
      return () => clearTimeout(timer);
    }
  }, [isLeadsLoading, isPipelinesLoading, isTagsLoading, stableLoading]);
  
  // Manage accumulated state for infinite scrolling/pagination
  const [accumulatedLeads, setAccumulatedLeads] = useState<Lead[]>([]);
  
  // Update accumulated leads whenever new data comes in
  useEffect(() => {
    if (page === 1) {
      // Reset accumulated leads when we're back on page 1
      setAccumulatedLeads(leadsData.leads);
    } else if (leadsData.leads.length > 0) {
      // Add new leads to the accumulated list, avoiding duplicates
      const existingIds = new Set(accumulatedLeads.map(lead => lead.id));
      const newLeads = leadsData.leads.filter(lead => !existingIds.has(lead.id));
      
      if (newLeads.length > 0) {
        setAccumulatedLeads(prev => [...prev, ...newLeads]);
      }
    }
  }, [leadsData.leads, page, accumulatedLeads]);
  
  // Refresh all data
  const refreshLeads = async () => {
    setPage(1); // Reset to first page
    setAccumulatedLeads([]); // Clear accumulated leads
    await queryClient.invalidateQueries({ queryKey: ['leads'] });
    await queryClient.invalidateQueries({ queryKey: ['pipelines'] });
    await queryClient.invalidateQueries({ queryKey: ['tags'] });
  };
  
  // Load more (pagination)
  const loadMoreLeads = () => {
    if (accumulatedLeads.length < leadsData.totalCount) {
      setPage(prev => prev + 1);
      return true;
    }
    return false;
  };

  // First calculate if there are more leads to load
  const hasMoreLeads = accumulatedLeads.length < leadsData.totalCount;
  
  // Pre-calculate allLeads to use in the effect
  const allLeads = page === 1 ? leadsData.leads : accumulatedLeads;
  
  // Set up infinite scroll with much earlier detection
  useEffect(() => {
    const handleScroll = () => {
      // Get the current scroll position
      const scrollPosition = window.innerHeight + window.scrollY;
      // Get the total height of the document
      const documentHeight = document.documentElement.scrollHeight;
      // Set a MUCH larger threshold - trigger when user is 1000px from bottom
      // This ensures we start loading well before the user reaches the bottom
      const threshold = 1000;
      
      // Log the scroll position for debugging
      // Commented out to reduce console noise during debugging
      // console.log(
      //   `📜 Scroll position: ${scrollPosition}, Document height: ${documentHeight}, Difference: ${documentHeight - scrollPosition}`
      // );
      
      // Check if we're approaching the bottom and not already fetching
      if (scrollPosition + threshold >= documentHeight && !isLeadsFetching && hasMoreLeads) {
        console.log("📜 Approaching bottom, loading more leads...");
        loadMoreLeads();
      }
    };
    
    // Use passive: true for better scroll performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Set up a periodic check to handle cases where the scroll event might not fire
    const intervalCheck = setInterval(handleScroll, 1000);
    
    // Initial checks and forced loading if needed
    
    // First immediate check
    handleScroll();
    
    // Second check after a short delay (for layout to stabilize)
    setTimeout(() => {
      handleScroll();
      
      // Force load more data if we have very few leads and there are more to load
      if (allLeads.length < 20 && hasMoreLeads) {
        console.log("📜 Few initial leads, proactively loading more...");
        loadMoreLeads();
      }
    }, 300);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearInterval(intervalCheck);
    };
  }, [isLeadsFetching, hasMoreLeads, loadMoreLeads, allLeads]);
  
  return {
    leads: allLeads,
    totalCount: leadsData.totalCount,
    pipelines,
    availableTags,
    isLoading: isPipelinesLoading || isTagsLoading || isLeadsLoading,
    isFetching: isLeadsFetching,
    hasMoreLeads,
    loadMoreLeads,
    refreshLeads,
    selectedPipelineId,
    setSelectedPipelineId,
    searchQuery,
    setSearchQuery,
    selectedTagIds,
    setSelectedTagIds,
  };
}
