import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface InitiateCallRequest {
  v_agent_id: string;
  vapi_phone_number_id: string;
  customer_number: string;
  customer_name?: string;
  language?: string;
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      v_agent_id,
      vapi_phone_number_id,
      customer_number,
      customer_name,
      language,
    } = (await req.json()) as InitiateCallRequest;

    if (!v_agent_id) {
      return new Response(JSON.stringify({ error: "v_agent_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!vapi_phone_number_id) {
      return new Response(
        JSON.stringify({ error: "vapi_phone_number_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    if (!customer_number) {
      return new Response(
        JSON.stringify({ error: "customer_number is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const vapiApiKey = Deno.env.get("VAPI_API_KEY");
    if (!vapiApiKey) {
      return new Response(
        JSON.stringify({ error: "VAPI_API_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const callPayload: Record<string, unknown> = {
      assistantId: v_agent_id,
      assistantOverrides: {
        transcriber: {
          provider: "talkscriber",
          model: "whisper",
          language: language || "en",
        },
      },
      phoneNumberId: vapi_phone_number_id,
      customer: {
        number: customer_number,
        ...(customer_name ? { name: customer_name } : {}),
      },
    };

    console.log("Initiating VAPI call:", JSON.stringify(callPayload));

    const response = await fetch("https://api.vapi.ai/call", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vapiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(callPayload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("VAPI call error:", responseData);
      const vapiMessage =
        responseData?.message ||
        responseData?.error ||
        "Failed to initiate call";
      return new Response(
        JSON.stringify({
          error: vapiMessage,
          details: responseData,
          success: false,
        }),
        {
          status: 200, // Return 200 so the client can read the error message
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("VAPI call initiated:", responseData.id, responseData.status);

    return new Response(
      JSON.stringify({
        success: true,
        call_id: responseData.id,
        status: responseData.status,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error initiating call:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
