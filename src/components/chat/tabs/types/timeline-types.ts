
export interface Note {
  id: string;
  type: 'note';
  content: string;
  created_at: string;
  lead_id: string;
  user_id: string;
  updated_at?: string;
}

export interface Activity {
  id: string;
  type: 'status_change' | 'contact_update' | 'name_update' | 'variable_add' | 'lead_created';
  content: string;
  created_at: string;
  lead_id: string;
  user_id: string;
  old_value: string | null;
  new_value: string | null;
}

export type TimelineItem = Note | Activity;
