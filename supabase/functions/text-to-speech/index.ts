
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

interface RequestBody {
  text: string;
  voice_id: string;
  model_id?: string;
}

serve(async (req) => {
  try {
    // Extract the request body
    const { text, voice_id, model_id = "eleven_multilingual_v2" } = await req.json() as RequestBody;
    
    if (!text) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    if (!voice_id) {
      return new Response(
        JSON.stringify({ error: "Voice ID is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    
    if (!ELEVENLABS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ElevenLabs API key not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    
    console.log(`Generating speech for text: ${text.substring(0, 50)}...`);
    
    // Call the ElevenLabs API
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
        { status: response.status, headers: { "Content-Type": "application/json" } }
      );
    }
    
    // Get the audio data as an ArrayBuffer
    const audioData = await response.arrayBuffer();
    
    // Convert to base64
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(audioData))
    );
    
    console.log("Successfully generated speech");
    
    // Return the base64-encoded audio data
    return new Response(
      JSON.stringify({
        audio_content: base64Audio,
        content_type: "audio/mpeg",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in text-to-speech function:", error);
    
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
