import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
};

interface CreateTrieveDatasetRequest {
  name: string;
  description?: string;
  agent_id?: string; // Optional for knowledge documents
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create Supabase client with the user's token for auth verification
    const supabaseAuth = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Create service role client for database operations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { name, description, agent_id } = await req.json() as CreateTrieveDatasetRequest;

    // Get Trieve credentials from environment
    const trieveApiKey = Deno.env.get('TRIEVE_API_KEY');
    const trieveOrgId = Deno.env.get('TRIEVE_ORG_ID');

    if (!trieveApiKey || !trieveOrgId) {
      console.error('Trieve credentials not configured');
      return new Response(
        JSON.stringify({ 
          error: 'Trieve credentials not configured',
          message: 'TRIEVE_API_KEY or TRIEVE_ORG_ID environment variables are missing'
        }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Creating Trieve dataset:', name);

    // Create dataset in Trieve
    const trieveResponse = await fetch('https://api.trieve.ai/api/dataset', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${trieveApiKey}`,
        'TR-Organization': trieveOrgId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dataset_name: name,
        organization_id: trieveOrgId,
        description: description || `Dataset for ${name}`,
        server_configuration: {
          // Default configuration for the dataset
          search_type: "semantic",
          use_qdrant_for_search: true,
          reranker_enabled: true,
        }
      }),
    });

    if (!trieveResponse.ok) {
      const errorText = await trieveResponse.text();
      console.error('Trieve API error:', errorText);
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create Trieve dataset',
          message: errorText,
          status: trieveResponse.status
        }),
        { 
          status: trieveResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const trieveData = await trieveResponse.json();
    console.log('Trieve dataset created:', trieveData);

    // Store the Trieve dataset ID in the agent record (if agent_id is provided)
    if (agent_id) {
      const { error: updateError } = await supabase
        .from('agents')
        .update({ 
          trieve_dataset_id: trieveData.id 
        })
        .eq('id', agent_id);

      if (updateError) {
        console.error('Error updating agent with Trieve dataset ID:', updateError);
        // Don't fail the request, just log the error
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        dataset_id: trieveData.id,
        dataset: trieveData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error creating Trieve dataset:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
