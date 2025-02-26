
export interface Note {
  id: string;
  type: 'note';
  content: string;
  timestamp: string;
}

export interface Activity {
  id: string;
  type: 'status_change' | 'contact_update' | 'name_update' | 'variable_add' | 'lead_created';
  content: string;
  timestamp: string;
  old_value: string | null;
  new_value: string | null;
}

export type TimelineItem = Note | Activity;
