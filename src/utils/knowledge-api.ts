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
  file: File,
  description?: string
): Promise<KnowledgeDocument> => {
  // Implementation for file upload
  // ...

  throw new Error("Not implemented");
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
