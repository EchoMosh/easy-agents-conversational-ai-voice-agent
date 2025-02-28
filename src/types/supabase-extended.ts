
import { Database } from '@/integrations/supabase/types';

export interface KnowledgeDocument {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  file_path: string;
  file_type: string;
  file_size: number;
  created_at: string;
  updated_at: string;
}
