
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
  source_type?: 'file' | 'url' | 'text'; // Adding as optional for backward compatibility
  workspace_id?: string; // Adding workspace_id
}

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  created_at: string;
  updated_at: string;
}
