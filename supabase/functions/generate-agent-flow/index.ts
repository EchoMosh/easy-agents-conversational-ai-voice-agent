import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface GenerateAgentFlowRequest {
  scriptText: string;
  agentName: string;
  role: string;
}

interface FlowNode {
  id: string;
  type: "startNode" | "greetingNode" | "endNode";
  position: { x: number; y: number };
  data: Record<string, unknown>;
  draggable: boolean;
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  type: "default";
  sourceHandle?: string;
}

interface FlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

const SYSTEM_PROMPT = `You are a conversation flow designer for voice AI agents. Your job is to analyze a sales script and produce a structured conversation flow as JSON.

Output ONLY valid JSON, no markdown, no explanation, no code fences.

The JSON must have this exact structure:
{
  "nodes": [...],
  "edges": [...]
}

Node types and their data fields:

1. startNode (exactly one) - The opening line of the conversation:
{
  "id": "startNode-1",
  "type": "startNode",
  "position": { "x": <number>, "y": 250 },
  "data": { "firstMessage": "<p>Opening line from the script as HTML</p>" },
  "draggable": true
}

2. greetingNode (one or more) - Each major section of the script (qualification, pitch, objection handling, closing, etc.):
{
  "id": "greetingNode-<number>",
  "type": "greetingNode",
  "position": { "x": <number>, "y": 250 },
  "data": { "greeting": "<p>Script section content as HTML</p>", "outcomes": [], "actions": [] },
  "draggable": true
}

3. endNode (exactly one) - The closing/transfer/goodbye message:
{
  "id": "endNode-1",
  "type": "endNode",
  "position": { "x": <number>, "y": 250 },
  "data": { "message": "<p>Closing message as HTML</p>" },
  "draggable": true
}

Edge format (connect nodes sequentially):
{
  "id": "edge-<sourceId>-<targetId>",
  "source": "<sourceNodeId>",
  "target": "<targetNodeId>",
  "type": "default",
  "sourceHandle": "default"
}

Rules:
- Position nodes left to right. Start at x=100, then increment by 400 for each subsequent node. All nodes at y=250.
- The content in firstMessage, greeting, and message fields must be wrapped in <p> tags as valid HTML.
- Use <br> for line breaks within a single node's content.
- Break the script into logical conversation sections. Typically: greeting/intro, qualification, pitch/value proposition, objection handling, closing/transfer.
- Keep each node's content concise - summarize the key talking points for that section rather than copying the entire script verbatim.
- Every node must be connected. The flow goes: startNode -> greetingNode(s) -> endNode.
- Node IDs must be unique.`;

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

    const { scriptText, agentName, role } =
      (await req.json()) as GenerateAgentFlowRequest;

    if (!scriptText || !scriptText.trim()) {
      return new Response(JSON.stringify({ error: "scriptText is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
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

    // Try GROQ first, fall back to OpenAI-compatible via workspace integration
    const groqApiKey = Deno.env.get("GROQ_API_KEY");
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    let llmUrl: string;
    let llmKey: string;
    let llmModel: string;

    if (groqApiKey) {
      llmUrl = "https://api.groq.com/openai/v1/chat/completions";
      llmKey = groqApiKey;
      llmModel = "llama-3.3-70b-versatile";
    } else if (openaiApiKey) {
      llmUrl = "https://api.openai.com/v1/chat/completions";
      llmKey = openaiApiKey;
      llmModel = "gpt-4o-mini";
    } else {
      // No LLM key available - return a helpful error
      return new Response(
        JSON.stringify({
          error:
            "No LLM API key configured. Add GROQ_API_KEY or OPENAI_API_KEY in Supabase secrets.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const userPrompt = `Agent name: "${agentName}"
Agent role: "${role}"

Analyze the following sales script and generate a conversation flow JSON with nodes and edges.

Sales script:
---
${scriptText}
---`;

    console.log(`Using LLM: ${llmModel} at ${llmUrl}`);

    const llmResponse = await fetch(llmUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${llmKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: llmModel,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 4096,
        response_format: { type: "json_object" },
      }),
    });

    if (!llmResponse.ok) {
      const errorBody = await llmResponse.text();
      console.error("LLM API error:", llmResponse.status, errorBody);
      return new Response(
        JSON.stringify({
          error: "Failed to generate flow from LLM",
          details: errorBody,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const llmData = await llmResponse.json();
    const rawContent = llmData?.choices?.[0]?.message?.content;

    if (!rawContent) {
      console.error("No content in Groq response:", JSON.stringify(groqData));
      return new Response(
        JSON.stringify({ error: "LLM returned empty response" }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Parse the LLM JSON output
    let flow: FlowData;
    try {
      flow = JSON.parse(rawContent) as FlowData;
    } catch (parseError) {
      console.error("Failed to parse LLM JSON:", rawContent);
      return new Response(
        JSON.stringify({
          error: "LLM returned invalid JSON",
          rawResponse: rawContent,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validate the flow structure
    if (!Array.isArray(flow.nodes) || !Array.isArray(flow.edges)) {
      console.error("Invalid flow structure:", JSON.stringify(flow));
      return new Response(
        JSON.stringify({
          error:
            "LLM returned invalid flow structure: missing nodes or edges arrays",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const hasStart = flow.nodes.some((n) => n.type === "startNode");
    const hasEnd = flow.nodes.some((n) => n.type === "endNode");

    if (!hasStart || !hasEnd) {
      console.error("Flow missing start or end node:", JSON.stringify(flow));
      return new Response(
        JSON.stringify({
          error: "LLM returned flow missing required startNode or endNode",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ success: true, flow }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating agent flow:", error);
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
