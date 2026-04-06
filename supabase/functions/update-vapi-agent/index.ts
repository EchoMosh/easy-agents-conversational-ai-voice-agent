import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE, PATCH",
};

// Active VAPI built-in voices (retired voices like Kylie, Lily, Harry, Paige, Spencer will be rejected)
const ACTIVE_VAPI_VOICES = new Set([
  "Elliot",
  "Clara",
  "Godfrey",
  "Layla",
  "Sid",
  "Gustavo",
  "Rohan",
  "Savannah",
  "Nico",
  "Kai",
  "Emma",
  "Sagar",
  "Neil",
  "Naina",
  "Leah",
  "Tara",
  "Jess",
  "Leo",
  "Dan",
  "Mia",
  "Zac",
  "Zoe",
]);

interface UpdateVapiAgentRequest {
  agent_id: string;
  v_agent_id: string;
  voice_id: string;
  language: string;
  first_message: string;
  mermaid_chart: string;
  max_duration_seconds: number;
  background_sound: string;
  knowledge_base_id?: string;
  // Extended config (from new settings)
  voice_provider?: string;
  voice_model?: string;
  voice_speed?: number;
  voice_stability?: number;
  voice_similarity_boost?: number;
  voice_emotion?: string[];
  voice_style_prompt?: string;
  transcriber_provider?: string;
  transcriber_model?: string;
  llm_provider?: string;
  llm_model?: string;
  llm_temperature?: number;
  llm_max_tokens?: number;
  background_denoising_enabled?: boolean;
  silence_timeout_seconds?: number;
  start_speaking_wait_seconds?: number;
  smart_endpointing_enabled?: boolean;
  on_punctuation_seconds?: number;
  on_no_punctuation_seconds?: number;
  on_number_seconds?: number;
  stop_speaking_num_words?: number;
  stop_speaking_voice_seconds?: number;
  stop_speaking_backoff_seconds?: number;
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

    const body = (await req.json()) as UpdateVapiAgentRequest;
    const {
      agent_id,
      v_agent_id,
      voice_id,
      language,
      first_message,
      mermaid_chart,
      max_duration_seconds,
      background_sound,
      knowledge_base_id,
      voice_provider,
      voice_model,
      voice_speed,
      voice_stability,
      voice_similarity_boost,
      voice_emotion,
      transcriber_provider,
      transcriber_model,
      llm_provider,
      llm_model,
      llm_temperature,
      llm_max_tokens,
      background_denoising_enabled,
      silence_timeout_seconds,
      start_speaking_wait_seconds,
      smart_endpointing_enabled,
      on_punctuation_seconds,
      on_no_punctuation_seconds,
      on_number_seconds,
      stop_speaking_num_words,
      stop_speaking_voice_seconds,
      stop_speaking_backoff_seconds,
    } = body;

    console.log("Request payload:", {
      agent_id,
      v_agent_id,
      voice_id,
      language,
      first_message,
    });

    if (!v_agent_id) {
      console.error("No Vapi agent ID provided in request");
      return new Response(
        JSON.stringify({
          error: "No Vapi agent ID provided",
          message: "v_agent_id is required to update the assistant",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Get the current timestamp for dynamic prompt generation
    const now = new Date().toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
      timeZoneName: "short",
    });

    // Construct the system prompt based on the provided template
    const systemPrompt = `You are conducting a Sales phone call in ${language}
Instructions:
Use this script as a guide to conduct the phone call. You may deviate from the script as long as you achieve the objective of the phone call. Respond only with normal human speech. Do not use any special characters or phrases.
Objective:
Conduct a Sales phone call with the caller.
Rules:
Only respond in ${language}
Keep your responses short and concise. Focus on verbal austerity / laconic speaking.
NEVER mention that you're an AI.
Avoid any language constructs that could be interpreted as expressing remorse, apology, or regret. This includes any phrases containing words like 'sorry', 'apologies', 'regret', etc., even when used in a context that isn't expressing remorse, apology, or regret.
If a user response is unclear or ambiguous, ask them to speak up. You may ask for more details to confirm your understanding before answering.
Speak realistically.Use filler words like Well, So, Anyway, Actually, Basically, I mean, Right, Hmm, Ah, Oh, Um, Like, You know, Okay, Right, Sure, Hmm, Ah, Oh, etc, to add flow and natural pauses to your speech. etc.. when appropriate.
Respond with nothing except for your natural response. Do not include any additional text or special characters. Only periods, commas, question marks, and exclamation points are allowed.
Never respond with hyphens or newline characters.
Use natural humor when appropriate. Speak like a human on a phone call.
Your response will be read directly to the user unedited, so do not provide placeholder values or any other text that is not a natural part of the conversation.
Never respond with place holders like [User Name], [insert date], "STEP 1," etc. Only respond with natural language.
Spell all numbers, times, and currency phonetically. For example, "12:30 PM" should be "twelve thirty PM," or "half past twelve."
No Matter What the Prospect Says ALWAYS stick to the script and its goals. DO NOT LET WHAT THE PERSON SAYS DERAIL YOU, ACKNOWLEDGE WHAT THEY SAID AND THEN TIE IT BACK INTO THE SCRIPT.
If a link is present in the instructions, ensure to return it exactly how it is written. Do not hyperlink the URL, just return the plain text URL.
Information:
The current day and time is ${now}
Personality Instructions:
HUMOR CUSTOMIZATION PROMPT: Maintain a balance between professionalism and occasional light humor.
Script:
The following is a flowchart written in Mermaid. It is a visual representation of the script. You can use it to help you understand the flow of the conversation. Follow the flowchart from top to bottom. You must follow the flowchart below. Do not deviate from the flowchart unless the user asks a question that is not covered by the flowchart. If the user asks a question that is not covered by the flowchart, you may answer the question as long as you achieve the objective of the phone call.


${mermaid_chart}`;

    // Build dynamic voice payload based on provider
    const effectiveVoiceProvider = voice_provider || "vapi";
    const effectiveVoiceId =
      effectiveVoiceProvider === "vapi"
        ? ACTIVE_VAPI_VOICES.has(voice_id)
          ? voice_id
          : "Elliot"
        : voice_id;

    const voicePayload: Record<string, unknown> = {
      provider: effectiveVoiceProvider,
      voiceId: effectiveVoiceId,
      chunkPlan: {
        enabled: true,
        minCharacters: 30,
        punctuationBoundaries: [".", "!", "?", ","],
      },
    };
    if (voice_model) voicePayload.model = voice_model;
    if (effectiveVoiceProvider === "elevenlabs") {
      if (voice_stability !== undefined)
        voicePayload.stability = voice_stability;
      if (voice_similarity_boost !== undefined)
        voicePayload.similarityBoost = voice_similarity_boost;
    }
    if (
      voice_speed !== undefined &&
      ["cartesia", "playht", "openai"].includes(effectiveVoiceProvider)
    ) {
      voicePayload.speed = voice_speed;
    }
    if (
      voice_emotion?.length &&
      ["cartesia", "playht"].includes(effectiveVoiceProvider)
    ) {
      voicePayload.emotion = voice_emotion;
    }

    // Prepare the Vapi update payload with optimized call quality settings
    const vapiPayload = {
      transcriber: {
        provider: transcriber_provider || "talkscriber",
        model: transcriber_model || "whisper",
        language: language || "en",
      },
      voice: voicePayload,
      firstMessage:
        first_message ||
        `Hello! This is an AI assistant. How can I help you today?`,
      voicemailDetection: {
        provider: "google",
      },
      startSpeakingPlan: {
        waitSeconds: start_speaking_wait_seconds ?? 0.4,
        smartEndpointingEnabled: smart_endpointing_enabled ?? true,
        transcriptionEndpointingPlan: {
          onPunctuationSeconds: on_punctuation_seconds ?? 0.1,
          onNoPunctuationSeconds: on_no_punctuation_seconds ?? 0.8,
          onNumberSeconds: on_number_seconds ?? 0.4,
        },
      },
      stopSpeakingPlan: {
        numWords: stop_speaking_num_words ?? 2,
        voiceSeconds: stop_speaking_voice_seconds ?? 0.2,
        backoffSeconds: stop_speaking_backoff_seconds ?? 1.0,
      },
      backgroundDenoisingEnabled: background_denoising_enabled ?? true,
      backgroundSound:
        background_sound === "off" ? "off" : background_sound || "office",
      silenceTimeoutSeconds: silence_timeout_seconds ?? 30,
      maxDurationSeconds: max_duration_seconds || 600,
      model: {
        provider: llm_provider || "groq",
        model: llm_model || "llama-3.3-70b-versatile",
        temperature: llm_temperature ?? 0.3,
        maxTokens: llm_max_tokens ?? 250,
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
        ],
      },
      ...(knowledge_base_id && { knowledgeBaseId: knowledge_base_id }),
    };

    // Get Vapi API key from environment
    const vapiApiKey = Deno.env.get("VAPI_API_KEY");
    if (!vapiApiKey) {
      console.error("VAPI_API_KEY environment variable not found");
      return new Response(
        JSON.stringify({
          error: "Vapi API key not configured",
          message: "VAPI_API_KEY environment variable is missing",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log(
      `Making PATCH request to: https://api.vapi.ai/assistant/${v_agent_id}`,
    );
    console.log("Vapi payload:", JSON.stringify(vapiPayload, null, 2));

    const vapiResponse = await fetch(
      `https://api.vapi.ai/assistant/${v_agent_id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${vapiApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(vapiPayload),
      },
    );

    console.log("Vapi response status:", vapiResponse.status);

    // If assistant not found (404), return error
    if (vapiResponse.status === 404) {
      console.error("Assistant not found in Vapi:", v_agent_id);

      return new Response(
        JSON.stringify({
          error: "Vapi assistant not found",
          message: `The Vapi assistant with ID ${v_agent_id} does not exist. Please ensure the agent has been properly created in Vapi.`,
          v_agent_id: v_agent_id,
          status: 404,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // If other error occurred during update
    if (!vapiResponse.ok) {
      const errorText = await vapiResponse.text();
      console.error("Vapi API error response:", errorText);
      console.error("Vapi API status:", vapiResponse.status);

      let parsedError;
      try {
        parsedError = JSON.parse(errorText);
      } catch {
        parsedError = { message: errorText };
      }

      return new Response(
        JSON.stringify({
          error: "Failed to update Vapi agent",
          message: parsedError.message || errorText,
          details: parsedError,
          success: false,
          status: vapiResponse.status,
          v_agent_id: v_agent_id,
        }),
        {
          status: vapiResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const vapiData = await vapiResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        data: vapiData,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error updating Vapi agent:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
