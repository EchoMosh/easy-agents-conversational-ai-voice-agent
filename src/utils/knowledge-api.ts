
import { supabase } from "@/integrations/supabase/client";
import { KnowledgeDocument } from "@/types/supabase-extended";

export interface DocumentUploadOptions {
  title: string;
  description?: string;
}

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
  file: File,
  options: DocumentUploadOptions
): Promise<KnowledgeDocument> => {
  // This is a placeholder implementation that will be properly implemented later
  // It handles file uploads
  throw new Error("File upload not yet implemented");
};

export const uploadTextDocument = async (
  content: string,
  options: DocumentUploadOptions
): Promise<KnowledgeDocument> => {
  // This will be implemented properly later
  throw new Error("Text upload not yet implemented");
};

export const uploadUrlDocument = async (
  url: string,
  options: DocumentUploadOptions
): Promise<KnowledgeDocument> => {
  // This will be implemented properly later
  throw new Error("URL import not yet implemented");
};

export const downloadDocument = async (
  documentId: string
): Promise<Blob> => {
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
