
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { agentId, elevenLabsAgentId } = await req.json();
    
    if (!agentId) {
      throw new Error('Agent ID is required');
    }
    
    console.log(`Generating signed URL for agent: ${agentId}, ElevenLabs agent ID: ${elevenLabsAgentId || 'not provided'}`);
    
    // Check if API key is configured
    const apiKey = Deno.env.get('ELEVENLABS_API_KEY');
    if (!apiKey) {
      console.error('ELEVENLABS_API_KEY environment variable is not set');
      throw new Error('ElevenLabs API key not configured');
    }
    
    // Use the ElevenLabs agent ID if provided, otherwise use the local agent ID
    const targetAgentId = elevenLabsAgentId || agentId;
    
    console.log(`Using agent ID for ElevenLabs: ${targetAgentId}`);
    
    // Request signed URL from ElevenLabs API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${targetAgentId}`,
      {
        method: 'GET',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    const responseText = await response.text();
    console.log(`ElevenLabs API response status: ${response.status}`);
    console.log(`ElevenLabs API response body: ${responseText}`);

    if (!response.ok) {
      const status = response.status;
      
      // Provide more descriptive error based on status code
      if (status === 401) {
        throw new Error('ElevenLabs API authentication failed: Invalid API key');
      } else if (status === 404) {
        throw new Error(`ElevenLabs API error: Agent not found or not configured for voice (ID: ${targetAgentId})`);
      } else {
        throw new Error(`ElevenLabs API error: ${status} - ${responseText}`);
      }
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse ElevenLabs API response as JSON:', e);
      throw new Error('Invalid response format from ElevenLabs API');
    }
    
    if (!data.signed_url) {
      console.error('ElevenLabs API response missing signed_url:', data);
      throw new Error('Invalid response from ElevenLabs API: missing signed_url');
    }
    
    console.log('Successfully generated signed URL');
    
    return new Response(
      JSON.stringify({ signedUrl: data.signed_url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating signed URL:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
