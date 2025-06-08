import { supabase } from '@/integrations/supabase/client';

export interface VapiFile {
  id: string;
  name: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

export interface VapiKnowledgeBase {
  id: string;
  name: string;
  provider: 'trieve';
  searchPlan: {
    searchType: 'semantic' | 'fulltext' | 'hybrid';
    topK: number;
    scoreThreshold: number;
    removeStopWords: boolean;
  };
}

export async function uploadFileToVapi(file: File): Promise<VapiFile> {
  // Read file as base64
  const arrayBuffer = await file.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const base64 = btoa(String.fromCharCode(...uint8Array));

  const { data, error } = await supabase.functions.invoke('upload-vapi-file', {
    body: {
      fileName: file.name,
      fileData: base64,
      mimeType: file.type,
    },
  });

  if (error) throw error;
  if (!data.success) throw new Error(data.error || 'Failed to upload file');

  return data.data;
}

export async function createVapiKnowledgeBase(
  name: string,
  fileIds: string[],
  agentId: string,
  options?: {
    searchType?: 'semantic' | 'fulltext' | 'hybrid';
    topK?: number;
    scoreThreshold?: number;
  }
): Promise<VapiKnowledgeBase> {
  const { data, error } = await supabase.functions.invoke('create-vapi-knowledge-base', {
    body: {
      name,
      fileIds,
      agentId,
      ...options,
    },
  });

  if (error) throw error;
  if (!data.success) throw new Error(data.error || 'Failed to create knowledge base');

  return data.data;
}

export async function updateAgentKnowledgeBase(
  agentId: string,
  knowledgeBaseId: string,
  fileIds: string[]
): Promise<void> {
  const { error } = await supabase
    .from('agents')
    .update({
      vapi_knowledge_base_id: knowledgeBaseId,
      vapi_file_ids: fileIds,
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', agentId);

  if (error) throw error;
}

export async function updateVapiAgentWithKnowledgeBase(
  vAgentId: string,
  knowledgeBaseId: string,
  otherParams: any
): Promise<void> {
  const { data, error } = await supabase.functions.invoke('update-vapi-agent', {
    body: {
      v_agent_id: vAgentId,
      knowledge_base_id: knowledgeBaseId,
      ...otherParams,
    },
  });

  if (error) throw error;
  if (!data.success) throw new Error(data.error || 'Failed to update Vapi agent');
}
