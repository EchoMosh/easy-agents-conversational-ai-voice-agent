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

export interface TrieveDataset {
  id: string;
  dataset_name: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
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

export async function createTrieveDataset(
  name: string,
  agentId: string
): Promise<TrieveDataset> {
  const { data, error } = await supabase.functions.invoke('create-trieve-dataset', {
    body: {
      name,
      agent_id: agentId,
    },
  });

  if (error) throw error;
  if (!data.success) throw new Error(data.error || 'Failed to create Trieve dataset');

  return data.dataset;
}

export async function uploadToTrieve(
  datasetId: string,
  files: Array<{ name: string; content: string; type: string }>
): Promise<any> {
  const { data, error } = await supabase.functions.invoke('upload-to-trieve', {
    body: {
      dataset_id: datasetId,
      files,
    },
  });

  if (error) throw error;
  if (!data.success && data.status !== 207) {
    throw new Error(data.error || 'Failed to upload files to Trieve');
  }

  return data;
}

export async function createVapiKnowledgeBase(
  name: string,
  trieveDatasetId: string,
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
      trieveDatasetId,
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

/**
 * Creates a knowledge base for an agent using existing knowledge documents
 * This function bridges the gap between the traditional knowledge system and Trieve
 */
export async function createKnowledgeBaseFromDocuments(
  agentId: string,
  knowledgeIds: string[],
  options?: {
    searchType?: 'semantic' | 'fulltext' | 'hybrid';
    topK?: number;
    scoreThreshold?: number;
  }
): Promise<{ knowledgeBaseId: string; trieveDatasetId: string }> {
  // Get knowledge documents with their Trieve dataset IDs
  const { data: knowledgeDocs, error: fetchError } = await supabase
    .from('knowledge_documents')
    .select('id, title, trieve_dataset_id')
    .in('id', knowledgeIds);

  if (fetchError) throw fetchError;

  // Filter documents that have Trieve dataset IDs
  const docsWithTrieve = knowledgeDocs.filter(doc => doc.trieve_dataset_id);
  
  if (docsWithTrieve.length === 0) {
    throw new Error('No knowledge documents have been processed with Trieve integration');
  }

  // For now, use the first document's Trieve dataset ID
  // In the future, we could merge multiple datasets or create a combined one
  const primaryTrieveDatasetId = docsWithTrieve[0].trieve_dataset_id;
  
  // Create a Vapi knowledge base using the existing Trieve dataset
  const knowledgeBase = await createVapiKnowledgeBase(
    `Agent ${agentId} Knowledge Base`,
    primaryTrieveDatasetId,
    agentId,
    options
  );

  // Update the agent with the knowledge base ID and Trieve dataset ID
  const { error: updateError } = await supabase
    .from('agents')
    .update({
      vapi_knowledge_base_id: knowledgeBase.id,
      trieve_dataset_id: primaryTrieveDatasetId,
      updated_at: new Date().toISOString(),
    } as any)
    .eq('id', agentId);

  if (updateError) throw updateError;

  return {
    knowledgeBaseId: knowledgeBase.id,
    trieveDatasetId: primaryTrieveDatasetId
  };
}
