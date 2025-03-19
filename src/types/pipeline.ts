
import { Json } from "@/integrations/supabase/types";

export interface Pipeline {
  id: string;
  name: string;
  columns: PipelineColumn[];
  user_id: string;
  created_at: string;
  workspace_id?: string;
}

export interface PipelineColumn {
  id: string;
  title: string;
  color: string;
  items?: any[]; // Making items optional for backward compatibility
}

export const convertJsonToPipeline = (data: { 
  id: string;
  name: string;
  columns: Json;
  user_id: string;
  created_at: string;
  workspace_id?: string;
}): Pipeline => ({
  ...data,
  columns: (data.columns as any[]).map(col => ({
    id: col.id as string,
    title: col.title as string,
    color: col.color as string,
    items: col.items as any[] || []
  }))
});
