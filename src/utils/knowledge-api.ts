
import { supabase } from "@/integrations/supabase/client";
import { KnowledgeDocument } from "@/types/supabase-extended";

export const fetchDocuments = async (): Promise<KnowledgeDocument[]> => {
  const { data, error } = await supabase
    .from("knowledge_documents")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Error fetching documents: ${error.message}`);
  }

  return data || [];
};

export const uploadDocument = async (
  title: string,
  file: File | string,
  description?: string
): Promise<KnowledgeDocument> => {
  // This is a placeholder implementation that will be properly implemented later
  // It handles multiple types of uploads (file, text, URL)
  
  if (typeof file === 'string') {
    // Handle text or URL uploads
    // Implementation will be added later
    throw new Error("Text and URL uploads not yet implemented");
  } else {
    // Handle file upload
    // Implementation will be added later
    throw new Error("File upload not yet implemented");
  }
};

export const uploadTextDocument = async (
  title: string,
  content: string,
  description?: string
): Promise<KnowledgeDocument> => {
  // This will be implemented properly later
  return uploadDocument(title, content, description);
};

export const uploadUrlDocument = async (
  title: string,
  url: string,
  description?: string
): Promise<KnowledgeDocument> => {
  // This will be implemented properly later
  return uploadDocument(title, url, description);
};

export const downloadDocument = async (
  documentId: string
): Promise<string> => {
  // This is a placeholder implementation
  throw new Error("Download not yet implemented");
};

export const deleteDocument = async (
  documentId: string
): Promise<void> => {
  const { error } = await supabase
    .from("knowledge_documents")
    .delete()
    .eq("id", documentId);

  if (error) {
    throw new Error(`Error deleting document: ${error.message}`);
  }
};
