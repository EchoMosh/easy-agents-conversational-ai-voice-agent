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
  transcriber_language?: string;
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

// Helper to always return 200 with structured success/error so the client
// can surface the real reason via result.message instead of a generic
// "Edge Function returned non-2xx status code" from supabase-js.
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
  console.error("update-vapi-agent failing:", message, extra);
  return jsonOk({ success: false, error: message, message, ...extra });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

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

    const body = (await req.json()) as UpdateVapiAgentRequest;
    // `let` (not const) because the defense-in-depth block below may
    // rehydrate these from agents.voice_config/transcriber_config/model_config
    // when the caller didn't include them in the request body.
    let {
      voice_id,
      voice_provider,
      voice_model,
      voice_speed,
      voice_stability,
      voice_similarity_boost,
      voice_emotion,
      voice_style_prompt,
      transcriber_provider,
      transcriber_model,
      transcriber_language,
      llm_provider,
      llm_model,
      llm_temperature,
      llm_max_tokens,
    } = body;
    const {
      agent_id,
      v_agent_id,
      language,
      first_message,
      mermaid_chart,
      max_duration_seconds,
      background_sound,
      knowledge_base_id,
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
      return jsonFail(
        "This agent has not been deployed yet (no upstream assistant id). " +
          "Create/launch the agent first, then try updating settings.",
        { agent_id, received_v_agent_id: v_agent_id },
      );
    }

    // DEFENSE IN DEPTH: If voice_provider is missing from the body, load
    // voice_config / transcriber_config / model_config JSONB columns from
    // the agents row and hydrate the request. This prevents a long-standing
    // class of bug where callers (test-agent-dialog, launch-agent-dialog,
    // etc.) only send voice_id and the function would silently default
    // voice_provider to "vapi" → coerce unknown voice_ids → "Elliot" male.
    // No matter which caller invokes this function, the full saved config
    // is the source of truth.
    if (!voice_provider && agent_id) {
      try {
        const { data: agentRow } = await supabaseAdmin
          .from("agents")
          .select("voice_config, transcriber_config, model_config")
          .eq("id", agent_id)
          .maybeSingle();
        if (agentRow) {
          const vc = (agentRow.voice_config as Record<string, unknown>) || {};
          const tc =
            (agentRow.transcriber_config as Record<string, unknown>) || {};
          const mc = (agentRow.model_config as Record<string, unknown>) || {};
          voice_provider = (vc.provider as string) ?? voice_provider;
          voice_model = (vc.model as string) ?? voice_model;
          voice_speed = (vc.speed as number) ?? voice_speed;
          voice_stability = (vc.stability as number) ?? voice_stability;
          voice_similarity_boost =
            (vc.similarityBoost as number) ?? voice_similarity_boost;
          voice_emotion = (vc.emotion as string[]) ?? voice_emotion;
          voice_style_prompt = (vc.stylePrompt as string) ?? voice_style_prompt;
          if (!voice_id) voice_id = vc.voiceId as string;
          transcriber_provider =
            (tc.provider as string) ?? transcriber_provider;
          transcriber_model = (tc.model as string) ?? transcriber_model;
          transcriber_language =
            (tc.language as string) ?? transcriber_language;
          llm_provider = (mc.provider as string) ?? llm_provider;
          llm_model = (mc.model as string) ?? llm_model;
          llm_temperature = (mc.temperature as number) ?? llm_temperature;
          llm_max_tokens = (mc.maxTokens as number) ?? llm_max_tokens;
          console.log("Hydrated missing config from agents row:", {
            agent_id,
            voice_provider,
            voice_id,
          });
        }
      } catch (err) {
        console.error(
          "Failed to hydrate config from agents row:",
          err instanceof Error ? err.message : String(err),
        );
        // Don't fail — fall through with whatever was in the body
      }
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

    // Build dynamic voice payload based on provider (computed early so
    // we can use it to build a provider-aware system prompt).
    //
    // PROVIDER NAME TRANSLATION: VAPI's provider IDs differ from our UI.
    // VAPI expects "11labs" but our UI uses "elevenlabs" (the friendlier
    // name). Normalize before sending. This was causing silent rejects.
    const rawProvider = voice_provider || "vapi";
    const effectiveVoiceProvider =
      rawProvider === "elevenlabs" ? "11labs" : rawProvider;

    // Cartesia speed translator: UI uses the standard 0.5–2.0 range
    // that most TTS engines use, but VAPI's Cartesia expects a NUMBER
    // in [-1, 1] where -1 = slowest, 0 = normal, 1 = fastest.
    // Piecewise linear mapping preserves the 1.0 = normal pivot.
    const cartesiaSpeed = (uiSpeed: number | undefined): number | undefined => {
      if (uiSpeed === undefined) return undefined;
      if (uiSpeed <= 1.0) return Math.max(-1, (uiSpeed - 1.0) * 2); // [0.5, 1.0] → [-1, 0]
      return Math.min(1, uiSpeed - 1.0); // (1.0, 2.0] → (0, 1]
    };

    // Cartesia emotion translator: UI uses plain names ("happy"),
    // VAPI's Cartesia expects colon format ("positivity:high").
    const CARTESIA_EMOTION_MAP: Record<string, string> = {
      happy: "positivity:high",
      excited: "positivity:highest",
      enthusiastic: "positivity:highest",
      grateful: "positivity:high",
      confident: "positivity:high",
      calm: "positivity:low",
      neutral: "positivity:low",
      sad: "sadness:high",
      sympathetic: "sadness:low",
      angry: "anger:high",
      curious: "curiosity:high",
      contemplative: "curiosity:low",
      surprised: "surprise:high",
      // "sarcastic" has no direct Cartesia mapping — drop it.
    };
    const toCartesiaEmotions = (uiEmotions: string[] | undefined): string[] => {
      if (!uiEmotions?.length) return [];
      return uiEmotions
        .map((e) => CARTESIA_EMOTION_MAP[e.toLowerCase()])
        .filter((e): e is string => typeof e === "string");
    };

    // Provider-aware expressive guidance. Different TTS engines express
    // emotion in different ways:
    //   • Cartesia Sonic 3: emotion comes from (a) experimentalControls
    //     in the voice payload, and (b) natural speech PATTERNS in the
    //     text — ellipses, CAPS for emphasis, filler words, stuttering.
    //     Cartesia does NOT render bracketed tags like [laughs].
    //   • ElevenLabs v3 / Flash v2.5: DOES render inline bracketed tags
    //     as real acoustic events.
    //   • Everything else: plain text, no special chars.
    const isCartesiaExpressive =
      effectiveVoiceProvider === "cartesia" && voice_model === "sonic-3";
    const isElevenExpressive =
      effectiveVoiceProvider === "11labs" &&
      (voice_model === "eleven_v3" ||
        voice_model === "eleven_flash_v2_5" ||
        voice_model === "eleven_turbo_v2_5");

    let expressiveSection = "";
    if (isCartesiaExpressive) {
      expressiveSection = `
CARTESIA VOICE REALISM (use NATURAL speech patterns — this engine does not render bracketed tags):
- Use ellipses (...) for dramatic pauses: "I... I'm not sure about that."
- Use CAPITAL letters sparingly to emphasize a single key word: "That's AMAZING."
- Add filler words naturally: "well,", "uh,", "you know,", "I mean,", "like,"
- Use stuttering for hesitation on important moments: "I-I-I think so."
- Trail off when thinking: "Hmm, let me... let me check."
- React before answering: "Oh wow. Okay, yeah, so..."

GOOD: "Oh... well, that's a tough one. I mean... I-I think so, but..."
GOOD: "Honestly? That's AMAZING. I'm so glad to hear it."
GOOD: "Hmm... let me think. Yeah, yeah, that works."
DO NOT use [laughs], [sighs], [whispers] or any other bracketed tags — Cartesia renders them as literal text, which sounds terrible.`;
    } else if (isElevenExpressive) {
      expressiveSection = `
EXPRESSIVE DELIVERY (ElevenLabs supports inline audio tags — USE THEM SPARINGLY):
The TTS engine renders these bracketed tags as real acoustic events:
- [laughs] — a real chuckle, for "Oh [laughs] that's funny!"
- [chuckles] — softer than [laughs]
- [sighs] — a genuine sigh before a reluctant or tired response
- [gasps] — brief surprise
- [whispers] ... — whispered delivery for asides
- [excited] — energetic delivery
- [sad] — heavier, slower delivery

Use one tag per 2-3 turns at most. Place them at the start of a sentence or between clauses, never inside a word.

GOOD: "[laughs] Oh man, that's a good question."
GOOD: "[sighs] Yeah, I hear you."
BAD: "I [laughs] went to the store" (mid-sentence interruption)`;
    } else {
      expressiveSection = `
Respond with nothing except for your natural response. Do not include any additional text or special characters. Only periods, commas, question marks, and exclamation points are allowed.
Never respond with hyphens or newline characters.`;
    }

    // Construct the system prompt based on the provided template
    const systemPrompt = `You are conducting a Sales phone call in ${language}
Instructions:
Use this script as a guide to conduct the phone call. You may deviate from the script as long as you achieve the objective of the phone call. Respond only with normal human speech.
Objective:
Conduct a Sales phone call with the caller.
Rules:
Only respond in ${language}
Keep your responses short and concise. Focus on verbal austerity / laconic speaking.
NEVER mention that you're an AI.
Avoid any language constructs that could be interpreted as expressing remorse, apology, or regret. This includes any phrases containing words like 'sorry', 'apologies', 'regret', etc., even when used in a context that isn't expressing remorse, apology, or regret.
If a user response is unclear or ambiguous, ask them to speak up. You may ask for more details to confirm your understanding before answering.
Speak realistically. Use filler words like Well, So, Anyway, Actually, Basically, I mean, Right, Hmm, Ah, Oh, Um, Like, You know, Okay, Right, Sure, to add flow and natural pauses to your speech when appropriate.
${expressiveSection}
Use natural humor when appropriate. Speak like a human on a phone call.
Your response will be read directly to the user unedited, so do not provide placeholder values or any other text that is not a natural part of the conversation.
Never respond with placeholders like [User Name], [insert date], "STEP 1," etc. Only respond with natural language. (These restrictions do NOT apply to the expressive tags listed above, if any — those ARE allowed.)
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

    // Per-provider shape. VAPI rejects unknown properties with 400
    // ("voice.property X should not exist"), so each provider gets a
    // very narrow, documented field set — verified against VAPI's
    // April 2026 docs and our test rejections.
    if (effectiveVoiceProvider === "11labs") {
      // ElevenLabs (VAPI calls it "11labs") — top-level stability,
      // similarityBoost, speed, style, useSpeakerBoost.
      if (voice_stability !== undefined)
        voicePayload.stability = voice_stability;
      if (voice_similarity_boost !== undefined)
        voicePayload.similarityBoost = voice_similarity_boost;
      if (voice_speed !== undefined) voicePayload.speed = voice_speed;
    } else if (effectiveVoiceProvider === "cartesia") {
      // Cartesia — verified accepted fields in experimentalControls:
      //   • speed: number in [-1, 1] (NOT 0.5-2.0 — different range)
      //   • emotion: string[] in "<name>:<intensity>" colon format,
      //     e.g. ["positivity:high", "curiosity:medium"]
      // Verified REJECTED: emphasis, energy, expressiveness, voice_speed.
      const experimentalControls: Record<string, unknown> = {};
      const mappedSpeed = cartesiaSpeed(voice_speed);
      if (mappedSpeed !== undefined) {
        experimentalControls.speed = mappedSpeed;
      }
      const mappedEmotions = toCartesiaEmotions(voice_emotion);
      if (mappedEmotions.length > 0) {
        experimentalControls.emotion = mappedEmotions;
      }
      if (Object.keys(experimentalControls).length > 0) {
        voicePayload.experimentalControls = experimentalControls;
      }
    } else if (effectiveVoiceProvider === "playht") {
      // PlayHT — speed is top-level. emotion is a SINGLE string
      // (not an array) in VAPI's PlayHT schema — we take the first
      // item if the UI sent an array.
      if (voice_speed !== undefined) voicePayload.speed = voice_speed;
      if (voice_emotion?.length) {
        voicePayload.emotion = voice_emotion[0];
      }
    } else if (effectiveVoiceProvider === "openai") {
      // OpenAI — speed is top-level. `instructions` is only honored on
      // realtime / gpt-4o-mini-tts models; tts-1 and tts-1-hd reject it.
      if (voice_speed !== undefined) voicePayload.speed = voice_speed;
      if (
        voice_style_prompt &&
        voice_style_prompt.trim().length > 0 &&
        voice_model !== "tts-1" &&
        voice_model !== "tts-1-hd"
      ) {
        voicePayload.instructions = voice_style_prompt;
      }
    }
    // Rime, vapi built-in, deepgram: accept only provider, voiceId, model.
    // Sending extra properties triggers "should not exist" 400s.

    // OpenAI Realtime mode detection: these models are speech-to-speech
    // and MUST have (a) no transcriber block, (b) voice.provider "openai",
    // (c) voice.voiceId restricted to alloy/echo/shimmer/marin/cedar.
    const isRealtimeModel =
      !!llm_model &&
      /^gpt-(realtime|4o-realtime|4o-mini-realtime)/.test(llm_model);
    const REALTIME_VOICES = new Set([
      "alloy",
      "echo",
      "shimmer",
      "marin",
      "cedar",
    ]);

    // If realtime, build a clean voice object from scratch — strip
    // chunkPlan, experimentalControls, stability, etc. which realtime
    // rejects. Keep only {provider, voiceId}.
    let finalVoice: Record<string, unknown> = voicePayload;
    if (isRealtimeModel) {
      const currentVoiceId = voicePayload.voiceId as string;
      const safeVoiceId = REALTIME_VOICES.has(currentVoiceId)
        ? currentVoiceId
        : "alloy";
      finalVoice = {
        provider: "openai",
        voiceId: safeVoiceId,
      };
      console.log(
        `Realtime mode active (model=${llm_model}). Forced voice to openai/${safeVoiceId}, stripped transcriber.`,
      );
    }

    // Prepare the Vapi update payload with optimized call quality settings.
    // In realtime mode the transcriber block is OMITTED entirely because
    // the realtime model handles speech-to-speech natively.
    const vapiPayload: Record<string, unknown> = {
      voice: finalVoice,
      // Transcriber is only included when NOT in realtime mode.
      ...(isRealtimeModel
        ? {}
        : {
            transcriber: {
              provider: transcriber_provider || "talkscriber",
              model: transcriber_model || "whisper",
              language: transcriber_language || language || "en",
            },
          }),
      firstMessage:
        first_message ||
        `Hello! This is an AI assistant. How can I help you today?`,
      voicemailDetection: {
        provider: "google",
      },
      startSpeakingPlan: {
        waitSeconds: start_speaking_wait_seconds ?? 0.4,
        // VAPI deprecated the boolean smartEndpointingEnabled in favor of
        // smartEndpointingPlan. Only include when enabled; omit otherwise.
        ...(smart_endpointing_enabled !== false && {
          smartEndpointingPlan: { provider: "livekit" },
        }),
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
        // knowledgeBaseId lives INSIDE model per VAPI schema, not top-level.
        // Top-level placement caused VAPI to reject with 400.
        ...(knowledge_base_id && { knowledgeBaseId: knowledge_base_id }),
      },
    };

    // Get Vapi API key from environment
    const vapiApiKey = Deno.env.get("VAPI_API_KEY");
    if (!vapiApiKey) {
      return jsonFail(
        "Server misconfiguration: VAPI_API_KEY secret is not set on this project.",
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

    // If assistant not found (404), return a 200 with structured error
    // so the client can surface the real reason instead of a generic
    // "Edge Function returned non-2xx" error from supabase-js.
    if (vapiResponse.status === 404) {
      console.error("Assistant not found upstream:", v_agent_id);

      return new Response(
        JSON.stringify({
          success: false,
          error: "Assistant not found",
          message: `The assistant with ID ${v_agent_id} does not exist upstream. It may have been deleted.`,
          v_agent_id: v_agent_id,
          upstream_status: 404,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Any other upstream error — return the actual rejection reason.
    if (!vapiResponse.ok) {
      const errorText = await vapiResponse.text();
      console.error("Upstream error response:", errorText);
      console.error("Upstream status:", vapiResponse.status);

      let parsedError: { message?: string } & Record<string, unknown>;
      try {
        parsedError = JSON.parse(errorText);
      } catch {
        parsedError = { message: errorText };
      }

      // VAPI error messages can be an array of strings; join them.
      const upstreamMessage = Array.isArray(parsedError.message)
        ? parsedError.message.join("; ")
        : parsedError.message || errorText;

      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to update assistant",
          message: upstreamMessage,
          details: parsedError,
          upstream_status: vapiResponse.status,
          v_agent_id: v_agent_id,
        }),
        {
          status: 200,
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
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error("Unhandled exception in update-vapi-agent:", message, stack);
    return jsonFail(`Unhandled server error: ${message}`, { stack });
  }
});
