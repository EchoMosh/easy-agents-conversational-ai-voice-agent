// Test script to verify knowledge base upload functionality
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testKnowledgeUpload() {
  console.log('Testing knowledge base upload functionality...');
  
  try {
    // Test 1: Create Trieve dataset
    console.log('\n1. Testing Trieve dataset creation...');
    const { data: datasetData, error: datasetError } = await supabase.functions.invoke('create-trieve-dataset', {
      body: {
        name: 'Test Knowledge Base',
        description: 'Test dataset for knowledge base functionality'
      }
    });
    
    if (datasetError) {
      console.error('Dataset creation error:', datasetError);
      return;
    }
    
    console.log('✅ Dataset created successfully:', datasetData);
    const datasetId = datasetData.dataset_id;
    
    // Test 2: Upload content to Trieve
    console.log('\n2. Testing content upload to Trieve...');
    const { data: uploadData, error: uploadError } = await supabase.functions.invoke('upload-to-trieve', {
      body: {
        dataset_id: datasetId,
        chunk_data: {
          chunk_html: 'This is a test document for the knowledge base system. It contains important information about how the system works.',
          metadata: {
            title: 'Test Document',
            description: 'A test document for verification',
            file_type: 'text/plain',
            file_size: 100
          }
        }
      }
    });
    
    if (uploadError) {
      console.error('Upload error:', uploadError);
      return;
    }
    
    console.log('✅ Content uploaded successfully:', uploadData);
    
    console.log('\n🎉 All tests passed! Knowledge base system is working correctly.');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testKnowledgeUpload();
