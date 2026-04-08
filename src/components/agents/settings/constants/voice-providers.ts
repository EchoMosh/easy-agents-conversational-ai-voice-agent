export interface VoiceOption {
  id: string;
  name: string;
  gender: "male" | "female" | "neutral";
  accent?: string;
  /**
   * Which model IDs (from the same provider's `models` array) this voice
   * is valid for. If omitted, the voice is assumed to work with any model
   * in the provider. REQUIRED for providers where voices are
   * model-specific (e.g. Rime Arcana voices are incompatible with Rime
   * Mist and vice versa).
   */
  compatibleModels?: string[];
}

export interface VoiceModel {
  id: string;
  name: string;
  latency: "low" | "medium" | "high";
}

export interface VoiceProvider {
  id: string;
  name: string;
  requiresApiKey: boolean;
  models: VoiceModel[];
  voices: VoiceOption[];
  supportsEmotion: boolean;
  supportsSpeed: boolean;
  supportsStability: boolean;
  supportsStylePrompt: boolean;
  emotionOptions: string[];
}

export const VOICE_PROVIDERS: VoiceProvider[] = [
  {
    id: "vapi",
    name: "Built-in (Free)",
    requiresApiKey: false,
    models: [{ id: "default", name: "Default", latency: "low" }],
    // Verified against docs.vapi.ai/providers/voice/vapi-voices.
    // Previous list had 9 Orpheus TTS voices (Naina, Leah, Tara, Jess,
    // Leo, Dan, Mia, Zac, Zoe) that are NOT real VAPI voices — they
    // would fail at runtime. Removed.
    voices: [
      { id: "Elliot", name: "Elliot", gender: "male" },
      { id: "Clara", name: "Clara", gender: "female" },
      { id: "Godfrey", name: "Godfrey", gender: "male" },
      { id: "Savannah", name: "Savannah", gender: "female" },
      { id: "Rohan", name: "Rohan", gender: "male" },
      { id: "Emma", name: "Emma", gender: "female" },
      { id: "Nico", name: "Nico", gender: "male" },
      { id: "Kai", name: "Kai", gender: "male" },
      { id: "Sagar", name: "Sagar", gender: "male" },
      { id: "Neil", name: "Neil", gender: "male" },
    ],
    supportsEmotion: false,
    supportsSpeed: false,
    supportsStability: false,
    supportsStylePrompt: false,
    emotionOptions: [],
  },
  {
    id: "cartesia",
    name: "Cartesia",
    requiresApiKey: false,
    // Only sonic-english and sonic-3 are confirmed valid in VAPI's
    // Cartesia schema (April 2026 docs). sonic-2 and plain "sonic" were
    // not listed and may be rejected.
    models: [
      { id: "sonic-3", name: "Sonic 3 (latest)", latency: "low" },
      { id: "sonic-english", name: "Sonic English", latency: "low" },
    ],
    // Only UUIDs that are independently verified against multiple sources
    // (SignalWire Cartesia docs, Pipecat, Cartesia calls API docs) remain.
    // The previous list had 4 unverifiable UUIDs and 1 gender mislabel
    // (41534e16... was "Reading Lady female" but is actually "1920's
    // Radioman MALE"). To add more voices, fetch the canonical list from
    // `GET https://api.cartesia.ai/voices?limit=500` with an API key and
    // dump straight into this array — do not copy from third-party sites.
    voices: [
      {
        id: "a0e99841-438c-4a64-b679-ae501e7d6091",
        name: "Barbershop Man",
        gender: "male",
        accent: "american",
      },
      {
        id: "79a125e8-cd45-4c13-8a67-188112f4dd22",
        name: "British Lady",
        gender: "female",
        accent: "british",
      },
    ],
    supportsEmotion: true,
    supportsSpeed: true,
    supportsStability: false,
    supportsStylePrompt: false,
    emotionOptions: [
      "neutral",
      "happy",
      "excited",
      "sad",
      "angry",
      "calm",
      "curious",
      "confident",
      "sympathetic",
      "surprised",
      "grateful",
      "enthusiastic",
      "sarcastic",
      "contemplative",
    ],
  },
  {
    id: "elevenlabs",
    name: "ElevenLabs",
    requiresApiKey: false,
    models: [
      { id: "eleven_flash_v2_5", name: "Flash v2.5", latency: "low" },
      { id: "eleven_flash_v2", name: "Flash v2", latency: "low" },
      { id: "eleven_turbo_v2_5", name: "Turbo v2.5", latency: "low" },
      { id: "eleven_turbo_v2", name: "Turbo v2", latency: "low" },
      {
        id: "eleven_v3",
        name: "v3 (expressive, higher latency)",
        latency: "high",
      },
      {
        id: "eleven_multilingual_v2",
        name: "Multilingual v2",
        latency: "medium",
      },
      {
        id: "eleven_monolingual_v1",
        name: "Monolingual v1",
        latency: "medium",
      },
    ],
    // Voices pulled live from https://api.elevenlabs.io/v1/voices on
    // 2026-04-09. All 21 entries are current premade voices — none are
    // on ElevenLabs' 2026-12-31 deprecation list. To refresh this list
    // later, run: curl https://api.elevenlabs.io/v1/voices (no auth
    // required for the premade catalog).
    voices: [
      // Females
      {
        id: "EXAVITQu4vr4xnSDxMaL",
        name: "Sarah",
        gender: "female",
        accent: "american",
      },
      {
        id: "FGY2WhTYpPnrIDTdsKH5",
        name: "Laura",
        gender: "female",
        accent: "american",
      },
      {
        id: "XrExE9yKIg1WjnnlVkGX",
        name: "Matilda",
        gender: "female",
        accent: "american",
      },
      {
        id: "cgSgspJ2msm6clMCkdW9",
        name: "Jessica",
        gender: "female",
        accent: "american",
      },
      {
        id: "hpp4J3VqNfWAUOO0d1Us",
        name: "Bella",
        gender: "female",
        accent: "american",
      },
      {
        id: "Xb7hH8MSUJpSbSDYk0k2",
        name: "Alice",
        gender: "female",
        accent: "british",
      },
      {
        id: "pFZP5JQG7iQjIQuC4Bku",
        name: "Lily",
        gender: "female",
        accent: "british",
      },
      // Males
      {
        id: "CwhRBWXzGAHq8TQ4Fs17",
        name: "Roger",
        gender: "male",
        accent: "american",
      },
      {
        id: "IKne3meq5aSn9XLyUdCD",
        name: "Charlie",
        gender: "male",
        accent: "australian",
      },
      {
        id: "JBFqnCBsd6RMkjVDRZzb",
        name: "George",
        gender: "male",
        accent: "british",
      },
      {
        id: "N2lVS1w4EtoT3dr4eOWO",
        name: "Callum",
        gender: "male",
        accent: "american",
      },
      {
        id: "SOYHLrjzK2X1ezoPC6cr",
        name: "Harry",
        gender: "male",
        accent: "american",
      },
      {
        id: "TX3LPaxmHKxFdv7VOQHJ",
        name: "Liam",
        gender: "male",
        accent: "american",
      },
      {
        id: "bIHbv24MWmeRgasZH58o",
        name: "Will",
        gender: "male",
        accent: "american",
      },
      {
        id: "cjVigY5qzO86Huf0OWal",
        name: "Eric",
        gender: "male",
        accent: "american",
      },
      {
        id: "iP95p4xoKVk53GoZ742B",
        name: "Chris",
        gender: "male",
        accent: "american",
      },
      {
        id: "nPczCjzI2devNBz1zQrb",
        name: "Brian",
        gender: "male",
        accent: "american",
      },
      {
        id: "onwK4e9ZLuTAKqWW03F9",
        name: "Daniel",
        gender: "male",
        accent: "british",
      },
      {
        id: "pNInz6obpgDQGcFmaJgB",
        name: "Adam",
        gender: "male",
        accent: "american",
      },
      {
        id: "pqHfZKP75CvOlQylNhV4",
        name: "Bill",
        gender: "male",
        accent: "american",
      },
      // Neutral
      {
        id: "SAz9YHcvj6GT2YYXdXww",
        name: "River",
        gender: "neutral",
        accent: "american",
      },
    ],
    supportsEmotion: false,
    supportsSpeed: false,
    supportsStability: true,
    supportsStylePrompt: false,
    emotionOptions: [],
  },
  {
    id: "openai",
    name: "OpenAI",
    requiresApiKey: false,
    models: [
      {
        id: "gpt-4o-mini-tts",
        name: "GPT-4o Mini TTS (steerable)",
        latency: "low",
      },
      { id: "tts-1", name: "TTS-1", latency: "low" },
      { id: "tts-1-hd", name: "TTS-1 HD", latency: "medium" },
    ],
    // OpenAI explicitly does NOT publish gender labels for any TTS voice
    // (platform.openai.com/docs/guides/text-to-speech). Staff direction
    // is to use system instructions for tone. All voices marked neutral
    // because no authoritative source labels them otherwise.
    voices: [
      { id: "marin", name: "Marin", gender: "neutral" },
      { id: "cedar", name: "Cedar", gender: "neutral" },
      { id: "verse", name: "Verse", gender: "neutral" },
      { id: "alloy", name: "Alloy", gender: "neutral" },
      { id: "ash", name: "Ash", gender: "neutral" },
      { id: "ballad", name: "Ballad", gender: "neutral" },
      { id: "coral", name: "Coral", gender: "neutral" },
      { id: "echo", name: "Echo", gender: "neutral" },
      { id: "fable", name: "Fable", gender: "neutral" },
      { id: "nova", name: "Nova", gender: "neutral" },
      { id: "onyx", name: "Onyx", gender: "neutral" },
      { id: "sage", name: "Sage", gender: "neutral" },
      { id: "shimmer", name: "Shimmer", gender: "neutral" },
    ],
    supportsEmotion: false,
    supportsSpeed: true,
    supportsStability: false,
    supportsStylePrompt: true,
    emotionOptions: [],
  },
  {
    id: "playht",
    name: "PlayHT",
    requiresApiKey: false,
    models: [
      { id: "Play3.0-mini", name: "Play 3.0 Mini", latency: "low" },
      { id: "PlayDialog", name: "PlayDialog", latency: "medium" },
      { id: "PlayHT2.0-turbo", name: "PlayHT 2.0 Turbo", latency: "low" },
      { id: "PlayHT2.0", name: "PlayHT 2.0", latency: "medium" },
    ],
    // Verified against PlayHT's own pyht SDK README and
    // docs.play.ht/reference/list-of-prebuilt-voices.
    // Previous entries had: a UUID typo on Jennifer (20d1 → 20a1), a
    // wrong UUID on Adrian (replaced with canonical d99d35e6...), and
    // an entirely fabricated "Olivia British" that doesn't exist in
    // PlayHT's prebuilt catalog. Olivia removed.
    voices: [
      {
        id: "s3://voice-cloning-zero-shot/775ae416-49bb-4fb6-bd45-740f205d20a1/jennifersaad/manifest.json",
        name: "Jennifer",
        gender: "female",
        accent: "american",
      },
      {
        id: "s3://voice-cloning-zero-shot/d99d35e6-e625-4fa4-925a-d65172d358e1/adriansaad/manifest.json",
        name: "Adrian",
        gender: "male",
        accent: "american",
      },
    ],
    supportsEmotion: true,
    supportsSpeed: true,
    supportsStability: false,
    supportsStylePrompt: false,
    emotionOptions: [
      "neutral",
      "happy",
      "sad",
      "angry",
      "surprised",
      "curious",
    ],
  },
  {
    id: "rime-ai",
    name: "Rime AI",
    requiresApiKey: false,
    models: [
      { id: "arcana", name: "Arcana (most human)", latency: "low" },
      { id: "mistv2", name: "Mist v2", latency: "low" },
      { id: "mist", name: "Mist", latency: "low" },
    ],
    // Voices verified against https://users.rime.ai/data/voices/voice_details.json
    // (fetched April 9, 2026). Every gender, model compatibility and accent
    // here comes directly from that live metadata — do NOT guess. Rime has
    // voices like "fern" that sound like a flower but are actually MALE.
    voices: [
      // === ARCANA voices — females ===
      {
        id: "luna",
        name: "Luna",
        gender: "female",
        accent: "american",
        compatibleModels: ["arcana"],
      },
      {
        id: "celeste",
        name: "Celeste",
        gender: "female",
        accent: "american",
        compatibleModels: ["arcana"],
      },
      {
        id: "astra",
        name: "Astra",
        gender: "female",
        accent: "american",
        compatibleModels: ["arcana", "mistv2"],
      },
      {
        id: "andromeda",
        name: "Andromeda",
        gender: "female",
        accent: "american",
        compatibleModels: ["arcana"],
      },
      {
        id: "lyra",
        name: "Lyra",
        gender: "female",
        accent: "american",
        compatibleModels: ["arcana"],
      },
      {
        id: "estelle",
        name: "Estelle",
        gender: "female",
        accent: "american",
        compatibleModels: ["arcana"],
      },
      {
        id: "esther",
        name: "Esther",
        gender: "female",
        accent: "american",
        compatibleModels: ["arcana"],
      },
      {
        id: "moss",
        name: "Moss",
        gender: "female",
        accent: "singaporean",
        compatibleModels: ["arcana"],
      },
      // === ARCANA voices — males ===
      {
        id: "orion",
        name: "Orion",
        gender: "male",
        accent: "american",
        compatibleModels: ["arcana"],
      },
      {
        id: "eliphas",
        name: "Eliphas",
        gender: "male",
        accent: "american",
        compatibleModels: ["arcana"],
      },
      {
        id: "fern",
        name: "Fern",
        gender: "male",
        accent: "american",
        compatibleModels: ["arcana"],
      },
      {
        id: "albion",
        name: "Albion",
        gender: "male",
        accent: "english",
        compatibleModels: ["arcana"],
      },
      {
        id: "bond",
        name: "Bond",
        gender: "male",
        accent: "american",
        compatibleModels: ["arcana"],
      },

      // === MIST / MIST v2 voices — females ===
      {
        id: "amber",
        name: "Amber",
        gender: "female",
        accent: "american",
        compatibleModels: ["mist", "mistv2"],
      },
      {
        id: "allison",
        name: "Allison",
        gender: "female",
        accent: "american",
        compatibleModels: ["mist", "mistv2"],
      },
      {
        id: "brenda",
        name: "Brenda",
        gender: "female",
        accent: "american",
        compatibleModels: ["mist", "mistv2"],
      },
      {
        id: "marina",
        name: "Marina",
        gender: "female",
        accent: "texan",
        compatibleModels: ["mist", "mistv2"],
      },
      {
        id: "pearl",
        name: "Pearl",
        gender: "female",
        accent: "american",
        compatibleModels: ["mist", "mistv2"],
      },
      {
        id: "grove",
        name: "Grove",
        gender: "female",
        accent: "american",
        compatibleModels: ["mist", "mistv2"],
      },
      // === MIST / MIST v2 voices — males ===
      {
        id: "elliot",
        name: "Elliot",
        gender: "male",
        accent: "american",
        compatibleModels: ["mist", "mistv2"],
      },
      {
        id: "marsh",
        name: "Marsh",
        gender: "male",
        accent: "american",
        compatibleModels: ["mist", "mistv2"],
      },
      {
        id: "rohan",
        name: "Rohan",
        gender: "male",
        accent: "indian",
        compatibleModels: ["mist", "mistv2"],
      },
      {
        id: "cedar",
        name: "Cedar",
        gender: "male",
        accent: "american",
        compatibleModels: ["mist", "mistv2"],
      },
      {
        id: "colin",
        name: "Colin",
        gender: "male",
        accent: "new york",
        compatibleModels: ["mist", "mistv2"],
      },
      // === MIST voices — neutral ===
      {
        id: "violet",
        name: "Violet",
        gender: "neutral",
        accent: "american",
        compatibleModels: ["mist", "mistv2"],
      },
    ],
    supportsEmotion: false,
    supportsSpeed: true,
    supportsStability: false,
    supportsStylePrompt: false,
    emotionOptions: [],
  },
  {
    id: "deepgram",
    name: "Deepgram",
    requiresApiKey: false,
    // Voice IDs are the full Deepgram model strings with the "aura-2-"
    // prefix for Aura 2 voices and "aura-" for legacy Aura 1. Using the
    // bare name (e.g. "thalia-en") fails because Deepgram's API expects
    // the full model string.
    models: [
      { id: "aura-2", name: "Aura 2", latency: "low" },
      { id: "aura", name: "Aura (legacy)", latency: "low" },
    ],
    voices: [
      // === AURA 2 ===
      {
        id: "aura-2-thalia-en",
        name: "Thalia",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "aura-2-andromeda-en",
        name: "Andromeda",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "aura-2-helena-en",
        name: "Helena",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "aura-2-athena-en",
        name: "Athena",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "aura-2-cora-en",
        name: "Cora",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "aura-2-cordelia-en",
        name: "Cordelia",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "aura-2-luna-en",
        name: "Luna",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "aura-2-phoebe-en",
        name: "Phoebe",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "aura-2-apollo-en",
        name: "Apollo",
        gender: "male",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "aura-2-arcas-en",
        name: "Arcas",
        gender: "male",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "aura-2-aries-en",
        name: "Aries",
        gender: "male",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "aura-2-atlas-en",
        name: "Atlas",
        gender: "male",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "aura-2-jupiter-en",
        name: "Jupiter",
        gender: "male",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "aura-2-orion-en",
        name: "Orion",
        gender: "male",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "aura-2-zeus-en",
        name: "Zeus",
        gender: "male",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "aura-2-draco-en",
        name: "Draco",
        gender: "male",
        accent: "british",
        compatibleModels: ["aura-2"],
      },
      // === AURA 1 (legacy) ===
      {
        id: "aura-asteria-en",
        name: "Asteria",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura"],
      },
      {
        id: "aura-luna-en",
        name: "Luna",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura"],
      },
      {
        id: "aura-stella-en",
        name: "Stella",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura"],
      },
      {
        id: "aura-athena-en",
        name: "Athena",
        gender: "female",
        accent: "british",
        compatibleModels: ["aura"],
      },
      {
        id: "aura-hera-en",
        name: "Hera",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura"],
      },
      {
        id: "aura-orion-en",
        name: "Orion",
        gender: "male",
        accent: "american",
        compatibleModels: ["aura"],
      },
      {
        id: "aura-arcas-en",
        name: "Arcas",
        gender: "male",
        accent: "american",
        compatibleModels: ["aura"],
      },
      {
        id: "aura-perseus-en",
        name: "Perseus",
        gender: "male",
        accent: "american",
        compatibleModels: ["aura"],
      },
      {
        id: "aura-angus-en",
        name: "Angus",
        gender: "male",
        accent: "irish",
        compatibleModels: ["aura"],
      },
      {
        id: "aura-orpheus-en",
        name: "Orpheus",
        gender: "male",
        accent: "american",
        compatibleModels: ["aura"],
      },
      {
        id: "aura-helios-en",
        name: "Helios",
        gender: "male",
        accent: "british",
        compatibleModels: ["aura"],
      },
      {
        id: "aura-zeus-en",
        name: "Zeus",
        gender: "male",
        accent: "american",
        compatibleModels: ["aura"],
      },
    ],
    supportsEmotion: false,
    supportsSpeed: false,
    supportsStability: false,
    supportsStylePrompt: false,
    emotionOptions: [],
  },
];

export const DEFAULT_VOICE_PROVIDER_ID = "vapi";
export const DEFAULT_VOICE_ID = "Elliot";

export function getVoiceProvider(
  providerId: string,
): VoiceProvider | undefined {
  return VOICE_PROVIDERS.find((p) => p.id === providerId);
}

// Alias for backward compat
export const getProvider = getVoiceProvider;

export function getVoiceById(
  providerId: string,
  voiceId: string,
): VoiceOption | undefined {
  const provider = getVoiceProvider(providerId);
  return provider?.voices.find((v) => v.id === voiceId);
}
