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

    // Verify the user is authenticated using the service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      console.error("Auth verification failed:", authError?.message);
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

    const vapiPayload = {
      name: agentName,
      transcriber: {
        provider: "deepgram",
        model: "nova-2",
        language: language || "en",
      },
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
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
      },
      backgroundDenoisingEnabled: true,
      backgroundSound: "office",
      silenceTimeoutSeconds: 30,
      maxDurationSeconds: 600,
    };

    console.log("Creating VAPI assistant:", JSON.stringify(vapiPayload));

    const response = await fetch("https://api.vapi.ai/assistant", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vapiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(vapiPayload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("VAPI API error:", response.status, errorBody);
      throw new Error(`VAPI API error (${response.status}): ${errorBody}`);
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
