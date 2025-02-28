
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

export interface ExtendedDatabase extends Database {
  public: {
    Tables: {
      knowledge_documents: {
        Row: KnowledgeDocument;
        Insert: Omit<KnowledgeDocument, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<KnowledgeDocument, 'id' | 'created_at' | 'updated_at'>>;
      };
    } & Database['public']['Tables'];
  };
}
