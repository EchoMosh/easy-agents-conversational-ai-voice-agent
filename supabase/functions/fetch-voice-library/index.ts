// One-shot helper to pull provider voice libraries so we can populate
// src/components/agents/settings/constants/voice-providers.ts with
// authoritatively-verified voice entries instead of hand-copied guesses.
//
// Supports two sources:
//   1. Cartesia — reads CARTESIA_API_KEY secret if set, otherwise tries
//      the VAPI voice-library endpoint with VAPI_API_KEY.
//   2. ElevenLabs — uses the public /v1/voices endpoint (no auth).
//
// Deployed with --no-verify-jwt; invoke with the anon key as Bearer.
// POST body: { "provider": "cartesia" | "elevenlabs" }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonOk(body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function fetchCartesiaDirect(apiKey: string): Promise<unknown> {
  const res = await fetch("https://api.cartesia.ai/voices/?limit=500", {
    headers: {
      "X-API-Key": apiKey,
      "Cartesia-Version": "2024-11-13",
    },
  });
  if (!res.ok) {
    throw new Error(
      `Cartesia API returned ${res.status}: ${(await res.text()).slice(0, 500)}`,
    );
  }
  return res.json();
}

async function fetchVapiVoiceLibrary(
  apiKey: string,
  provider: string,
): Promise<unknown> {
  const res = await fetch(
    `https://api.vapi.ai/voice-library?provider=${encodeURIComponent(provider)}`,
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    },
  );
  if (!res.ok) {
    throw new Error(
      `VAPI voice-library returned ${res.status}: ${(await res.text()).slice(0, 500)}`,
    );
  }
  return res.json();
}

async function fetchElevenLabs(): Promise<unknown> {
  const res = await fetch("https://api.elevenlabs.io/v1/voices");
  if (!res.ok) {
    throw new Error(
      `ElevenLabs /v1/voices returned ${res.status}: ${(await res.text()).slice(0, 500)}`,
    );
  }
  return res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const provider = (body as { provider?: string }).provider || "cartesia";

    const attempts: Array<{ method: string; result: unknown; error?: string }> =
      [];

    if (provider === "cartesia") {
      // Try Cartesia direct first
      const cartesiaKey = Deno.env.get("CARTESIA_API_KEY");
      if (cartesiaKey) {
        try {
          const voices = await fetchCartesiaDirect(cartesiaKey);
          attempts.push({ method: "cartesia-direct", result: voices });
          return jsonOk({
            success: true,
            source: "cartesia-direct",
            voices,
          });
        } catch (err) {
          attempts.push({
            method: "cartesia-direct",
            result: null,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      // Fall back to VAPI voice library
      const vapiKey = Deno.env.get("VAPI_API_KEY");
      if (vapiKey) {
        try {
          const voices = await fetchVapiVoiceLibrary(vapiKey, "cartesia");
          attempts.push({ method: "vapi-voice-library", result: voices });
          return jsonOk({
            success: true,
            source: "vapi-voice-library",
            voices,
          });
        } catch (err) {
          attempts.push({
            method: "vapi-voice-library",
            result: null,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }

      return jsonOk({
        success: false,
        error:
          "No source available — set CARTESIA_API_KEY or VAPI_API_KEY secret.",
        attempts,
      });
    }

    if (provider === "elevenlabs") {
      const voices = await fetchElevenLabs();
      return jsonOk({ success: true, source: "elevenlabs-public", voices });
    }

    return jsonOk({
      success: false,
      error: `Unknown provider: ${provider}. Use "cartesia" or "elevenlabs".`,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("fetch-voice-library error:", msg, stack);
    return jsonOk({ success: false, error: msg, stack });
  }
});
