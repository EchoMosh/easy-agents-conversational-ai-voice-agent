import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE, PATCH",
};

interface CreateTrieveDatasetRequest {
  name: string;
  description?: string;
  agent_id?: string; // Optional for knowledge documents
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

    // Create service role client for database operations
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { name, description, agent_id } =
      (await req.json()) as CreateTrieveDatasetRequest;

    // Get Trieve credentials from environment
    const trieveApiKey = Deno.env.get("TRIEVE_API_KEY");
    const trieveOrgId = Deno.env.get("TRIEVE_ORG_ID");

    if (!trieveApiKey || !trieveOrgId) {
      console.error("Trieve credentials not configured");
      return new Response(
        JSON.stringify({
          error: "Trieve credentials not configured",
          message:
            "TRIEVE_API_KEY or TRIEVE_ORG_ID environment variables are missing",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("Creating Trieve dataset:", name);

    // Create dataset in Trieve
    const trieveResponse = await fetch("https://api.trieve.ai/api/dataset", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${trieveApiKey}`,
        "TR-Organization": trieveOrgId,
        "Content-Type": "application/json",
      },
      // Current Trieve API (2026) uses UPPERCASE snake_case keys in
      // server_configuration and rejects unknown fields with 400. It also no
      // longer accepts organization_id in the body (header-only: TR-Organization).
      body: JSON.stringify({
        dataset_name: name,
        tracking_id: `kb-${crypto.randomUUID()}`,
        server_configuration: {
          SEMANTIC_ENABLED: true,
          FULLTEXT_ENABLED: true,
          BM25_ENABLED: true,
          EMBEDDING_MODEL_NAME: "text-embedding-3-small",
          EMBEDDING_SIZE: 1536,
          DISTANCE_METRIC: "cosine",
        },
      }),
    });

    if (!trieveResponse.ok) {
      const errorText = await trieveResponse.text();
      console.error("Trieve API error:", errorText);

      return new Response(
        JSON.stringify({
          error: "Failed to create Trieve dataset",
          message: errorText,
          status: trieveResponse.status,
        }),
        {
          status: trieveResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const trieveData = await trieveResponse.json();
    console.log("Trieve dataset created:", trieveData);

    // Store the Trieve dataset ID in the agent record (if agent_id is provided)
    if (agent_id) {
      const { error: updateError } = await supabase
        .from("agents")
        .update({
          trieve_dataset_id: trieveData.id,
        })
        .eq("id", agent_id);

      if (updateError) {
        console.error(
          "Error updating agent with Trieve dataset ID:",
          updateError,
        );
        // Don't fail the request, just log the error
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        dataset_id: trieveData.id,
        dataset: trieveData,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error creating Trieve dataset:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
