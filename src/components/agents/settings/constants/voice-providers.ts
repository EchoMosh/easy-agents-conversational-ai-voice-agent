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
      { id: "Naina", name: "Naina", gender: "female" },
      { id: "Leah", name: "Leah", gender: "female" },
      { id: "Tara", name: "Tara", gender: "female" },
      { id: "Jess", name: "Jess", gender: "female" },
      { id: "Leo", name: "Leo", gender: "male" },
      { id: "Dan", name: "Dan", gender: "male" },
      { id: "Mia", name: "Mia", gender: "female" },
      { id: "Zac", name: "Zac", gender: "male" },
      { id: "Zoe", name: "Zoe", gender: "female" },
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
    models: [
      { id: "sonic-3", name: "Sonic 3", latency: "low" },
      { id: "sonic-2", name: "Sonic 2", latency: "low" },
      { id: "sonic", name: "Sonic", latency: "low" },
    ],
    voices: [
      {
        id: "a0e99841-438c-4a64-b679-ae501e7d6091",
        name: "Barbershop Man",
        gender: "male",
        accent: "american",
      },
      {
        id: "156fb8d2-335b-4950-9cb3-a2d33f2c7052",
        name: "Confident Woman",
        gender: "female",
        accent: "american",
      },
      {
        id: "79a125e8-cd45-4c13-8a67-188112f4dd22",
        name: "British Lady",
        gender: "female",
        accent: "british",
      },
      {
        id: "ee7ea9f8-c0c1-498c-9f62-dc2da95a807f",
        name: "Friendly Sidekick",
        gender: "male",
        accent: "american",
      },
      {
        id: "41534e16-2966-4c6b-9670-111411def906",
        name: "Reading Lady",
        gender: "female",
        accent: "american",
      },
      {
        id: "bf991597-6c13-47e4-8a44-df5c3e8b53de",
        name: "Midwestern Woman",
        gender: "female",
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
    voices: [
      {
        id: "21m00Tcm4TlvDq8ikWAM",
        name: "Rachel",
        gender: "female",
        accent: "american",
      },
      {
        id: "AZnzlk1XvdvUeBnXmlld",
        name: "Domi",
        gender: "female",
        accent: "american",
      },
      {
        id: "EXAVITQu4vr4xnSDxMaL",
        name: "Bella",
        gender: "female",
        accent: "american",
      },
      {
        id: "ErXwobaYiN019PkySvjV",
        name: "Antoni",
        gender: "male",
        accent: "american",
      },
      {
        id: "MF3mGyEYCl7XYWbV9V6O",
        name: "Elli",
        gender: "female",
        accent: "american",
      },
      {
        id: "TxGEqnHWrfWFTfGW9XjX",
        name: "Josh",
        gender: "male",
        accent: "american",
      },
      {
        id: "VR6AewLTigWG4xSOukaG",
        name: "Arnold",
        gender: "male",
        accent: "american",
      },
      {
        id: "pNInz6obpgDQGcFmaJgB",
        name: "Adam",
        gender: "male",
        accent: "american",
      },
      {
        id: "yoZ06aMxZJJ28mfd3POQ",
        name: "Sam",
        gender: "male",
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
    voices: [
      { id: "marin", name: "Marin", gender: "female" },
      { id: "cedar", name: "Cedar", gender: "male" },
      { id: "verse", name: "Verse", gender: "neutral" },
      { id: "alloy", name: "Alloy", gender: "neutral" },
      { id: "ash", name: "Ash", gender: "male" },
      { id: "ballad", name: "Ballad", gender: "male" },
      { id: "coral", name: "Coral", gender: "female" },
      { id: "echo", name: "Echo", gender: "male" },
      { id: "fable", name: "Fable", gender: "male" },
      { id: "nova", name: "Nova", gender: "female" },
      { id: "onyx", name: "Onyx", gender: "male" },
      { id: "sage", name: "Sage", gender: "female" },
      { id: "shimmer", name: "Shimmer", gender: "female" },
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
    voices: [
      {
        id: "s3://voice-cloning-zero-shot/775ae416-49bb-4fb6-bd45-740f205d20d1/jennifersaad/manifest.json",
        name: "Jennifer",
        gender: "female",
        accent: "american",
      },
      {
        id: "s3://voice-cloning-zero-shot/d9ff78ba-d016-47f6-b0ef-dd630f59414e/adriansaad/manifest.json",
        name: "Adrian",
        gender: "male",
        accent: "american",
      },
      {
        id: "s3://voice-cloning-zero-shot/e040bd1b-f190-4bdb-83f0-75ef85b18f84/oliviasaad/manifest.json",
        name: "Olivia",
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
