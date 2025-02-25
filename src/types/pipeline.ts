
import { Lead } from "@/pages/dashboard/leads";

export interface Pipeline {
  id: string;
  name: string;
  columns: PipelineColumn[];
  user_id: string;
  created_at: string;
}

export interface PipelineColumn {
  id: string;
  title: string;
  color: string;
}
