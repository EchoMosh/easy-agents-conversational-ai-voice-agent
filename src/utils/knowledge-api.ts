
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

export async function deleteDocument(id: string, filePath: string) {
  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from('knowledge')
    .remove([filePath]);

  if (storageError) throw storageError;

  // Delete from database
  const { error: dbError } = await supabase
    .from('knowledge_documents')
    .delete()
    .eq('id', id);

  if (dbError) throw dbError;
  
  return true;
}

export async function downloadDocument(filePath: string) {
  const { data, error } = await supabase.storage
    .from('knowledge')
    .download(filePath);

  if (error) throw error;
  return data;
}
