
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

// CORS headers to allow cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestBody {
  text: string;
  voice_id: string;
  model_id?: string;
}

serve(async (req) => {
  console.log(`Request received: ${req.method} ${req.url}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    return new Response(null, {
      status: 204,
      headers: corsHeaders
    });
  }

  try {
    if (req.method !== 'POST') {
      console.error(`Unsupported method: ${req.method}`);
      return new Response(
        JSON.stringify({ error: `Method ${req.method} not allowed` }),
        { 
          status: 405, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    // Extract the request body
    let requestBody: RequestBody;
    try {
      requestBody = await req.json();
      console.log(`Received request with text length: ${requestBody.text?.length || 0}, voice_id: ${requestBody.voice_id}`);
    } catch (parseError) {
      console.error('Error parsing request body:', parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    const { text, voice_id, model_id = "eleven_multilingual_v2" } = requestBody;
    
    if (!text) {
      console.error('Missing text parameter');
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    if (!voice_id) {
      console.error('Missing voice_id parameter');
      return new Response(
        JSON.stringify({ error: "Voice ID is required" }),
        { 
          status: 400, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    if (!ELEVENLABS_API_KEY) {
      console.error('ElevenLabs API key not configured');
      return new Response(
        JSON.stringify({ error: "ElevenLabs API key not configured" }),
        { 
          status: 500, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
    
    console.log(`Generating speech for text: ${text.substring(0, 50)}...`);
    console.log(`Using voice ID: ${voice_id}`);
    console.log(`Using model ID: ${model_id}`);
    
    // Call the ElevenLabs API
    try {
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY,
          },
          body: JSON.stringify({
            text: text,
            model_id: model_id,
            voice_settings: {
              stability: 0.75,
              similarity_boost: 0.75,
            },
          }),
        }
      );
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`ElevenLabs API error (${response.status}):`, errorText);
        
        return new Response(
          JSON.stringify({ 
            error: `ElevenLabs API returned ${response.status}`,
            details: errorText
          }),
          { 
            status: response.status, 
            headers: { 
              ...corsHeaders,
              'Content-Type': 'application/json' 
            } 
          }
        );
      }
      
      // Get the audio data as an ArrayBuffer
      const audioData = await response.arrayBuffer();
      
      // Convert to base64
      const base64Audio = btoa(
        String.fromCharCode(...new Uint8Array(audioData))
      );
      
      console.log("Successfully generated speech, returning audio data");
      
      // Return the base64-encoded audio data
      return new Response(
        JSON.stringify({
          audio_content: base64Audio,
          content_type: "audio/mpeg",
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    } catch (apiError) {
      console.error("Error calling ElevenLabs API:", apiError);
      return new Response(
        JSON.stringify({ 
          error: "Error calling ElevenLabs API", 
          details: apiError.message 
        }),
        { 
          status: 500, 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
  } catch (error) {
    console.error("Unhandled error in text-to-speech function:", error);
    
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
