# Knowledge Base System - Complete Architecture Explanation

## Overview

The knowledge base system in this application allows users to upload documents that are then processed and made available to AI agents for enhanced conversations. The system uses a hybrid approach combining **Trieve** (for semantic search and vector storage) and **VAPI** (for voice agent integration).

## System Architecture

### 1. Document Upload Flow

When a user uploads a knowledge document:

```
User Upload → Frontend → Supabase Storage → Edge Functions → Trieve + VAPI → Agent Integration
```

#### Step-by-Step Process:

1. **File Upload**: User selects a file through the UI (`agent-training-popup.tsx`)
2. **Storage**: File is uploaded to Supabase Storage bucket
3. **Processing**: Multiple edge functions process the document:
   - Extract text content from the file
   - Create Trieve dataset (if needed)
   - Upload content to Trieve for semantic search
   - Create VAPI knowledge base
   - Upload file to VAPI for voice processing
4. **Database Storage**: Document metadata is stored in `knowledge_documents` table
5. **Agent Linking**: Knowledge base is linked to the agent

### 2. Data Storage Locations

#### Supabase Database Tables:
- **`knowledge_documents`**: Stores document metadata, file paths, and Trieve dataset IDs
- **`agents`**: Contains `knowledge_base_id` (VAPI) and `trieve_dataset_id` fields

#### External Services:
- **Supabase Storage**: Raw file storage in `knowledge-documents` bucket
- **Trieve**: Semantic search and vector embeddings storage
- **VAPI**: Voice-optimized knowledge base for agent conversations

### 3. Key Components

#### Frontend Components:
- `src/components/agents/training/agent-training-popup.tsx` - Upload interface
- `src/utils/knowledge-api.ts` - API calls for knowledge management
- `src/utils/vapi-knowledge-api.ts` - VAPI-specific knowledge operations

#### Backend Edge Functions:
- `supabase/functions/create-trieve-dataset/` - Creates Trieve datasets
- `supabase/functions/upload-to-trieve/` - Uploads content to Trieve
- `supabase/functions/create-vapi-knowledge-base/` - Creates VAPI knowledge bases
- `supabase/functions/upload-vapi-file/` - Uploads files to VAPI
- `supabase/functions/update-vapi-agent/` - Updates agent with knowledge base

## How Knowledge Attaches to Agents

### VAPI Integration:
1. When a document is uploaded, a VAPI knowledge base is created
2. The knowledge base ID is stored in the `agents.knowledge_base_id` field
3. When the agent is updated via VAPI API, it includes the knowledge base reference
4. During voice conversations, VAPI automatically uses the knowledge base for context

### Trieve Integration:
1. Each document gets its own Trieve dataset for semantic search
2. The dataset ID is stored in `knowledge_documents.trieve_dataset_id`
3. Agents can reference the Trieve dataset ID for enhanced search capabilities
4. Multiple documents can be linked to the same agent through the database relationships

## API Flow Examples

### Document Upload API Flow:

```typescript
// 1. Upload file to Supabase Storage
const { data: fileData } = await supabase.storage
  .from('knowledge-documents')
  .upload(filePath, file);

// 2. Create Trieve dataset
const trieveResponse = await callSupabaseFunction('create-trieve-dataset', {
  name: metadata.title,
  description: metadata.description
});

// 3. Upload content to Trieve
await callSupabaseFunction('upload-to-trieve', {
  dataset_id: trieveDatasetId,
  chunk_data: {
    chunk_html: textContent,
    metadata: {
      title: metadata.title,
      file_type: file.type,
      file_size: file.size
    }
  }
});

// 4. Create VAPI knowledge base
const vapiKnowledgeBase = await createVapiKnowledgeBase(metadata.title);

// 5. Upload file to VAPI
await uploadFileToVapi(vapiKnowledgeBase.id, file, metadata.title);

// 6. Store in database
await supabase.from('knowledge_documents').insert({
  title: metadata.title,
  file_path: filePath,
  file_type: file.type,
  file_size: file.size,
  agent_id: agentId,
  trieve_dataset_id: trieveDatasetId,
  vapi_knowledge_base_id: vapiKnowledgeBase.id
});
```

### Agent Knowledge Integration:

```typescript
// Update agent with knowledge base
await supabase.from('agents').update({
  knowledge_base_id: vapiKnowledgeBase.id,
  trieve_dataset_id: trieveDatasetId
}).eq('id', agentId);

// Update VAPI agent
await callSupabaseFunction('update-vapi-agent', {
  agent_id: agentId,
  knowledge_base_id: vapiKnowledgeBase.id
});
```

## Environment Configuration

### Required Environment Variables:
```bash
# Trieve Configuration
TRIEVE_API_KEY=your_trieve_api_key
TRIEVE_ORG_ID=your_trieve_org_id

# VAPI Configuration  
VAPI_API_KEY=your_vapi_api_key

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Database Schema

### knowledge_documents table:
```sql
CREATE TABLE knowledge_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  agent_id UUID REFERENCES agents(id),
  trieve_dataset_id TEXT,
  vapi_knowledge_base_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### agents table (relevant fields):
```sql
ALTER TABLE agents ADD COLUMN knowledge_base_id TEXT;
ALTER TABLE agents ADD COLUMN trieve_dataset_id TEXT;
```

## Error Handling

The system includes comprehensive error handling:

1. **File Upload Errors**: Handled in the frontend with user feedback
2. **Trieve API Errors**: Logged and returned with specific error messages
3. **VAPI API Errors**: Graceful fallback and error reporting
4. **Database Errors**: Transaction rollback and cleanup

## Security Considerations

1. **File Validation**: File types and sizes are validated before upload
2. **Access Control**: RLS policies ensure users can only access their own documents
3. **API Keys**: Stored securely as Supabase secrets
4. **CORS**: Properly configured for cross-origin requests

## Performance Optimizations

1. **Chunked Processing**: Large documents are processed in chunks
2. **Async Operations**: Non-blocking uploads and processing
3. **Caching**: Metadata cached in database for quick access
4. **Batch Operations**: Multiple documents can be processed efficiently

## Monitoring and Debugging

1. **Logs**: Comprehensive logging in edge functions
2. **Error Tracking**: Detailed error messages and stack traces
3. **Status Monitoring**: Function deployment status and health checks
4. **Performance Metrics**: Upload times and processing statistics

## Future Enhancements

1. **Document Versioning**: Track document updates and versions
2. **Advanced Search**: Enhanced semantic search capabilities
3. **Document Preprocessing**: OCR for images, advanced text extraction
4. **Analytics**: Usage statistics and performance metrics
5. **Bulk Operations**: Batch upload and processing capabilities

---

This system provides a robust, scalable knowledge base solution that seamlessly integrates with both semantic search (Trieve) and voice AI (VAPI) capabilities, ensuring agents have access to relevant information during conversations.
