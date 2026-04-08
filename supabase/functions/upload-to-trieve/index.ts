import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE, PATCH",
};

interface UploadToTrieveRequest {
  dataset_id: string;
  chunk_data: {
    chunk_html: string;
    metadata: {
      title: string;
      description?: string;
      file_type: string;
      file_size: number;
    };
  };
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

    const { dataset_id, chunk_data } =
      (await req.json()) as UploadToTrieveRequest;

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

    console.log(`Uploading content to Trieve dataset: ${dataset_id}`);

    // Create a chunk for the content
    const chunkResponse = await fetch("https://api.trieve.ai/api/chunk", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${trieveApiKey}`,
        "TR-Organization": trieveOrgId,
        "TR-Dataset": dataset_id,
        "Content-Type": "application/json",
      },
      // Current Trieve chunk API changed semantic_boost / fulltext_boost from
      // floats to objects ({phrase, distance_factor}). Passing a float returns
      // 400 with a type mismatch. They aren't needed for basic ingestion, so
      // drop them entirely.
      body: JSON.stringify({
        chunk_html: chunk_data.chunk_html,
        tracking_id: `${dataset_id}-${chunk_data.metadata.title}`,
        metadata: {
          ...chunk_data.metadata,
          uploaded_at: new Date().toISOString(),
        },
        tag_set: [chunk_data.metadata.file_type, "knowledge-base"],
      }),
    });

    if (!chunkResponse.ok) {
      const errorText = await chunkResponse.text();
      console.error(`Trieve API error: ${errorText}`);

      return new Response(
        JSON.stringify({
          error: "Failed to upload to Trieve",
          message: errorText,
          status: chunkResponse.status,
        }),
        {
          status: chunkResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const chunkData = await chunkResponse.json();
    console.log(`Successfully uploaded chunk:`, chunkData);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Content uploaded successfully to Trieve",
        dataset_id,
        chunk_id: chunkData.id,
        data: chunkData,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error uploading to Trieve:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
