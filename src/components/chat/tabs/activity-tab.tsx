
import { Mail, Phone, MessageSquare, Calendar, Edit, FileText, UserPlus, Tags, DollarSign, UserCheck, LinkIcon, Star, CheckCircle, PenTool, Eye, Info } from "lucide-react";
import { format } from "date-fns";

interface Activity {
  id: string;
  type: 'email' | 'sms' | 'note' | 'status_change' | 'lead_created' | 'tag_added' | 'deal_updated' | 'lead_converted' | 'meeting_scheduled' | 'link_clicked' | 'lead_rated' | 'task_completed' | 'form_completed' | 'email_opened';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface ActivityTabProps {
  activities: Activity[];
  leadName?: string;
}

export function ActivityTab({ activities, leadName = "Lead" }: ActivityTabProps) {
  // Get activity type icon
  const getActivityIcon = (type: string) => {
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

  // Get background color based on activity type
  const getActivityStyle = (type: string) => {
    switch (type) {
      case 'email':
        return {
          bgClass: 'bg-blue-100 dark:bg-blue-900/30',
          iconClass: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300',
          emoji: '📧'
        };
      case 'sms':
        return {
          bgClass: 'bg-green-100 dark:bg-green-900/30',
          iconClass: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-300',
          emoji: '💬'
        };
      case 'note':
        return {
          bgClass: 'bg-purple-100 dark:bg-purple-900/30',
          iconClass: 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300',
          emoji: '📝'
        };
      case 'status_change':
        return {
          bgClass: 'bg-amber-100 dark:bg-amber-900/30',
          iconClass: 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-300',
          emoji: '🔄'
        };
      case 'lead_created':
        return {
          bgClass: 'bg-emerald-100 dark:bg-emerald-900/30',
          iconClass: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-300',
          emoji: '✨'
        };
      case 'tag_added':
        return {
          bgClass: 'bg-pink-100 dark:bg-pink-900/30',
          iconClass: 'bg-pink-100 text-pink-600 dark:bg-pink-900/50 dark:text-pink-300',
          emoji: '🏷️'
        };
      case 'deal_updated':
        return {
          bgClass: 'bg-teal-100 dark:bg-teal-900/30',
          iconClass: 'bg-teal-100 text-teal-600 dark:bg-teal-900/50 dark:text-teal-300',
          emoji: '💰'
        };
      default:
        return {
          bgClass: 'bg-gray-100 dark:bg-gray-800/40',
          iconClass: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
          emoji: 'ℹ️'
        };
    }
  };

  // Get descriptive activity text
  const getFormattedContent = (activity: Activity) => {
    const style = getActivityStyle(activity.type);
    const metadata = activity.metadata || {};
    
    // Enhanced content with emoji and formatting based on activity type
    switch (activity.type) {
      case 'email':
        return `${style.emoji} <span class="font-medium">Email ${activity.content.includes('received') ? 'received from' : 'sent to'}</span> ${leadName}`;
      case 'sms':
        return `${style.emoji} <span class="font-medium">Message ${activity.content.includes('received') ? 'received from' : 'sent to'}</span> ${leadName}`;
      case 'note':
        return `${style.emoji} <span class="font-medium">Note added:</span> "${activity.content}"`;
      case 'status_change':
        return `${style.emoji} <span class="font-medium">Status updated</span> ${metadata.old_status ? `from "${metadata.old_status}" to "${metadata.new_status}"` : ''}`;
      case 'lead_created':
        return `${style.emoji} <span class="font-medium">New lead created</span> - ${leadName} was added to the system`;
      case 'tag_added':
        return `${style.emoji} <span class="font-medium">Tag added:</span> "${metadata.tag_name || activity.content}"`;
      case 'deal_updated':
        return `${style.emoji} <span class="font-medium">Deal value updated</span> to $${metadata.amount || activity.content}`;
      default:
        return activity.content;
    }
  };

  return (
    <div className="space-y-4">
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
        activities.map((activity) => {
          const style = getActivityStyle(activity.type);
          return (
            <div key={activity.id} className={`flex items-start gap-3 p-3 border rounded-lg ${style.bgClass}`}>
              <div className={`rounded-full p-2 ${style.iconClass}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm" dangerouslySetInnerHTML={{ __html: getFormattedContent(activity) }}></p>
                <time className="text-xs text-muted-foreground">
                  {format(new Date(activity.timestamp), "MMMM d, yyyy 'at' h:mm a")}
                </time>
                
                {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                  <div className="mt-2 text-xs bg-background/50 rounded p-2 grid grid-cols-2 gap-x-4 gap-y-1">
                    {Object.entries(activity.metadata).map(([key, value]) => (
                      <div key={key} className="flex gap-1 items-baseline">
                        <span className="font-medium text-muted-foreground">
                          {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}:
                        </span>
                        <span className="truncate">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
