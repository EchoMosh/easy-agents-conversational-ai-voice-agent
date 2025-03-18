
import { Mail, Phone, MessageSquare, Calendar, Edit, FileText, UserPlus, Tags, DollarSign, UserCheck, LinkIcon, Star, CheckCircle, PenTool, Eye, Info } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Activity, ActivityType } from "../types/activity-types";
import { cn } from "@/lib/utils";

interface ActivityTabProps {
  activities: Activity[];
  leadName?: string;
}

export function ActivityTab({ activities, leadName = "Lead" }: ActivityTabProps) {
  // Group activities by date
  const groupedActivities = activities.reduce((groups: Record<string, Activity[]>, activity) => {
    const date = format(new Date(activity.timestamp), "yyyy-MM-dd");
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {});

  // Get activity type icon
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'email':
        return <Mail className="h-3.5 w-3.5" />;
      case 'sms':
        return <Phone className="h-3.5 w-3.5" />;
      case 'note':
        return <FileText className="h-3.5 w-3.5" />;
      case 'status_change':
        return <Edit className="h-3.5 w-3.5" />;
      case 'lead_created':
        return <UserPlus className="h-3.5 w-3.5" />;
      case 'tag_added':
        return <Tags className="h-3.5 w-3.5" />;
      case 'deal_updated':
        return <DollarSign className="h-3.5 w-3.5" />;
      case 'lead_converted':
        return <UserCheck className="h-3.5 w-3.5" />;
      case 'meeting_scheduled':
        return <Calendar className="h-3.5 w-3.5" />;
      case 'link_clicked':
        return <LinkIcon className="h-3.5 w-3.5" />;
      case 'lead_rated':
        return <Star className="h-3.5 w-3.5" />;
      case 'task_completed':
        return <CheckCircle className="h-3.5 w-3.5" />;
      case 'form_completed':
        return <PenTool className="h-3.5 w-3.5" />;
      case 'email_opened':
        return <Eye className="h-3.5 w-3.5" />;
      default:
        return <Info className="h-3.5 w-3.5" />;
    }
  };

  // Get background color and icon class based on activity type
  const getActivityStyle = (type: ActivityType) => {
    switch (type) {
      case 'email':
        return {
          bgClass: 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20',
          iconClass: 'text-blue-500 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800/30',
          emoji: '📧'
        };
      case 'sms':
        return {
          bgClass: 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20',
          iconClass: 'text-green-500 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800/30',
          emoji: '💬'
        };
      case 'note':
        return {
          bgClass: 'bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/20',
          iconClass: 'text-purple-500 border-purple-200 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-800/30',
          emoji: '📝'
        };
      case 'status_change':
        return {
          bgClass: 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/20',
          iconClass: 'text-amber-500 border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800/30',
          emoji: '🔄'
        };
      case 'lead_created':
        return {
          bgClass: 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20',
          iconClass: 'text-emerald-500 border-emerald-200 bg-emerald-50 dark:bg-emerald-900/20 dark:border-emerald-800/30',
          emoji: '✨'
        };
      case 'tag_added':
        return {
          bgClass: 'bg-pink-50 dark:bg-pink-900/10 border-pink-100 dark:border-pink-900/20',
          iconClass: 'text-pink-500 border-pink-200 bg-pink-50 dark:bg-pink-900/20 dark:border-pink-800/30',
          emoji: '🏷️'
        };
      case 'deal_updated':
        return {
          bgClass: 'bg-teal-50 dark:bg-teal-900/10 border-teal-100 dark:border-teal-900/20',
          iconClass: 'text-teal-500 border-teal-200 bg-teal-50 dark:bg-teal-900/20 dark:border-teal-800/30',
          emoji: '💰'
        };
      case 'lead_converted':
        return {
          bgClass: 'bg-indigo-50 dark:bg-indigo-950/10 border-indigo-100 dark:border-indigo-900/20',
          iconClass: 'text-indigo-500 border-indigo-200 bg-indigo-50 dark:bg-indigo-900/20 dark:border-indigo-800/30',
          emoji: '🎯'
        };
      case 'meeting_scheduled':
        return {
          bgClass: 'bg-violet-50 dark:bg-violet-950/10 border-violet-100 dark:border-violet-900/20',
          iconClass: 'text-violet-500 border-violet-200 bg-violet-50 dark:bg-violet-900/20 dark:border-violet-800/30',
          emoji: '📅'
        };
      default:
        return {
          bgClass: 'bg-gray-50 dark:bg-gray-800/10 border-gray-100 dark:border-gray-700/20',
          iconClass: 'text-gray-500 border-gray-200 bg-gray-50 dark:bg-gray-800/20 dark:border-gray-700/30',
          emoji: 'ℹ️'
        };
    }
  };

  // Get descriptive activity title based on type
  const getActivityTitle = (activity: Activity) => {
    const type = activity.type;
    
    switch (type) {
      case 'status_change':
        return 'Status changed';
      case 'email':
        return activity.content.includes('received') ? 'Email received' : 'Email sent';
      case 'sms':
        return activity.content.includes('received') ? 'SMS received' : 'SMS sent';
      case 'note':
        return 'Note added';
      case 'lead_created':
        return 'Lead created';
      case 'tag_added':
        return 'Tag added';
      case 'deal_updated':
        return 'Deal updated';
      case 'lead_converted':
        return 'Lead converted';
      case 'meeting_scheduled':
        return 'Meeting scheduled';
      case 'link_clicked':
        return 'Link clicked';
      case 'lead_rated':
        return 'Lead rated';
      case 'task_completed':
        return 'Task completed';
      case 'form_completed':
        return 'Form completed';
      case 'email_opened':
        return 'Email opened';
      default:
        return 'Activity';
    }
  };

  // Generate a more detailed description of the activity
  const getDetailedActivityContent = (activity: Activity) => {
    const type = activity.type;
    const metadata = activity.metadata || {};
    
    switch (type) {
      case 'email':
        if (activity.content.includes('received')) {
          return `Email received from ${leadName}${metadata.subject ? ' about "' + metadata.subject + '"' : ''}`;
        } else {
          return `Email sent to ${leadName}${metadata.subject ? ' with subject "' + metadata.subject + '"' : ''}`;
        }
      case 'sms':
        if (activity.content.includes('received')) {
          return `SMS received from ${leadName}${metadata.message ? ': "' + metadata.message + '"' : ''}`;
        } else {
          return `SMS sent to ${leadName}${metadata.message ? ': "' + metadata.message + '"' : ''}`;
        }
      case 'note':
        return `Note added about ${leadName}: "${metadata.note_content || activity.content}"`;
      case 'status_change':
        return `Status changed from "${metadata.old_status || 'previous status'}" to "${metadata.new_status || 'new status'}"`;
      case 'lead_created':
        return `New lead ${leadName} was created`;
      case 'tag_added':
        return `Tag "${metadata.tag_name || 'New tag'}" was added to ${leadName}`;
      case 'deal_updated':
        return `Deal value updated to $${metadata.amount || '0'}`;
      case 'lead_converted':
        return `Lead ${leadName} successfully converted to ${metadata.converted_to || 'customer'}`;
      case 'meeting_scheduled':
        return `Meeting scheduled with ${leadName} for ${metadata.meeting_time || 'upcoming date'}`;
      case 'link_clicked':
        return `${leadName} clicked on link "${metadata.link_title || 'a link'}"`;
      case 'lead_rated':
        return `Lead quality rated as ${metadata.rating || '★★★☆☆'}`;
      case 'task_completed':
        return `Task "${metadata.task_name || 'Untitled task'}" was completed`;
      case 'form_completed':
        return `${leadName} completed form "${metadata.form_name || 'a form'}"`;
      case 'email_opened':
        return `${leadName} opened email "${metadata.subject || 'No subject'}"`;
      default:
        // Prevent the generic "Activity related to [name]" message
        if (activity.content === `Activity related to ${leadName}`) {
          return `Interaction with ${leadName}`;
        }
        return activity.content;
    }
  };

  // Get metadata display for activity
  const getActivityMetadata = (activity: Activity) => {
    const metadata = activity.metadata || {};
    
    switch (activity.type) {
      case 'status_change':
        return (
          <div className="mt-1 text-[10px] space-y-0.5">
            {metadata.old_status && (
              <div className="flex items-baseline">
                <span className="text-muted-foreground mr-1 w-9">From:</span>
                <span className="font-medium">{metadata.old_status}</span>
              </div>
            )}
            {metadata.new_status && (
              <div className="flex items-baseline">
                <span className="text-muted-foreground mr-1 w-9">To:</span>
                <span className="font-medium">{metadata.new_status}</span>
              </div>
            )}
          </div>
        );
      case 'note':
        return metadata.note_content ? (
          <div className="mt-1 text-[10px] italic">
            "{metadata.note_content}"
          </div>
        ) : null;
      case 'email':
      case 'sms':
        return metadata.subject || metadata.message ? (
          <div className="mt-1 text-[10px]">
            {metadata.subject && <div><span className="font-medium">Subject:</span> {metadata.subject}</div>}
            {metadata.message && <div className="italic mt-0.5">"{metadata.message}"</div>}
          </div>
        ) : null;
      case 'deal_updated':
        return metadata.amount ? (
          <div className="mt-1 text-[10px]">
            <span className="text-muted-foreground mr-1">Amount:</span>
            <span className="font-medium">${metadata.amount}</span>
          </div>
        ) : null;
      default:
        return Object.keys(metadata).length > 0 ? (
          <div className="mt-1 text-[10px] grid grid-cols-2 gap-x-2 gap-y-0.5">
            {Object.entries(metadata).map(([key, value]) => (
              <div key={key} className="flex gap-1 items-baseline">
                <span className="font-medium text-muted-foreground">
                  {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}:
                </span>
                <span className="truncate">{String(value)}</span>
              </div>
            ))}
          </div>
        ) : null;
    }
  };

  return (
    <div className="space-y-3">
      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-5 text-center">
          <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center mb-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </div>
          <h3 className="text-xs font-medium mb-1">No activity recorded yet</h3>
          <p className="text-[10px] text-muted-foreground">
            Activities will appear here as you interact with this lead
          </p>
        </div>
      ) : (
        Object.entries(groupedActivities).map(([date, dayActivities]) => (
          <div key={date} className="space-y-1">
            <div className="sticky top-0 bg-background py-1 z-10">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 text-muted-foreground mr-1" />
                <h3 className="text-[10px] font-medium">
                  {format(new Date(date), "EEEE, MMMM d, yyyy")}
                </h3>
                <Badge variant="outline" className="ml-auto text-[9px] h-3.5 px-1">
                  {dayActivities.length}
                </Badge>
              </div>
              <Separator className="my-1" />
            </div>

            <div className="space-y-1.5 ml-1 relative">
              <div className="absolute left-1.5 top-0 bottom-0 w-[1px] bg-border/70"></div>

              {dayActivities.map((activity) => {
                const style = getActivityStyle(activity.type);
                return (
                  <div key={activity.id} className="relative flex gap-2 pl-3.5">
                    <div className={cn(`absolute left-0 size-3 rounded-full border flex items-center justify-center z-10 ${style.iconClass}`)}>
                      {getActivityIcon(activity.type)}
                    </div>

                    <div className={cn(`flex-1 rounded border-[0.5px] ${style.bgClass}`, "p-1.5")}>
                      <div className="flex justify-between items-start gap-1">
                        <Badge variant="outline" className="font-normal h-4 text-[9px] px-1">
                          {leadName}
                        </Badge>
                        <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                          {format(new Date(activity.timestamp), "h:mm a")}
                        </span>
                      </div>
                      
                      <p className="text-[11px] font-medium mt-0.5 line-clamp-1">
                        {activity.type === 'note' ? "Note added" : 
                         activity.type === 'status_change' ? "Status changed" : 
                         activity.content}
                      </p>
                      
                      {activity.content && activity.type !== 'note' && activity.type !== 'status_change' && (
                        <p className="text-[10px] mt-0.5 line-clamp-2">{activity.content}</p>
                      )}
                      
                      {getActivityMetadata(activity)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
