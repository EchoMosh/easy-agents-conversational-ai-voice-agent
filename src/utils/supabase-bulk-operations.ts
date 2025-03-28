import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Performs a bulk delete operation on leads and related data
 * @param leadIds Array of lead IDs to delete, or null to use filter
 * @param filter Object containing filter criteria when leadIds is null
 * @param deleteJobId Optional ID of a delete job for tracking progress
 * @param updateJobStatus Optional function to update the status of a delete job
 * @returns Object with success status and count of deleted items
 */
export async function bulkDeleteLeads(
  leadIds: string[] | null,
  filter?: {
    workspaceId?: string;
    pipelineId?: string | null;
    searchQuery?: string;
    tagIds?: string[];
  },
  deleteJobId?: string,
  updateJobStatus?: (id: string, updates: { processed?: number; status?: string; endTime?: Date; error?: string }) => void
) {
  try {
    let deletedCount = 0;
    let targetLeadIds: string[] = [];

    // Get the IDs of leads we want to delete
    if (leadIds) {
      targetLeadIds = [...leadIds];
    } else if (filter) {
      targetLeadIds = await getMatchingLeadIds(filter);
    }

    if (targetLeadIds.length === 0) {
      if (deleteJobId && updateJobStatus) {
        updateJobStatus(deleteJobId, {
          status: "completed",
          endTime: new Date(),
        });
      }
      return { success: true, count: 0 };
    }

    // Process in batches for progress tracking
    const batchSize = 20; // Smaller batches to show progress more smoothly
    const batches = [];
    
    for (let i = 0; i < targetLeadIds.length; i += batchSize) {
      batches.push(targetLeadIds.slice(i, i + batchSize));
    }
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batchLeadIds = batches[batchIndex];
      
      // IMPORTANT: Delete from dependent tables in the correct order
      // Delete lead_activities first (the one causing the constraint errors)
      const { error: activitiesError } = await supabase
        .from("lead_activities")
        .delete()
        .in("lead_id", batchLeadIds);

      if (activitiesError) {
        console.error("Error deleting from lead_activities:", activitiesError);
        // Continue anyway, as some records might not exist
      }

      // Delete lead_tags next
      const { error: tagsError } = await supabase
        .from("lead_tags")
        .delete()
        .in("lead_id", batchLeadIds);

      if (tagsError) {
        console.error("Error deleting from lead_tags:", tagsError);
        // Continue anyway
      }

      // Delete lead_variables next
      const { error: variablesError } = await supabase
        .from("lead_variables")
        .delete()
        .in("lead_id", batchLeadIds);

      if (variablesError) {
        console.error("Error deleting from lead_variables:", variablesError);
        // Continue anyway
      }

      // Finally delete the leads themselves after all dependent records are gone
      const { data, error } = await supabase
        .from("leads")
        .delete()
        .in("id", batchLeadIds)
        .select("id");

      if (error) throw error;
      
      // Update the running count
      deletedCount += data?.length || 0;
      
      // Update job status if tracking is enabled
      if (deleteJobId && updateJobStatus) {
        updateJobStatus(deleteJobId, {
          processed: deletedCount,
        });
      }
      
      // Small delay to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Mark job as completed if tracking is enabled
    if (deleteJobId && updateJobStatus) {
      updateJobStatus(deleteJobId, {
        status: "completed",
        endTime: new Date(),
      });
    }

    return {
      success: true,
      count: deletedCount
    };
  } catch (error) {
    console.error('Bulk delete error:', error);
    throw error;
  }
}

/**
 * Performs a bulk update operation on leads
 * @param updates Object containing fields to update
 * @param leadIds Array of lead IDs to update, or null to use filter
 * @param filter Object containing filter criteria when leadIds is null
 * @returns Object with success status and count of updated items
 */
export async function bulkUpdateLeads(
  updates: {
    pipeline_id?: string | null;
    status?: string;
    [key: string]: any;
  },
  leadIds: string[] | null,
  filter?: {
    workspaceId?: string;
    pipelineId?: string | null;
    searchQuery?: string;
    tagIds?: string[];
  }
) {
  try {
    // Always include updated_at
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    };

    let updatedCount = 0;

    if (leadIds) {
      // Update by IDs
      const { data, error } = await supabase
        .from('leads')
        .update(updateData)
        .in('id', leadIds)
        .select('id');

      if (error) throw error;
      updatedCount = data?.length || 0;
    } else if (filter) {
      // Update by filter
      let query = supabase.from('leads').update(updateData).select('id');

      // Apply filters
      query = applyLeadFilters(query, filter);

      const { data, error } = await query;
      if (error) throw error;
      updatedCount = data?.length || 0;
    }

    return {
      success: true,
      count: updatedCount
    };
  } catch (error) {
    console.error('Bulk update error:', error);
    throw error;
  }
}

/**
 * Performs a bulk add variables operation on leads
 * @param variables Array of variable objects to add
 * @param leadIds Array of lead IDs to add variables to, or null to use filter
 * @param filter Object containing filter criteria when leadIds is null
 * @returns Object with success status and count of added variables
 */
export async function bulkAddVariables(
  variables: { name: string; value: string | null }[],
  leadIds: string[] | null,
  filter?: {
    workspaceId?: string;
    pipelineId?: string | null;
    searchQuery?: string;
    tagIds?: string[];
  }
) {
  try {
    if (!variables.length) {
      return { success: true, count: 0 };
    }

    let targetLeadIds: string[] = [];

    if (leadIds) {
      targetLeadIds = leadIds;
    } else if (filter) {
      targetLeadIds = await getMatchingLeadIds(filter);
    }

    if (!targetLeadIds.length) {
      return { success: true, count: 0 };
    }

    // Create variable records for each lead
    const variablesToAdd = targetLeadIds.flatMap(leadId =>
      variables.map(v => ({
        lead_id: leadId,
        name: v.name.trim(),
        value: v.value?.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))
    );

    // Insert in batches to avoid hitting limits
    const batchSize = 100;
    let addedCount = 0;

    for (let i = 0; i < variablesToAdd.length; i += batchSize) {
      const batch = variablesToAdd.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('lead_variables')
        .insert(batch)
        .select('id');

      if (error) throw error;
      addedCount += data?.length || 0;
    }

    return {
      success: true,
      count: addedCount
    };
  } catch (error) {
    console.error('Bulk add variables error:', error);
    throw error;
  }
}

/**
 * Gets lead IDs that match the given filter criteria
 * @param filter Filter criteria
 * @returns Array of matching lead IDs
 */
async function getMatchingLeadIds(filter: {
  workspaceId?: string;
  pipelineId?: string | null;
  searchQuery?: string;
  tagIds?: string[];
}): Promise<string[]> {
  try {
    let query = supabase.from('leads').select('id');
    
    // Apply filters
    query = applyLeadFilters(query, filter);

    const { data, error } = await query;
    if (error) throw error;
    
    return data?.map(lead => lead.id) || [];
  } catch (error) {
    console.error('Error getting matching lead IDs:', error);
    throw error;
  }
}

/**
 * Applies lead filters to a Supabase query
 * @param query Supabase query
 * @param filter Filter criteria
 * @returns Modified Supabase query with filters applied
 */
function applyLeadFilters(query: any, filter: {
  workspaceId?: string;
  pipelineId?: string | null;
  searchQuery?: string;
  tagIds?: string[];
}) {
  // Apply workspace filter
  if (filter.workspaceId) {
    query = query.eq('workspace_id', filter.workspaceId);
  }

  // Apply pipeline filter
  if (filter.pipelineId) {
    if (filter.pipelineId === 'none') {
      query = query.is('pipeline_id', null);
    } else {
      query = query.eq('pipeline_id', filter.pipelineId);
    }
  }

  // Apply search query filter
  if (filter.searchQuery) {
    const searchTerm = `%${filter.searchQuery.toLowerCase()}%`;
    query = query.or(
      `name.ilike.${searchTerm},email.ilike.${searchTerm},phone.ilike.${searchTerm},status.ilike.${searchTerm}`
    );
  }

  // Apply tag filter
  if (filter.tagIds && filter.tagIds.length > 0) {
    // This requires a more complex query with joins
    // For simplicity, we'll get the lead IDs with the tags first, then filter
    // In a real implementation, this would be a single query with proper joins
    query = query.in('id', function(subQuery: any) {
      return subQuery
        .from('lead_tags')
        .select('lead_id')
        .in('tag_id', filter.tagIds as string[]);
    });
  }

  return query;
}
