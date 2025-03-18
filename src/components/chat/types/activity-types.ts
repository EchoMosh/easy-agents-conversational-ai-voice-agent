
export type ActivityType = 
  | 'email' 
  | 'sms' 
  | 'note' 
  | 'status_change' 
  | 'lead_created' 
  | 'tag_added' 
  | 'deal_updated' 
  | 'lead_converted' 
  | 'meeting_scheduled' 
  | 'link_clicked' 
  | 'lead_rated' 
  | 'task_completed' 
  | 'form_completed' 
  | 'email_opened';

export interface Activity {
  id: string;
  type: ActivityType;
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}
