-- Add trieve_dataset_id to knowledge_documents table
ALTER TABLE knowledge_documents 
ADD COLUMN trieve_dataset_id TEXT;

-- Add index for better performance
CREATE INDEX idx_knowledge_documents_trieve_dataset_id ON knowledge_documents(trieve_dataset_id);

-- Add comment
COMMENT ON COLUMN knowledge_documents.trieve_dataset_id IS 'Trieve dataset ID for semantic search integration';
