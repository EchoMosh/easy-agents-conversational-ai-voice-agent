
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log("Edge function received request:", req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request");
    return new Response(null, {
      status: 204, 
      headers: corsHeaders
    });
  }

  try {
    // Try to parse the request body
    let payload;
    try {
      payload = await req.json();
      console.log("Request payload:", JSON.stringify(payload));
    } catch (jsonError) {
      console.error("Error parsing JSON request:", jsonError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { text, voice_id, model_id } = payload;

    if (!text) {
      console.error("Missing required parameter: text");
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    if (!voice_id) {
      console.error("Missing required parameter: voice_id");
      return new Response(
        JSON.stringify({ error: "Voice ID is required" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get the ElevenLabs API key from environment variables
    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) {
      console.error("ElevenLabs API key not found in environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error: Missing API key" }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Generating TTS with voice_id: ${voice_id} and model_id: ${model_id || 'eleven_multilingual_v2'}`);

    // Make a request to the ElevenLabs API
    const elevenlabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`,
      {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": apiKey,
        },
        body: JSON.stringify({
          text: text,
          model_id: model_id || "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      }
    );

    if (!elevenlabsResponse.ok) {
      const errorData = await elevenlabsResponse.text();
      console.error("ElevenLabs API error:", elevenlabsResponse.status, errorData);
      
      let errorMessage;
      try {
        const errorJson = JSON.parse(errorData);
        errorMessage = errorJson.detail?.message || errorJson.detail || errorData;
      } catch (e) {
        errorMessage = errorData || `ElevenLabs API returned ${elevenlabsResponse.status}`;
      }
      
      return new Response(
        JSON.stringify({ error: `ElevenLabs API error: ${errorMessage}` }),
        { 
          status: elevenlabsResponse.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log("Successfully received audio from ElevenLabs API");
    
    // Get the audio data as an array buffer
    const audioData = await elevenlabsResponse.arrayBuffer();
    
    // Convert to base64
    const base64Audio = btoa(
      Array.from(new Uint8Array(audioData), byte => 
        String.fromCharCode(byte)).join('')
    );
    
    console.log(`Audio received, base64 length: ${base64Audio.length}`);

    // Return the audio content as base64
    return new Response(
      JSON.stringify({ audio_content: base64Audio }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: `Internal server error: ${error.message}` }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
