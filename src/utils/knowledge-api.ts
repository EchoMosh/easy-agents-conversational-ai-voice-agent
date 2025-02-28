
import { supabase } from '@/integrations/supabase/client';
import { KnowledgeDocument } from '@/types/supabase-extended';

export async function fetchDocuments() {
  const { data, error } = await supabase
    .from('knowledge_documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as KnowledgeDocument[];
}

export async function uploadDocument(file: File, metadata: { title: string; description?: string }) {
  // Upload file to storage
  const fileExt = file.name.split('.').pop();
  const filePath = `${crypto.randomUUID()}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('knowledge')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  // Save document metadata
  const { data, error: dbError } = await supabase
    .from('knowledge_documents')
    .insert({
      title: metadata.title || file.name,
      description: metadata.description || null,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
      user_id: (await supabase.auth.getUser()).data.user?.id
    })
    .select()
    .single();

  if (dbError) throw dbError;
  
  return data as KnowledgeDocument;
}

export async function uploadUrlDocument(url: string, metadata: { title: string; description?: string }) {
  const { data: { user } } = await supabase.auth.getUser();
  
  // Save as special URL type document
  const { data, error } = await supabase
    .from('knowledge_documents')
    .insert({
      title: metadata.title,
      description: metadata.description || null,
      file_path: url, // Store the URL in the file_path field
      file_type: 'url/link',
      file_size: 0, // URL itself doesn't have a size
      user_id: user?.id
    })
    .select()
    .single();

  if (error) throw error;
  
  return data as KnowledgeDocument;
}

export async function uploadTextDocument(content: string, metadata: { title: string; description?: string }) {
  const { data: { user } } = await supabase.auth.getUser();
  
  // Convert text to blob and upload
  const textBlob = new Blob([content], { type: 'text/plain' });
  const filePath = `${crypto.randomUUID()}.txt`;
  
  const { error: uploadError } = await supabase.storage
    .from('knowledge')
    .upload(filePath, textBlob);

  if (uploadError) throw uploadError;

  // Save document metadata
  const { data, error: dbError } = await supabase
    .from('knowledge_documents')
    .insert({
      title: metadata.title,
      description: metadata.description || null,
      file_path: filePath,
      file_type: 'text/plain',
      file_size: textBlob.size,
      user_id: user?.id
    })
    .select()
    .single();

  if (dbError) throw dbError;
  
  return data as KnowledgeDocument;
}

export async function deleteDocument(id: string, filePath: string) {
  // For URL documents, we don't need to delete anything from storage
  if (!filePath.startsWith('http')) {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('knowledge')
      .remove([filePath]);

    if (storageError) throw storageError;
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from('knowledge_documents')
    .delete()
    .eq('id', id);

  if (dbError) throw dbError;
  
  return true;
}

export async function downloadDocument(filePath: string) {
  // For URL documents, just return the URL
  if (filePath.startsWith('http')) {
    return new Blob([filePath], { type: 'text/plain' });
  }
  
  const { data, error } = await supabase.storage
    .from('knowledge')
    .download(filePath);

  if (error) throw error;
  return data;
}
