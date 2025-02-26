
import { Tag, LeadTag } from "@/types/tag-types";

export interface LeadVariable {
  id: string;
  lead_id: string;
  name: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  pipeline_id: string;
  status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  variables?: LeadVariable[];
  tags: LeadTag[];
}

// Export an empty component as default for the page
export default function LeadsPage() {
  return null;
}
