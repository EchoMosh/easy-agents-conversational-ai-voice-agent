

export interface Tag {
  id: string;
  name: string;
  color: "gray" | "red" | "yellow" | "green" | "blue" | "purple" | "pink";
  user_id: string;
  created_at?: string;
}

export interface LeadTag {
  tag: Omit<Tag, 'user_id'> & { user_id?: string };
}

