
export interface LeadVariable {
  id: string;
  name: string;
  value: string;
  lead_id: string;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface LeadTag {
  tag: Tag;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  pipeline_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  variables: LeadVariable[];
  tags: LeadTag[];
}

const leads = () => {};
export default leads;
