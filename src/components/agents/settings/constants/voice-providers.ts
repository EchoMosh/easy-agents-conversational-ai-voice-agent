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
    // Voices pulled live from https://api.cartesia.ai/voices?limit=500
    // on 2026-04-09 using a real Cartesia API key. All UUIDs are verified
    // English public voices from Cartesia's Voice Library. Gender comes
    // from Cartesia's own metadata (feminine/masculine).
    // To refresh: invoke the fetch-voice-library edge function with
    // {"provider":"cartesia"} (requires CARTESIA_API_KEY secret set).
    voices: [
      // Legacy verified (kept for backward compat with existing agents)
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
      // === Females (live Cartesia library) ===
      {
        id: "e07c00bc-4134-4eae-9ea4-1a55fb45746b",
        name: "Brooke",
        gender: "female",
        accent: "american",
      },
      {
        id: "f786b574-daa5-4673-aa0c-cbe3e8534c02",
        name: "Katie",
        gender: "female",
        accent: "american",
      },
      {
        id: "9626c31c-bec5-4cca-baa8-f8ba9e84c8bc",
        name: "Jacqueline",
        gender: "female",
        accent: "american",
      },
      {
        id: "f9836c6e-a0bd-460e-9d3c-f7299fa60f94",
        name: "Caroline",
        gender: "female",
        accent: "american",
      },
      {
        id: "e8e5fffb-252c-436d-b842-8879b84445b6",
        name: "Cathy",
        gender: "female",
        accent: "american",
      },
      {
        id: "62ae83ad-4f6a-430b-af41-a9bede9286ca",
        name: "Gemma",
        gender: "female",
        accent: "american",
      },
      {
        id: "db6b0ed5-d5d3-463d-ae85-518a07d3c2b4",
        name: "Skylar",
        gender: "female",
        accent: "american",
      },
      {
        id: "2f251ac3-89a9-4a77-a452-704b474ccd01",
        name: "Lucy",
        gender: "female",
        accent: "american",
      },
      {
        id: "a4a16c5e-5902-4732-b9b6-2a48efd2e11b",
        name: "Grace",
        gender: "female",
        accent: "american",
      },
      {
        id: "a33f7a4c-100f-41cf-a1fd-5822e8fc253f",
        name: "Lauren",
        gender: "female",
        accent: "american",
      },
      {
        id: "1242fb95-7ddd-44ac-8a05-9e8a22a6137d",
        name: "Cindy",
        gender: "female",
        accent: "american",
      },
      {
        id: "dc30854e-e398-4579-9dc8-16f6cb2c19b9",
        name: "Victoria",
        gender: "female",
        accent: "american",
      },
      {
        id: "263b9cc0-0d99-44e7-ae92-3d4ad5d2ad18",
        name: "Zanele",
        gender: "female",
        accent: "american",
      },
      {
        id: "d1d9c946-7cfc-4378-85a4-07d09827cb7e",
        name: "Jolene",
        gender: "female",
        accent: "american",
      },
      {
        id: "0ee8beaa-db49-4024-940d-c7ea09b590b3",
        name: "Morgan",
        gender: "female",
        accent: "american",
      },
      {
        id: "692846ad-1a6b-49b8-bfc5-86421fd41a19",
        name: "Thandi",
        gender: "female",
        accent: "american",
      },
      {
        id: "d79d2b77-9192-4e10-9407-5d43ca034803",
        name: "Siobhan",
        gender: "female",
        accent: "american",
      },
      {
        id: "e5d4c33a-d8f6-46e8-a10f-b5afecc35648",
        name: "Evie",
        gender: "female",
        accent: "american",
      },
      // === Males (live Cartesia library) ===
      {
        id: "5ee9feff-1265-424a-9d7f-8e4d431a12c7",
        name: "Ronald",
        gender: "male",
        accent: "american",
      },
      {
        id: "a167e0f3-df7e-4d52-a9c3-f949145efdab",
        name: "Blake",
        gender: "male",
        accent: "american",
      },
      {
        id: "79f8b5fb-2cc8-479a-80df-29f7a7cf1a3e",
        name: "Theo",
        gender: "male",
        accent: "american",
      },
      {
        id: "a5136bf9-224c-4d76-b823-52bd5efcffcc",
        name: "Jameson",
        gender: "male",
        accent: "american",
      },
      {
        id: "ee7ea9f8-c0c1-498c-9279-764d6b56d189",
        name: "Oliver",
        gender: "male",
        accent: "american",
      },
      {
        id: "86e30c1d-714b-4074-a1f2-1cb6b552fb49",
        name: "Carson",
        gender: "male",
        accent: "american",
      },
      {
        id: "4bc3cb8c-adb9-4bb8-b5d5-cbbef950b991",
        name: "George",
        gender: "male",
        accent: "american",
      },
      {
        id: "87286a8d-7ea7-4235-a41a-dd9fa6630feb",
        name: "Henry",
        gender: "male",
        accent: "american",
      },
      {
        id: "4f7f1324-1853-48a6-b294-4e78e8036a83",
        name: "Casper",
        gender: "male",
        accent: "american",
      },
      {
        id: "c8f7835e-28a3-4f0c-80d7-c1302ac62aae",
        name: "Alistair",
        gender: "male",
        accent: "american",
      },
      {
        id: "0ad65e7f-006c-47cf-bd31-52279d487913",
        name: "Rupert",
        gender: "male",
        accent: "american",
      },
      {
        id: "47c38ca4-5f35-497b-b1a3-415245fb35e1",
        name: "Daniel",
        gender: "male",
        accent: "american",
      },
      {
        id: "3e39e9a5-585c-4f5f-bac6-5e4905c51095",
        name: "Cole",
        gender: "male",
        accent: "american",
      },
      {
        id: "baf84392-fa95-4d44-8871-d32ee36b0e01",
        name: "Pieter",
        gender: "male",
        accent: "american",
      },
      {
        id: "1ec736fa-db96-4eea-9299-235ce2cb7a0e",
        name: "Conor",
        gender: "male",
        accent: "american",
      },
      {
        id: "3c0f09d6-e0d7-499c-a594-70c5b7b93048",
        name: "Benedict",
        gender: "male",
        accent: "american",
      },
      {
        id: "df89f42f-f285-4613-adbf-14eedcec4c9e",
        name: "Harrison",
        gender: "male",
        accent: "american",
      },
      {
        id: "3d5ce2fb-e56c-42f0-9ed9-4662484063b4",
        name: "Toby",
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
    // CORRECTED: VAPI's Deepgram schema uses BARE voice names, NOT the
    // full Deepgram model string. Sending "aura-2-thalia-en" or even
    // "thalia-en" gets rejected with "voice.voiceId must be one of:
    // luna, thalia, andromeda...". VAPI handles the internal mapping.
    models: [
      { id: "aura-2", name: "Aura 2", latency: "low" },
      { id: "aura", name: "Aura (legacy)", latency: "low" },
    ],
    voices: [
      // === AURA 2 — female ===
      {
        id: "thalia",
        name: "Thalia",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "andromeda",
        name: "Andromeda",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "helena",
        name: "Helena",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "cora",
        name: "Cora",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "cordelia",
        name: "Cordelia",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "phoebe",
        name: "Phoebe",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "amalthea",
        name: "Amalthea",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "aurora",
        name: "Aurora",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "callista",
        name: "Callista",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "delia",
        name: "Delia",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "harmonia",
        name: "Harmonia",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "iris",
        name: "Iris",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "juno",
        name: "Juno",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "minerva",
        name: "Minerva",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "ophelia",
        name: "Ophelia",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "pandora",
        name: "Pandora",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "selene",
        name: "Selene",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "theia",
        name: "Theia",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "vesta",
        name: "Vesta",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      // === AURA 2 — male ===
      {
        id: "apollo",
        name: "Apollo",
        gender: "male",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "aries",
        name: "Aries",
        gender: "male",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "atlas",
        name: "Atlas",
        gender: "male",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "hermes",
        name: "Hermes",
        gender: "male",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "hyperion",
        name: "Hyperion",
        gender: "male",
        accent: "australian",
        compatibleModels: ["aura-2"],
      },
      {
        id: "janus",
        name: "Janus",
        gender: "male",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "jupiter",
        name: "Jupiter",
        gender: "male",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "mars",
        name: "Mars",
        gender: "male",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "neptune",
        name: "Neptune",
        gender: "male",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "odysseus",
        name: "Odysseus",
        gender: "male",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "pluto",
        name: "Pluto",
        gender: "male",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "saturn",
        name: "Saturn",
        gender: "male",
        accent: "american",
        compatibleModels: ["aura-2"],
      },
      {
        id: "draco",
        name: "Draco",
        gender: "male",
        accent: "british",
        compatibleModels: ["aura-2"],
      },
      // === AURA 1 (legacy) ===
      {
        id: "asteria",
        name: "Asteria",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura"],
      },
      {
        id: "luna",
        name: "Luna",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura"],
      },
      {
        id: "stella",
        name: "Stella",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura"],
      },
      {
        id: "athena",
        name: "Athena",
        gender: "female",
        accent: "british",
        compatibleModels: ["aura"],
      },
      {
        id: "hera",
        name: "Hera",
        gender: "female",
        accent: "american",
        compatibleModels: ["aura"],
      },
      {
        id: "orion",
        name: "Orion",
        gender: "male",
        accent: "american",
        compatibleModels: ["aura"],
      },
      {
        id: "arcas",
        name: "Arcas",
        gender: "male",
        accent: "american",
        compatibleModels: ["aura"],
      },
      {
        id: "perseus",
        name: "Perseus",
        gender: "male",
        accent: "american",
        compatibleModels: ["aura"],
      },
      {
        id: "angus",
        name: "Angus",
        gender: "male",
        accent: "irish",
        compatibleModels: ["aura"],
      },
      {
        id: "orpheus",
        name: "Orpheus",
        gender: "male",
        accent: "american",
        compatibleModels: ["aura"],
      },
      {
        id: "helios",
        name: "Helios",
        gender: "male",
        accent: "british",
        compatibleModels: ["aura"],
      },
      {
        id: "zeus",
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
