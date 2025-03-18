import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type ActivityRecord = Database["public"]["Tables"]["lead_activities"]["Row"];

/**
 * Fetches the most recent activities for a specific lead
 * @param leadId The ID of the lead to fetch activities for
 * @param limit The maximum number of activities to fetch (default: 20)
 * @returns An array of activity records
 */
export async function fetchLeadActivities(leadId: string, limit: number = 20): Promise<ActivityRecord[]> {
  const { data, error } = await supabase
    .from("lead_activities")
    .select("*")
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching lead activities:", error);
    throw error;
  }

  return data || [];
}

/**
 * Fetches activities for all leads associated with the current user
 * @param limit The maximum number of activities to fetch per lead (default: 10)
 * @returns An object with lead IDs as keys and arrays of activity records as values
 */
export async function fetchAllLeadActivities(limit: number = 10): Promise<Record<string, ActivityRecord[]>> {
  // First fetch all leads for the current user
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error("No authenticated user found");
  }

  const { data: leads, error: leadsError } = await supabase
    .from("leads")
    .select("id")
    .eq("user_id", userData.user.id);

  if (leadsError) {
    console.error("Error fetching leads:", leadsError);
    throw leadsError;
  }

  if (!leads || leads.length === 0) {
    return {};
  }

  // Then fetch activities for each lead
  const leadIds = leads.map(lead => lead.id);
  const { data: activities, error: activitiesError } = await supabase
    .from("lead_activities")
    .select("*")
    .in("lead_id", leadIds)
    .order("created_at", { ascending: false });

  if (activitiesError) {
    console.error("Error fetching lead activities:", activitiesError);
    throw activitiesError;
  }

  // Group activities by lead ID
  const activitiesByLead: Record<string, ActivityRecord[]> = {};
  
  leadIds.forEach(leadId => {
    activitiesByLead[leadId] = [];
  });

  (activities || []).forEach(activity => {
    if (!activitiesByLead[activity.lead_id]) {
      activitiesByLead[activity.lead_id] = [];
    }
    
    if (activitiesByLead[activity.lead_id].length < limit) {
      activitiesByLead[activity.lead_id].push(activity);
    }
  });

  return activitiesByLead;
}

/**
 * Creates a new activity record for a lead
 * @param leadId The ID of the lead to create an activity for
 * @param content The content of the activity
 * @param oldValue Optional old value for comparison
 * @param newValue Optional new value for comparison
 * @returns The created activity record
 */
export async function createLeadActivity(
  leadId: string, 
  content: string,
  oldValue?: string,
  newValue?: string
): Promise<ActivityRecord> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    throw new Error("No authenticated user found");
  }

  const activityData = {
    lead_id: leadId,
    content,
    user_id: userData.user.id,
    old_value: oldValue,
    new_value: newValue,
  };

  const { data, error } = await supabase
    .from("lead_activities")
    .insert(activityData)
    .select("*")
    .single();

  if (error) {
    console.error("Error creating lead activity:", error);
    throw error;
  }

  return data;
}

/**
 * Groups activity records by date
 * @param activities An array of activity records
 * @returns An object with dates as keys and arrays of activity records as values
 */
export function groupActivitiesByDate(activities: ActivityRecord[]): Record<string, ActivityRecord[]> {
  return activities.reduce((groups: Record<string, ActivityRecord[]>, activity) => {
    if (!activity.created_at) return groups;

    const date = new Date(activity.created_at).toISOString().split('T')[0]; // Format: YYYY-MM-DD
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {});
}
