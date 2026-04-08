import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Always return 200 with structured success/error bodies so the client can
// surface the real failure reason instead of a generic "Edge Function
// returned non-2xx" wrapper from supabase-js.
function jsonOk(body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonFail(
  message: string,
  extra: Record<string, unknown> = {},
): Response {
  console.error("generate-agent-flow failing:", message, extra);
  return jsonOk({ success: false, error: message, message, ...extra });
}

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

const SYSTEM_PROMPT = `You are a conversation flow designer for voice AI agents. Your job is to analyze a sales/support script and produce a BRANCHING conversation flow as JSON.

Output ONLY valid JSON — no markdown, no explanation, no code fences.

The JSON must have this exact structure:
{
  "nodes": [...],
  "edges": [...]
}

## NODE TYPES

### 1. startNode (exactly one)
The opening line of the conversation.
{
  "id": "startNode-1",
  "type": "startNode",
  "position": { "x": 100, "y": 250 },
  "data": { "firstMessage": "<p>Opening line from the script</p>" },
  "draggable": true
}

### 2. greetingNode (one or more — the main "speak" nodes)
Each major conversational beat where the agent talks and then waits for a caller reaction that could branch the conversation.
{
  "id": "greetingNode-<number>",
  "type": "greetingNode",
  "position": { "x": <number>, "y": <number> },
  "data": {
    "greeting": "<p>What the agent says in this section</p>",
    "outcomes": ["Outcome 0: description", "Outcome 1: description", "Outcome 2: description"],
    "actions": []
  },
  "draggable": true
}
Rules for outcomes:
- Every greetingNode MUST have 2–4 outcomes.
- Each outcome is a plain string describing a caller reaction. Example: "Interested — proceed to qualification", "Not interested — handle objection", "Busy — schedule callback".
- Extract outcomes from the script where it indicates branches (e.g. "*** Client replies ***", "if they say X, do Y", "if they object: …").

### 3. endNode (exactly one)
The closing/transfer/goodbye message.
{
  "id": "endNode-1",
  "type": "endNode",
  "position": { "x": <number>, "y": 250 },
  "data": { "message": "<p>Closing message</p>" },
  "draggable": true
}

## EDGES (critical — this is how branching works)

Every node must be connected. The flow is a DAG, not a straight line. One greetingNode can have MULTIPLE outgoing edges — one per outcome.

Edge format:
{
  "id": "edge-<sourceId>-outcome<N>-<targetId>",
  "source": "<sourceNodeId>",
  "target": "<targetNodeId>",
  "type": "default",
  "sourceHandle": "outcome-<index>"
}

CRITICAL RULES:
- For edges leaving a greetingNode, \`sourceHandle\` MUST be \`outcome-0\`, \`outcome-1\`, \`outcome-2\`, … matching the index of the outcome in that node's \`data.outcomes\` array. If outcome at index 1 is "Not interested", the edge representing that branch uses \`sourceHandle: "outcome-1"\`.
- **Every outcome in every greetingNode MUST have exactly one outgoing edge.** If a node has 3 outcomes, it MUST have 3 outgoing edges: one with sourceHandle outcome-0, one with outcome-1, one with outcome-2.
- Edges from startNode use \`sourceHandle: "default"\`.
- Reasonable branch targets: next greetingNode for success paths, a recovery greetingNode for objections, the endNode for hangup/done paths. Every branch must eventually reach endNode (directly or through other nodes).
- It is fine for multiple outcomes to converge on the same target node (e.g. both "Interested" and "Has questions" feed into the "pitch" node).
- It is fine for multiple outcomes to target the endNode (e.g. both "Hangup" and "Done — goodbye" go to endNode).

## LAYOUT

- Position nodes in a branching tree:
  - startNode at x=100, y=250
  - Main path greetingNodes at x = 400, 800, 1200, … y=250
  - Branch/recovery greetingNodes offset vertically: y=450 for "objection" branches, y=50 for "happy path" branches
  - endNode at the far right of the main path
- It's OK if layout isn't perfect — users can rearrange. Getting the EDGES right matters more than layout.

## CONTENT

- firstMessage / greeting / message content must be wrapped in <p> tags as valid HTML.
- Use <br> for line breaks within a node.
- Keep each node concise — summarize talking points, don't copy the full script verbatim.
- Node IDs must be unique.

## FORBIDDEN

- Do NOT create a straight sequential flow with only "default" sourceHandles — that ignores the branching power of the editor. If the script has any conditional logic, you MUST express it with multiple outcomes and multiple edges.
- Do NOT leave any outcome disconnected. Every outcome index must have a matching outgoing edge.
- Do NOT use \`sourceHandle: "default"\` on edges leaving a greetingNode — use \`outcome-<N>\` instead.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Global abort timer for the ENTIRE invocation. Must be at the top of
  // serve() — if we only start it around the fetch, the combined
  // auth + parse + fetch time can exceed Supabase's 150s wall-clock hard
  // limit, the runtime kills the worker, and the gateway returns a real
  // non-2xx (504/546) — the user sees a generic "Edge Function returned
  // non-2xx" error instead of our structured jsonFail body.
  const globalAbort = new AbortController();
  const globalTimer = setTimeout(() => globalAbort.abort(), 110_000);
  const invocationStart = Date.now();

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonFail("No authorization header on request");
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
      return jsonFail("Unauthorized — your session may have expired", {
        authError: authError?.message,
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
      return jsonFail("scriptText is required");
    }
    if (!agentName || !agentName.trim()) {
      return jsonFail("agentName is required");
    }
    if (!role || !role.trim()) {
      return jsonFail("role is required");
    }

    // Priority:
    //   1. openRouterKey from request body (BYO key from UI)
    //   2. OPENROUTER_API_KEY env var (server-side default)
    //   3. GROQ_API_KEY (legacy fallback)
    //   4. OPENAI_API_KEY (legacy fallback)
    //
    // Default model is Claude Haiku 4.5 — benchmarked at 15.65s for a
    // complex branching pizza script, 3.3x faster than Sonnet 4.6 (51.7s)
    // with comparable structural quality (10 nodes, 29 outcome-N edges).
    // Sonnet 4.6 was hitting the Supabase 150s wall-clock budget on
    // complex scripts and getting killed by the runtime.
    const DEFAULT_OPENROUTER_MODEL = "anthropic/claude-haiku-4.5";
    let llmUrl: string;
    let llmKey: string;
    let llmModel: string;

    const serverOpenRouterKey = Deno.env.get("OPENROUTER_API_KEY");

    if (openRouterKey) {
      llmUrl = "https://openrouter.ai/api/v1/chat/completions";
      llmModel = requestedModel || DEFAULT_OPENROUTER_MODEL;
      llmKey = openRouterKey;
    } else if (serverOpenRouterKey) {
      llmUrl = "https://openrouter.ai/api/v1/chat/completions";
      llmModel = requestedModel || DEFAULT_OPENROUTER_MODEL;
      llmKey = serverOpenRouterKey;
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
              "No AI key configured. Set OPENROUTER_API_KEY as a Supabase secret, or add your OpenRouter API key in Settings -> Integrations.",
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

    console.log(
      `Using LLM: ${llmModel} at ${llmUrl} (elapsed ${Date.now() - invocationStart}ms)`,
    );

    let llmResponse: Response;
    const llmStart = Date.now();
    try {
      llmResponse = await fetch(llmUrl, {
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
          // 16k gives comfortable headroom for even complex branching
          // scripts. Benchmarked: Haiku 4.5 uses ~3893 tokens for a
          // complex pizza flow, Sonnet 4.6 uses ~4605. 16k is 3-4x more.
          max_tokens: 16000,
          response_format: { type: "json_object" },
        }),
        // Use the GLOBAL abort signal set at the top of serve() — this
        // ensures we bail out before Supabase's 150s hard limit kills us.
        signal: globalAbort.signal,
      });
    } catch (fetchErr) {
      const msg =
        fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
      const isAbort = msg.includes("aborted") || msg.includes("abort");
      return jsonFail(
        isAbort
          ? `Script analysis timed out (approaching Supabase's 150s hard limit). Try a shorter script — the current default model (Claude Haiku 4.5) should complete in ~15-20s for most inputs.`
          : `LLM request failed: ${msg}`,
        {
          model: llmModel,
          durationMs: Date.now() - llmStart,
          totalElapsedMs: Date.now() - invocationStart,
        },
      );
    }

    if (!llmResponse.ok) {
      const errorBody = await llmResponse.text();
      console.error("LLM API error:", llmResponse.status, errorBody);
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(errorBody);
      } catch {
        // plain text error body
      }
      const upstreamMsg =
        (parsed as { error?: { message?: string } }).error?.message ||
        (parsed as { message?: string }).message ||
        errorBody.slice(0, 500);
      return jsonFail(`LLM rejected the request: ${upstreamMsg}`, {
        model: llmModel,
        upstream_status: llmResponse.status,
        durationMs: Date.now() - llmStart,
      });
    }

    const llmData = await llmResponse.json();
    const message = llmData?.choices?.[0]?.message;
    const finishReason = llmData?.choices?.[0]?.finish_reason;
    // Reasoning models (e.g. Kimi K2.5, o1) put the answer in
    // `message.reasoning` with `message.content: null`. Extract from
    // either field so both work.
    let rawContent: string | null =
      (message?.content as string | null) ??
      (message?.reasoning as string | null) ??
      null;

    if (!rawContent) {
      console.error("No content in LLM response:", JSON.stringify(llmData));
      return jsonFail(
        "LLM returned empty response. This usually means the model hit max_tokens before producing any output — try a shorter script or a more concise model.",
        {
          model: llmModel,
          finish_reason: finishReason,
          usage: llmData?.usage,
        },
      );
    }

    if (finishReason === "length") {
      console.warn(
        "LLM response was truncated by max_tokens — JSON may be malformed",
      );
    }

    // If we got content from the reasoning field, extract the JSON block
    // (reasoning text often wraps the JSON in prose like "The JSON is: {...}")
    if (!message?.content && message?.reasoning) {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        rawContent = jsonMatch[0];
      }
    }

    // Strip markdown code fences if present. Claude models (Haiku 4.5,
    // Sonnet 4.6) wrap their JSON in ```json ... ``` fences even when
    // response_format: json_object is set. Without stripping, JSON.parse
    // fails on the leading backticks. Benchmarked against real responses.
    rawContent = rawContent.trim();
    const fenceMatch = rawContent.match(
      /^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/,
    );
    if (fenceMatch) {
      rawContent = fenceMatch[1].trim();
    }

    // Parse the LLM JSON output
    let flow: FlowData;
    try {
      flow = JSON.parse(rawContent) as FlowData;
    } catch (parseError) {
      console.error("Failed to parse LLM JSON:", rawContent);
      const truncated = finishReason === "length";
      return jsonFail(
        truncated
          ? "LLM response was truncated (hit max_tokens) and the partial JSON could not be parsed. Try a shorter script."
          : "LLM returned invalid JSON. This usually means the model added prose before/after the JSON block.",
        {
          model: llmModel,
          finish_reason: finishReason,
          rawResponse: rawContent.slice(0, 2000),
          parseError:
            parseError instanceof Error
              ? parseError.message
              : String(parseError),
        },
      );
    }

    // Validate the flow structure
    if (!Array.isArray(flow.nodes) || !Array.isArray(flow.edges)) {
      console.error("Invalid flow structure:", JSON.stringify(flow));
      return jsonFail(
        "LLM returned JSON missing required `nodes` or `edges` arrays.",
        {
          model: llmModel,
          rawFlow: JSON.stringify(flow).slice(0, 1000),
        },
      );
    }

    const hasStart = flow.nodes.some((n) => n.type === "startNode");
    const hasEnd = flow.nodes.some((n) => n.type === "endNode");

    if (!hasStart || !hasEnd) {
      console.error("Flow missing start or end node:", JSON.stringify(flow));
      return jsonFail(
        `LLM returned a flow missing ${!hasStart ? "startNode" : ""}${!hasStart && !hasEnd ? " and " : ""}${!hasEnd ? "endNode" : ""}. The model may not have followed the system prompt format.`,
        {
          model: llmModel,
          nodeTypes: flow.nodes.map((n) => n.type),
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
    const nodeIds = new Set(flow.nodes.map((n) => n.id));
    const endNode = flow.nodes.find((n) => n.type === "endNode");

    // 1. Drop edges with invalid source/target IDs first.
    flow.edges = flow.edges.filter((edge) => {
      const valid = nodeIds.has(edge.source) && nodeIds.has(edge.target);
      if (!valid) {
        console.warn(
          `Removing invalid edge ${edge.id}: source=${edge.source}, target=${edge.target}`,
        );
      }
      return valid;
    });

    // 2. Normalize each edge. CRITICAL:
    //    - For edges from a node WITH outcomes: preserve the LLM's
    //      sourceHandle if it's a valid "outcome-N" (N < outcomes.length).
    //      If the LLM only said "default", we can't guess which outcome
    //      it meant — mark it so we can repair below.
    //    - For edges from nodes without outcomes (startNode): use "default".
    const normalizedEdges: Array<{
      id: string;
      source: string;
      target: string;
      type: string;
      sourceHandle: string;
      animated: boolean;
      style: Record<string, unknown>;
    }> = [];

    for (const edge of flow.edges) {
      const sourceNode = nodeMap.get(edge.source);
      const outcomes =
        (sourceNode?.data?.outcomes as string[] | undefined) || [];
      const hasOutcomes = outcomes.length > 0;

      let sourceHandle = (edge.sourceHandle as string) || "default";

      if (hasOutcomes) {
        const match = sourceHandle.match(/^outcome-(\d+)$/);
        if (!match || parseInt(match[1], 10) >= outcomes.length) {
          // LLM gave us "default" or an out-of-range handle. We'll patch
          // this in the next pass by assigning the first unused outcome.
          sourceHandle = "__REPAIR__";
        }
      } else {
        sourceHandle = "default";
      }

      normalizedEdges.push({
        id: edge.id || `edge-${edge.source}-${edge.target}-${sourceHandle}`,
        source: edge.source,
        target: edge.target,
        type: "buttonEdge",
        sourceHandle,
        animated: true,
        style: { strokeWidth: 3, stroke: "#94a3b8" },
      });
    }

    // 3. Repair edges marked __REPAIR__ by assigning them to the next
    //    available outcome slot on their source node.
    const usedHandlesPerNode = new Map<string, Set<string>>();
    for (const e of normalizedEdges) {
      if (e.sourceHandle !== "__REPAIR__") {
        const set = usedHandlesPerNode.get(e.source) ?? new Set();
        set.add(e.sourceHandle);
        usedHandlesPerNode.set(e.source, set);
      }
    }
    for (const e of normalizedEdges) {
      if (e.sourceHandle === "__REPAIR__") {
        const sourceNode = nodeMap.get(e.source);
        const outcomes =
          (sourceNode?.data?.outcomes as string[] | undefined) || [];
        const used = usedHandlesPerNode.get(e.source) ?? new Set();
        const freeIndex = outcomes.findIndex(
          (_, i) => !used.has(`outcome-${i}`),
        );
        const handle = freeIndex >= 0 ? `outcome-${freeIndex}` : "outcome-0";
        e.sourceHandle = handle;
        used.add(handle);
        usedHandlesPerNode.set(e.source, used);
      }
    }

    // 4. For every greetingNode outcome without an outgoing edge, auto-wire
    //    it to the endNode. No more dangling outcomes on the canvas.
    if (endNode) {
      for (const node of flow.nodes) {
        if (node.type !== "greetingNode") continue;
        const outcomes = (node.data?.outcomes as string[] | undefined) || [];
        const used = usedHandlesPerNode.get(node.id) ?? new Set();
        for (let i = 0; i < outcomes.length; i++) {
          const handle = `outcome-${i}`;
          if (!used.has(handle)) {
            normalizedEdges.push({
              id: `edge-${node.id}-${handle}-${endNode.id}-auto`,
              source: node.id,
              target: endNode.id,
              type: "buttonEdge",
              sourceHandle: handle,
              animated: true,
              style: { strokeWidth: 3, stroke: "#94a3b8" },
            });
            used.add(handle);
          }
        }
        usedHandlesPerNode.set(node.id, used);
      }
    }

    // 5. If after all that we still have 0 edges (LLM produced nothing),
    //    fall back to straight-line sequential connections.
    if (normalizedEdges.length === 0 && flow.nodes.length > 1) {
      console.log("No valid edges, creating sequential connections");
      for (let i = 0; i < flow.nodes.length - 1; i++) {
        const srcNode = flow.nodes[i];
        const hasOc =
          (srcNode?.data?.outcomes as string[] | undefined)?.length ?? 0 > 0;
        normalizedEdges.push({
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

    flow.edges = normalizedEdges;

    console.log(
      `Flow validated: ${flow.nodes.length} nodes, ${flow.edges.length} edges in ${Date.now() - invocationStart}ms`,
    );

    clearTimeout(globalTimer);
    return jsonOk({
      success: true,
      flow,
      _meta: { model: llmModel, totalMs: Date.now() - invocationStart },
    });
  } catch (error) {
    clearTimeout(globalTimer);
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error(
      "Unhandled exception in generate-agent-flow:",
      message,
      stack,
    );
    return jsonFail(`Unhandled server error: ${message}`, { stack });
  }
});
