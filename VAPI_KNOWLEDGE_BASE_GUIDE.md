# Vapi Knowledge Base Implementation Guide

## Overview

This implementation adds Vapi knowledge base functionality to your agents, allowing users to upload documents and create knowledge bases using Vapi's Trieve provider. The agent can then use this knowledge to answer questions based on the uploaded content.

## What Was Implemented

### 1. Database Changes
- Added new columns to the `agents` table:
  - `vapi_knowledge_base_id` - Stores the Vapi knowledge base ID
  - `vapi_file_ids` - Array of Vapi file IDs
  
### 2. Supabase Edge Functions

#### `upload-vapi-file`
- Uploads files to Vapi
- Supports: TXT, PDF, DOCX, DOC, CSV, MD formats
- Returns Vapi file metadata

#### `create-vapi-knowledge-base`
- Creates a knowledge base using Trieve provider
- Configures search parameters (semantic/fulltext/hybrid)
- Links uploaded files to the knowledge base

#### `update-vapi-agent` (updated)
- Now includes knowledge base ID when updating Vapi agents

### 3. Frontend Components

#### Agent Settings Dialog
- Replaced old knowledge base dropdown with new Vapi knowledge base UI
- Added file upload with drag & drop support
- Shows uploaded files with delete option
- Knowledge base configuration (search type, topK, threshold)
- Create knowledge base button

#### Utility Functions (`vapi-knowledge-api.ts`)
- `uploadFileToVapi()` - Upload files to Vapi
- `createVapiKnowledgeBase()` - Create knowledge base
- `updateAgentKnowledgeBase()` - Update agent with knowledge base

### 4. TypeScript Types
- Updated `Agent` type to include new fields
- Added `VapiFile` and `VapiKnowledgeBase` types

## Setup Instructions

### 1. Apply Database Migration

First, ensure your Supabase project is linked:
```bash
cd supabase
npx supabase link --project-ref YOUR_PROJECT_REF
```

Then apply the migration:
```bash
npx supabase db push
```

Or manually run this SQL in your Supabase dashboard:
```sql
ALTER TABLE agents
ADD COLUMN IF NOT EXISTS vapi_knowledge_base_id TEXT,
ADD COLUMN IF NOT EXISTS vapi_file_ids TEXT[] DEFAULT '{}';
```

### 2. Deploy Edge Functions

Deploy the new edge functions:
```bash
cd supabase
npx supabase functions deploy upload-vapi-file
npx supabase functions deploy create-vapi-knowledge-base
npx supabase functions deploy update-vapi-agent
```

### 3. Set Environment Variables

Ensure your Vapi API key is set in Supabase:
```bash
npx supabase secrets set VAPI_API_KEY=your_vapi_api_key
```

## How to Use

### For End Users

1. **Navigate to Agent Settings**
   - Go to your agent flow page
   - Click on the agent settings button

2. **Go to Knowledge & Phrases Tab**
   - Click on the "Knowledge & Phrases" tab

3. **Upload Files**
   - Drag and drop files or click to browse
   - Supported formats: TXT, PDF, DOCX, DOC, CSV, MD
   - Recommended file size: < 300KB for best performance

4. **Configure Knowledge Base**
   - Choose search type:
     - **Semantic**: Best for natural language queries
     - **Full Text**: Best for exact phrase matching
     - **Hybrid**: Combination of both
   - Set Top K results (1-10): Number of relevant chunks to retrieve
   - Set Score Threshold (0-1): Minimum relevance score

5. **Create Knowledge Base**
   - Click "Create Knowledge Base" button
   - Wait for confirmation

6. **Save Settings**
   - Click "Save Settings" to update the agent

### For Developers

#### Upload a File
```typescript
import { uploadFileToVapi } from '@/utils/vapi-knowledge-api';

const file = new File(['content'], 'test.txt', { type: 'text/plain' });
const vapiFile = await uploadFileToVapi(file);
console.log(vapiFile.id); // Use this ID for knowledge base
```

#### Create Knowledge Base
```typescript
import { createVapiKnowledgeBase } from '@/utils/vapi-knowledge-api';

const kb = await createVapiKnowledgeBase(
  'my-knowledge-base',
  ['file-id-1', 'file-id-2'],
  'agent-id',
  {
    searchType: 'semantic',
    topK: 3,
    scoreThreshold: 0.7
  }
);
```

#### Update Agent
```typescript
import { updateAgentKnowledgeBase } from '@/utils/vapi-knowledge-api';

await updateAgentKnowledgeBase(
  'agent-id',
  'knowledge-base-id',
  ['file-id-1', 'file-id-2']
);
```

## API Reference

### POST /upload-vapi-file
Upload a file to Vapi.

**Request:**
```typescript
{
  file: File // File object from form data
}
```

**Response:**
```typescript
{
  id: string;
  name: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}
```

### POST /create-vapi-knowledge-base
Create a Vapi knowledge base with Trieve provider.

**Request:**
```typescript
{
  name: string;
  fileIds: string[];
  agentId: string;
  searchType?: 'semantic' | 'fulltext' | 'hybrid';
  topK?: number;
  scoreThreshold?: number;
}
```

**Response:**
```typescript
{
  id: string;
  provider: 'trieve';
  name: string;
  // ... other fields
}
```

## Troubleshooting

### Common Issues

1. **"Failed to upload file"**
   - Check file size (< 300KB recommended)
   - Verify file format is supported
   - Check Vapi API key is set correctly

2. **"Failed to create knowledge base"**
   - Ensure at least one file is uploaded
   - Verify Vapi API key has correct permissions
   - Check if file IDs are valid

3. **TypeScript errors on line 900**
   - These are likely stale/cached errors
   - Try restarting TypeScript service in VSCode
   - The step attributes have been fixed to use strings

### Testing

To test the implementation:

1. Create a test file:
```javascript
// test-vapi-knowledge.js
const fs = require('fs');

async function testVapiKnowledge() {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  // Test file upload
  const fileContent = 'This is a test document about AI agents.';
  const blob = new Blob([fileContent], { type: 'text/plain' });
  
  const formData = new FormData();
  formData.append('file', blob, 'test.txt');
  
  const uploadResponse = await fetch(`${SUPABASE_URL}/functions/v1/upload-vapi-file`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: formData
  });
  
  const file = await uploadResponse.json();
  console.log('Uploaded file:', file);
  
  // Test knowledge base creation
  const kbResponse = await fetch(`${SUPABASE_URL}/functions/v1/create-vapi-knowledge-base`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'test-kb',
      fileIds: [file.id],
      agentId: 'test-agent',
      searchType: 'semantic',
      topK: 3,
      scoreThreshold: 0.7
    })
  });
  
  const kb = await kbResponse.json();
  console.log('Created knowledge base:', kb);
}

testVapiKnowledge().catch(console.error);
```

2. Run the test:
```bash
node test-vapi-knowledge.js
```

## Next Steps

1. Apply the database migration
2. Deploy the edge functions
3. Test file upload and knowledge base creation
4. Monitor Vapi dashboard for created resources

## Notes

- Files larger than 300KB may impact performance
- The Trieve provider is optimized for semantic search
- Knowledge bases can be updated by creating a new one
- Old files should be cleaned up periodically from Vapi

## Support

If you encounter issues:
1. Check the Supabase function logs
2. Verify Vapi API key and permissions
3. Review the browser console for errors
4. Ensure database migration was applied
