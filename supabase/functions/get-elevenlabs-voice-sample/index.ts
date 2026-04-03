import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VoiceSampleRequest {
  voice_id: string;
  text: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Create Supabase client with the user's token for auth verification
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      },
    );

    // Verify the user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { voice_id, text } = (await req.json()) as VoiceSampleRequest;

    if (!voice_id || !text) {
      return new Response(
        JSON.stringify({ error: "voice_id and text are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const elevenLabsApiKey = Deno.env.get("ELEVEN_LABS_API_KEY");

    if (!elevenLabsApiKey) {
      console.error("ElevenLabs API key not found in environment variables");
      return new Response(
        JSON.stringify({ error: "ElevenLabs API key not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    console.log("Generating voice sample for voice_id:", voice_id);

    // Make request to ElevenLabs TTS API
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}`,
      {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": elevenLabsApiKey,
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs TTS API error:", response.status, errorText);
      return new Response(
        JSON.stringify({
          error: "Failed to generate voice sample",
          details: errorText,
          status: response.status,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get the audio data as an array buffer
    const audioBuffer = await response.arrayBuffer();
    const audioUint8Array = new Uint8Array(audioBuffer);

    // Generate a unique filename
    const timestamp = Date.now();
    const filename = `voice-preview-${voice_id}-${timestamp}.mp3`;
    const filePath = `voice-previews/${filename}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("voice-previews")
      .upload(filePath, audioUint8Array, {
        contentType: "audio/mpeg",
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("Supabase storage upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to store audio file" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from("voice-previews")
      .getPublicUrl(filePath);

    console.log(
      "Voice sample generated and uploaded successfully:",
      urlData.publicUrl,
    );

    return new Response(
      JSON.stringify({
        success: true,
        audioUrl: urlData.publicUrl,
        filename: filename,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error in get-elevenlabs-voice-sample function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
