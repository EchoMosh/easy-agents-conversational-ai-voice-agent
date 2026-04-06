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
  "data": { "greeting": "<p>What the agent says in this section</p>", "outcomes": ["Outcome A: description", "Outcome B: description", "Outcome C: description"], "actions": [] },
  "draggable": true
}
IMPORTANT: The "outcomes" field is an array of STRINGS representing the possible customer responses/paths at each conversation point. For example: ["Interested - proceed to next step", "Not interested - handle objection", "Has questions - provide more info", "Busy - schedule callback"]. Every greetingNode MUST have at least 2 outcomes. Extract outcomes from the script where indicated (e.g. "*** Client replies ***" sections, or branching paths like "if they say X, reply Y").

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
      scriptText,
      agentName,
      role,
      openRouterKey,
      model: requestedModel,
    } = (await req.json()) as GenerateAgentFlowRequest & {
      openRouterKey?: string;
      model?: string;
    };

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

    // Priority: OpenRouter key from user > GROQ env > OpenAI env
    let llmUrl: string;
    let llmKey: string;
    let llmModel: string;

    if (openRouterKey) {
      llmUrl = "https://openrouter.ai/api/v1/chat/completions";
      llmModel = requestedModel || "anthropic/claude-sonnet-4";
      llmKey = openRouterKey;
    } else {
      const groqApiKey = Deno.env.get("GROQ_API_KEY");
      const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

      if (groqApiKey) {
        llmUrl = "https://api.groq.com/openai/v1/chat/completions";
        llmKey = groqApiKey;
        llmModel = "llama-3.3-70b-versatile";
      } else if (openaiApiKey) {
        llmUrl = "https://api.openai.com/v1/chat/completions";
        llmKey = openaiApiKey;
        llmModel = "gpt-4o-mini";
      } else {
        return new Response(
          JSON.stringify({
            error:
              "No AI key configured. Add your OpenRouter API key in Settings -> Integrations.",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
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

    // ---- SERVER-SIDE NORMALIZATION ----
    // Fix common LLM type name variations
    const typeMap: Record<string, string> = {
      start: "startNode",
      startnode: "startNode",
      startNode: "startNode",
      greeting: "greetingNode",
      greetingnode: "greetingNode",
      greetingNode: "greetingNode",
      speak: "greetingNode",
      speakNode: "greetingNode",
      end: "endNode",
      endnode: "endNode",
      endNode: "endNode",
    };

    flow.nodes = flow.nodes.map((node, i) => {
      const normalizedType = typeMap[node.type] || node.type;
      return {
        ...node,
        type: normalizedType,
        id: node.id || `${normalizedType}-${i}`,
        position: node.position || { x: 100 + i * 400, y: 250 },
        draggable: true,
        data: {
          ...node.data,
          ...(normalizedType === "greetingNode" && {
            outcomes: Array.isArray(node.data?.outcomes)
              ? node.data.outcomes
              : [],
            actions: Array.isArray(node.data?.actions) ? node.data.actions : [],
          }),
        },
      };
    });

    // Build a map of node IDs to their data for edge normalization
    const nodeMap = new Map(flow.nodes.map((n) => [n.id, n]));

    // Normalize ALL edges to buttonEdge type with correct sourceHandle
    // If source node has outcomes, use "outcome-0" (first outcome handle)
    // If source node has no outcomes, use "default"
    flow.edges = flow.edges.map((edge) => {
      const sourceNode = nodeMap.get(edge.source);
      const hasOutcomes =
        sourceNode?.data?.outcomes && sourceNode.data.outcomes.length > 0;
      return {
        ...edge,
        type: "buttonEdge",
        sourceHandle: hasOutcomes ? "outcome-0" : "default",
        animated: true,
        style: { strokeWidth: 3, stroke: "#94a3b8" },
      };
    });

    // Verify all edges reference valid node IDs
    const nodeIds = new Set(flow.nodes.map((n) => n.id));
    flow.edges = flow.edges.filter((edge) => {
      const valid = nodeIds.has(edge.source) && nodeIds.has(edge.target);
      if (!valid) {
        console.warn(
          `Removing invalid edge ${edge.id}: source=${edge.source}, target=${edge.target}`,
        );
      }
      return valid;
    });

    // If no valid edges remain, create sequential connections
    if (flow.edges.length === 0 && flow.nodes.length > 1) {
      console.log("No valid edges, creating sequential connections");
      flow.edges = [];
      for (let i = 0; i < flow.nodes.length - 1; i++) {
        const srcNode = flow.nodes[i];
        const hasOc =
          srcNode?.data?.outcomes && srcNode.data.outcomes.length > 0;
        flow.edges.push({
          id: `edge-${srcNode.id}-${flow.nodes[i + 1].id}`,
          source: srcNode.id,
          target: flow.nodes[i + 1].id,
          type: "buttonEdge",
          sourceHandle: hasOc ? "outcome-0" : "default",
          animated: true,
          style: { strokeWidth: 3, stroke: "#94a3b8" },
        });
      }
    }

    console.log(
      `Flow validated: ${flow.nodes.length} nodes, ${flow.edges.length} edges`,
    );

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
