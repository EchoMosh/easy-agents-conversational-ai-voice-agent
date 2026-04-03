import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

interface CreateKnowledgeBaseRequest {
  name: string;
  trieveDatasetId: string;
  agentId: string;
  searchType?: "semantic" | "fulltext" | "hybrid";
  topK?: number;
  scoreThreshold?: number;
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

    const {
      name,
      trieveDatasetId,
      agentId,
      searchType = "semantic",
      topK = 3,
      scoreThreshold = 0.7,
    } = (await req.json()) as CreateKnowledgeBaseRequest;

    // Create knowledge base payload using Trieve import
    const knowledgeBasePayload = {
      name,
      provider: "trieve",
      searchPlan: {
        searchType,
        topK,
        removeStopWords: true,
        scoreThreshold,
      },
      createPlan: {
        type: "import",
        providerId: trieveDatasetId,
      },
    };

    console.log(
      "Creating knowledge base with payload:",
      JSON.stringify(knowledgeBasePayload, null, 2),
    );

    // Create knowledge base
    const kbResponse = await fetch("https://api.vapi.ai/knowledge-base", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${vapiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(knowledgeBasePayload),
    });

    if (!kbResponse.ok) {
      const errorText = await kbResponse.text();
      console.error("Vapi knowledge base creation error:", errorText);
      return new Response(
        JSON.stringify({
          error: "Failed to create knowledge base",
          details: errorText,
        }),
        {
          status: kbResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const knowledgeBase = await kbResponse.json();
    console.log("Knowledge base created:", knowledgeBase);

    // Store knowledge base info in Supabase
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { error: dbError } = await supabase
      .from("agents")
      .update({
        knowledge_ids: [knowledgeBase.id],
        vapi_knowledge_base_id: knowledgeBase.id,
        trieve_dataset_id: trieveDatasetId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", agentId);

    if (dbError) {
      console.error("Failed to update agent with knowledge base ID:", dbError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: knowledgeBase,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error creating knowledge base:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
