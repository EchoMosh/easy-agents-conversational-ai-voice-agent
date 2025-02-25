
import { Json } from "@/integrations/supabase/types";

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

export const convertJsonToPipeline = (data: { 
  id: string;
  name: string;
  columns: Json;
  user_id: string;
  created_at: string;
}): Pipeline => ({
  ...data,
  columns: (data.columns as any[]).map(col => ({
    id: col.id as string,
    title: col.title as string,
    color: col.color as string,
  }))
});
