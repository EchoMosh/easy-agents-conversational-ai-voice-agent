import { supabase } from "@/integrations/supabase/client";
import { KnowledgeDocument } from "@/types/supabase-extended";

// Helper function to call Supabase Edge Functions
async function callSupabaseFunction(functionName: string, body: any) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const { data, error } = await supabase.functions.invoke(functionName, {
    body,
    headers: { Authorization: `Bearer ${session?.access_token}` },
  });

  if (error) throw error;
  return data;
}

// Helper function to extract text content from files
async function extractTextFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      resolve(text);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

export async function fetchDocuments() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("knowledge_documents")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as KnowledgeDocument[];
}

export async function uploadDocument(
  file: File,
  metadata: { title: string; description?: string },
) {
  // Upload file to storage
  const fileExt = file.name.split(".").pop();
  const filePath = `${crypto.randomUUID()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("knowledge")
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  let trieveDatasetId = null;

  try {
    // Create Trieve dataset for this document
    const trieveResponse = await callSupabaseFunction("create-trieve-dataset", {
      name: metadata.title || file.name,
      description:
        metadata.description ||
        `Knowledge document: ${metadata.title || file.name}`,
    });

    trieveDatasetId = trieveResponse.dataset_id;

    // Extract text content and upload to Trieve
    let textContent = "";
    if (file.type === "text/plain" || file.type === "text/csv") {
      textContent = await extractTextFromFile(file);
    } else {
      // For other file types, use the file name and description as content
      textContent = `${metadata.title || file.name}\n${metadata.description || ""}`;
    }

    // Upload content to Trieve
    await callSupabaseFunction("upload-to-trieve", {
      dataset_id: trieveDatasetId,
      chunk_data: {
        chunk_html: textContent,
        metadata: {
          title: metadata.title || file.name,
          description: metadata.description,
          file_type: file.type,
          file_size: file.size,
        },
      },
    });
  } catch (trieveError) {
    console.warn(
      "Trieve integration failed, continuing without it:",
      trieveError,
    );
    // Continue without Trieve integration if it fails
  }

  // Save document metadata
  const { data, error: dbError } = await supabase
    .from("knowledge_documents")
    .insert({
      title: metadata.title || file.name,
      description: metadata.description || null,
      file_path: filePath,
      file_type: file.type,
      file_size: file.size,
      trieve_dataset_id: trieveDatasetId,
      user_id: (await supabase.auth.getUser()).data.user?.id,
    })
    .select()
    .single();

  if (dbError) throw dbError;

  return data as KnowledgeDocument;
}

export async function uploadUrlDocument(
  url: string,
  metadata: { title: string; description?: string },
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Save as special URL type document
  const { data, error } = await supabase
    .from("knowledge_documents")
    .insert({
      title: metadata.title,
      description: metadata.description || null,
      file_path: url, // Store the URL in the file_path field
      file_type: "url/link",
      file_size: 0, // URL itself doesn't have a size
      user_id: user?.id,
    })
    .select()
    .single();

  if (error) throw error;

  return data as KnowledgeDocument;
}

export async function uploadTextDocument(
  content: string,
  metadata: { title: string; description?: string },
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Convert text to blob and upload
  const textBlob = new Blob([content], { type: "text/plain" });
  const filePath = `${crypto.randomUUID()}.txt`;

  const { error: uploadError } = await supabase.storage
    .from("knowledge")
    .upload(filePath, textBlob);

  if (uploadError) throw uploadError;

  let trieveDatasetId = null;

  try {
    // Create Trieve dataset for this document
    const trieveResponse = await callSupabaseFunction("create-trieve-dataset", {
      name: metadata.title,
      description: metadata.description || `Text document: ${metadata.title}`,
    });

    trieveDatasetId = trieveResponse.dataset_id;

    // Upload content to Trieve
    await callSupabaseFunction("upload-to-trieve", {
      dataset_id: trieveDatasetId,
      chunk_data: {
        chunk_html: content,
        metadata: {
          title: metadata.title,
          description: metadata.description,
          file_type: "text/plain",
          file_size: textBlob.size,
        },
      },
    });
  } catch (trieveError) {
    console.warn(
      "Trieve integration failed, continuing without it:",
      trieveError,
    );
    // Continue without Trieve integration if it fails
  }

  // Save document metadata
  const { data, error: dbError } = await supabase
    .from("knowledge_documents")
    .insert({
      title: metadata.title,
      description: metadata.description || null,
      file_path: filePath,
      file_type: "text/plain",
      file_size: textBlob.size,
      trieve_dataset_id: trieveDatasetId,
      user_id: user?.id,
    })
    .select()
    .single();

  if (dbError) throw dbError;

  return data as KnowledgeDocument;
}

export async function deleteDocument(id: string, filePath: string) {
  // For URL documents, we don't need to delete anything from storage
  if (!filePath.startsWith("http")) {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from("knowledge")
      .remove([filePath]);

    if (storageError) throw storageError;
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from("knowledge_documents")
    .delete()
    .eq("id", id);

  if (dbError) throw dbError;

  return true;
}

export async function downloadDocument(filePath: string) {
  // For URL documents, just return the URL
  if (filePath.startsWith("http")) {
    return new Blob([filePath], { type: "text/plain" });
  }

  const { data, error } = await supabase.storage
    .from("knowledge")
    .download(filePath);

  if (error) throw error;
  return data;
}
