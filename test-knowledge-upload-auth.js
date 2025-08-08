import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = 'https://ahpmmgnkksrbpthniptg.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testKnowledgeUpload() {
  console.log('Testing knowledge base upload functionality with authentication...\n');

  try {
    // First, sign in to get an authenticated session
    console.log('1. Signing in...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com', // Replace with your test user email
      password: 'testpassword123' // Replace with your test user password
    });

    if (authError) {
      console.error('Auth error:', authError);
      console.log('\nPlease update the email and password in this script with valid credentials.');
      return;
    }

    console.log('✅ Successfully authenticated\n');

    // Get the session token
    const session = authData.session;
    if (!session) {
      console.error('No session returned');
      return;
    }

    // Test Trieve dataset creation with authentication
    console.log('2. Testing Trieve dataset creation...');
    const { data: trieveData, error: trieveError } = await supabase.functions.invoke('create-trieve-dataset', {
      body: {
        name: 'Test Knowledge Document',
        description: 'Testing Trieve integration with auth'
      },
      headers: {
        Authorization: `Bearer ${session.access_token}`
      }
    });

    if (trieveError) {
      console.error('Dataset creation error:', trieveError);
    } else {
      console.log('✅ Dataset created successfully:', trieveData);
      
      // If dataset creation succeeded, test uploading content
      if (trieveData?.dataset_id) {
        console.log('\n3. Testing content upload to Trieve...');
        const { data: uploadData, error: uploadError } = await supabase.functions.invoke('upload-to-trieve', {
          body: {
            dataset_id: trieveData.dataset_id,
            chunk_data: {
              chunk_html: 'This is test content for the knowledge base.',
              metadata: {
                title: 'Test Document',
                description: 'A test document',
                file_type: 'text/plain',
                file_size: 42
              }
            }
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (uploadError) {
          console.error('Upload error:', uploadError);
        } else {
          console.log('✅ Content uploaded successfully:', uploadData);
        }
      }
    }

    // Sign out
    await supabase.auth.signOut();
    console.log('\n✅ Test completed and signed out');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the test
testKnowledgeUpload();
