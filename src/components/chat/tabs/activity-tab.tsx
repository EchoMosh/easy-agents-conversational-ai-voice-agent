import { Mail, Phone, MessageSquare, Calendar, Edit, FileText, UserPlus, Tags, DollarSign, UserCheck, LinkIcon, Star, CheckCircle, PenTool, Eye, Info } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Activity, ActivityType } from "../types/activity-types";

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
        return <Mail className="h-4 w-4" />;
      case 'sms':
        return <Phone className="h-4 w-4" />;
      case 'note':
        return <FileText className="h-4 w-4" />;
      case 'status_change':
        return <Edit className="h-4 w-4" />;
      case 'lead_created':
        return <UserPlus className="h-4 w-4" />;
      case 'tag_added':
        return <Tags className="h-4 w-4" />;
      case 'deal_updated':
        return <DollarSign className="h-4 w-4" />;
      case 'lead_converted':
        return <UserCheck className="h-4 w-4" />;
      case 'meeting_scheduled':
        return <Calendar className="h-4 w-4" />;
      case 'link_clicked':
        return <LinkIcon className="h-4 w-4" />;
      case 'lead_rated':
        return <Star className="h-4 w-4" />;
      case 'task_completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'form_completed':
        return <PenTool className="h-4 w-4" />;
      case 'email_opened':
        return <Eye className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  // Get background color and icon class based on activity type
  const getActivityStyle = (type: ActivityType) => {
    switch (type) {
      case 'email':
        return {
          bgClass: 'bg-blue-100/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/30',
          iconClass: 'text-blue-500 border-blue-200 bg-blue-100 dark:bg-blue-900/40 dark:border-blue-800/40',
          emoji: '📧'
        };
      case 'sms':
        return {
          bgClass: 'bg-green-100/50 dark:bg-green-900/20 border-green-200 dark:border-green-900/30',
          iconClass: 'text-green-500 border-green-200 bg-green-100 dark:bg-green-900/40 dark:border-green-800/40',
          emoji: '💬'
        };
      case 'note':
        return {
          bgClass: 'bg-purple-100/50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-900/30',
          iconClass: 'text-purple-500 border-purple-200 bg-purple-100 dark:bg-purple-900/40 dark:border-purple-800/40',
          emoji: '📝'
        };
      case 'status_change':
        return {
          bgClass: 'bg-amber-100/50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/30',
          iconClass: 'text-amber-500 border-amber-200 bg-amber-100 dark:bg-amber-900/40 dark:border-amber-800/40',
          emoji: '🔄'
        };
      case 'lead_created':
        return {
          bgClass: 'bg-emerald-100/50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-900/30',
          iconClass: 'text-emerald-500 border-emerald-200 bg-emerald-100 dark:bg-emerald-900/40 dark:border-emerald-800/40',
          emoji: '✨'
        };
      case 'tag_added':
        return {
          bgClass: 'bg-pink-100/50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-900/30',
          iconClass: 'text-pink-500 border-pink-200 bg-pink-100 dark:bg-pink-900/40 dark:border-pink-800/40',
          emoji: '🏷️'
        };
      case 'deal_updated':
        return {
          bgClass: 'bg-teal-100/50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-900/30',
          iconClass: 'text-teal-500 border-teal-200 bg-teal-100 dark:bg-teal-900/40 dark:border-teal-800/40',
          emoji: '💰'
        };
      case 'lead_converted':
        return {
          bgClass: 'bg-indigo-100/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/30',
          iconClass: 'text-indigo-500 border-indigo-200 bg-indigo-100 dark:bg-indigo-900/40 dark:border-indigo-800/40',
          emoji: '🎯'
        };
      case 'meeting_scheduled':
        return {
          bgClass: 'bg-violet-100/50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-900/30',
          iconClass: 'text-violet-500 border-violet-200 bg-violet-100 dark:bg-violet-900/40 dark:border-violet-800/40',
          emoji: '📅'
        };
      default:
        return {
          bgClass: 'bg-gray-100/50 dark:bg-gray-800/20 border-gray-200 dark:border-gray-700/30',
          iconClass: 'text-gray-500 border-gray-200 bg-gray-100 dark:bg-gray-800/40 dark:border-gray-700/40',
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
          <>
            <div className="mt-2 space-y-1 text-sm">
              {metadata.old_status && (
                <div>
                  <span className="font-medium text-muted-foreground mr-2">From:</span>
                  <span>{metadata.old_status}</span>
                </div>
              )}
              {metadata.new_status && (
                <div>
                  <span className="font-medium text-muted-foreground mr-2">To:</span>
                  <span>{metadata.new_status}</span>
                </div>
              )}
            </div>
          </>
        );
      case 'note':
        return metadata.note_content ? (
          <div className="mt-2 p-2 bg-background/80 border border-border rounded-md text-sm italic">
            "{metadata.note_content}"
          </div>
        ) : null;
      case 'email':
      case 'sms':
        return metadata.subject || metadata.message ? (
          <div className="mt-2 p-2 bg-background/80 border border-border rounded-md text-sm">
            {metadata.subject && <div><span className="font-medium">Subject:</span> {metadata.subject}</div>}
            {metadata.message && <div className="italic">"{metadata.message}"</div>}
          </div>
        ) : null;
      case 'deal_updated':
        return metadata.amount ? (
          <div className="mt-2 text-sm">
            <span className="font-medium text-muted-foreground mr-2">Amount:</span>
            <span className="font-medium">${metadata.amount}</span>
          </div>
        ) : null;
      default:
        return Object.keys(metadata).length > 0 ? (
          <div className="mt-2 text-xs grid grid-cols-2 gap-x-4 gap-y-1 bg-background/80 p-2 rounded-md border border-border">
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
    <div className="space-y-6">
      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="font-medium mb-1">No activity recorded yet</h3>
          <p className="text-sm text-muted-foreground">
            Activities will appear here as you interact with this lead
          </p>
        </div>
      ) : (
        Object.entries(groupedActivities).map(([date, dayActivities]) => (
          <div key={date} className="space-y-2">
            <div className="sticky top-0 bg-background py-2 z-10">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                <h3 className="text-sm font-medium">
                  {format(new Date(date), "EEEE, MMMM d, yyyy")}
                </h3>
                <Badge variant="outline" className="ml-auto">
                  {dayActivities.length}
                </Badge>
              </div>
              <Separator className="my-2" />
            </div>

            <div className="space-y-3 ml-1 relative">
              <div className="absolute left-3 top-0 bottom-0 w-px bg-border"></div>

              {dayActivities.map((activity) => {
                const style = getActivityStyle(activity.type);
                return (
                  <div key={activity.id} className="relative flex gap-4 pl-7">
                    <div className={`absolute left-0 size-6 rounded-full border-2 border-background flex items-center justify-center z-10 ${style.iconClass}`}>
                      {getActivityIcon(activity.type)}
                    </div>

                    <div className={`flex-1 rounded-lg p-3 border ${style.bgClass}`}>
                      <div className="flex justify-between items-start mb-1">
                        <Badge variant="outline" className="font-normal">
                          {leadName}
                        </Badge>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {format(new Date(activity.timestamp), "h:mm a")}
                        </span>
                      </div>
                      
                      <p className="text-base font-medium mb-1">
                        {getActivityTitle(activity)}
                      </p>
                      
                      <p className="text-sm">{getDetailedActivityContent(activity)}</p>
                      
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
