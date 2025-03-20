
import { useQuery } from "@tanstack/react-query";
import { fetchLeadActivities } from "@/utils/supabase-activity-utils";
import { ActivityType } from "../types/activity-types";

export function useChatActivities(leadId: string | undefined) {
  return useQuery({
    queryKey: ["lead-activities", leadId],
    queryFn: async () => {
      if (!leadId) return [];
      
      try {
        const activities = await fetchLeadActivities(leadId, 30);
        
        return activities.map(activity => {
          let activityType: ActivityType = "note";
          
          if (activity.content.toLowerCase().includes('email')) {
            activityType = "email";
          } else if (activity.content.toLowerCase().includes('sms')) {
            activityType = "sms";
          } else if (activity.content.toLowerCase().includes('note')) {
            activityType = "note";
          } else if (activity.content.toLowerCase().includes('status')) {
            activityType = "status_change";
          } else if (activity.content.toLowerCase().includes('created')) {
            activityType = "lead_created";
          } else if (activity.content.toLowerCase().includes('tag')) {
            activityType = "tag_added";
          }
          
          const metadata: Record<string, any> = {};
          if (activity.old_value) metadata.old_status = activity.old_value;
          if (activity.new_value) metadata.new_status = activity.new_value;
          
          return {
            id: activity.id,
            type: activityType,
            content: activity.content || `Activity related to ${leadId}`,
            timestamp: activity.created_at,
            metadata
          };
        });
      } catch (error) {
        console.error("Error fetching lead activities:", error);
        return [];
      }
    },
    enabled: !!leadId,
  });
}
