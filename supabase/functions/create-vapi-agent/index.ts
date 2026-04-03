import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateVapiAgentRequest {
  agentName: string;
  role: string;
  language: string;
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

    const { agentName, role, language } =
      (await req.json()) as CreateVapiAgentRequest;

    if (!agentName || !agentName.trim()) {
      return new Response(JSON.stringify({ error: "agentName is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!role || !role.trim()) {
      return new Response(JSON.stringify({ error: "role is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const vapiApiKey = Deno.env.get("VAPI_API_KEY");
    if (!vapiApiKey) {
      throw new Error("VAPI_API_KEY is not set in environment variables");
    }

    const response = await fetch("https://api.vapi.ai/assistant", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vapiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: agentName,
        transcriber: {
          provider: "deepgram",
          model: "nova-2",
          language: language || "en",
          smartFormat: true,
        },
        model: {
          provider: "groq",
          model: "llama-3.3-70b-versatile",
          temperature: 0.3,
          maxTokens: 250,
          messages: [
            {
              role: "system",
              content: `You are a ${role}.`,
            },
          ],
        },
        voice: {
          provider: "vapi",
          voiceId: "Elliot",
          chunkPlan: {
            enabled: true,
            minCharacters: 30,
            punctuationBoundaries: [".", "!", "?", ","],
          },
        },
        startSpeakingPlan: {
          waitSeconds: 0.4,
          smartEndpointingEnabled: true,
          transcriptionEndpointingPlan: {
            onPunctuationSeconds: 0.1,
            onNoPunctuationSeconds: 0.8,
            onNumberSeconds: 0.4,
          },
        },
        stopSpeakingPlan: {
          numWords: 2,
          voiceSeconds: 0.2,
          backoffSeconds: 1.0,
        },
        backgroundDenoisingEnabled: true,
        backgroundSound: "office",
        silenceTimeoutSeconds: 30,
        maxDurationSeconds: 600,
        voicemailDetection: {
          provider: "google",
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Failed to create Vapi agent: ${errorBody}`);
    }

    const responseData = await response.json();
    const vAgentId = responseData.id;

    return new Response(JSON.stringify({ v_agent_id: vAgentId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating Vapi agent:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
