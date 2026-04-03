export interface VoiceOption {
  id: string;
  name: string;
  gender: "male" | "female" | "neutral";
  accent?: string;
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
    requiresApiKey: true,
    models: [
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
    requiresApiKey: true,
    models: [
      { id: "eleven_turbo_v2_5", name: "Turbo v2.5", latency: "low" },
      { id: "eleven_turbo_v2", name: "Turbo v2", latency: "low" },
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
    requiresApiKey: true,
    models: [
      { id: "tts-1", name: "TTS-1", latency: "low" },
      { id: "tts-1-hd", name: "TTS-1 HD", latency: "medium" },
    ],
    voices: [
      { id: "alloy", name: "Alloy", gender: "neutral" },
      { id: "ash", name: "Ash", gender: "male" },
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
    requiresApiKey: true,
    models: [
      { id: "PlayHT2.0-turbo", name: "PlayHT 2.0 Turbo", latency: "low" },
      { id: "PlayHT2.0", name: "PlayHT 2.0", latency: "medium" },
      { id: "Play3.0-mini", name: "Play 3.0 Mini", latency: "low" },
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
    requiresApiKey: true,
    models: [
      { id: "mist", name: "Mist", latency: "low" },
      { id: "v1", name: "V1", latency: "medium" },
    ],
    voices: [
      { id: "amber", name: "Amber", gender: "female", accent: "american" },
      { id: "dustin", name: "Dustin", gender: "male", accent: "american" },
      { id: "grove", name: "Grove", gender: "male", accent: "american" },
      { id: "sierra", name: "Sierra", gender: "female", accent: "american" },
      { id: "pearl", name: "Pearl", gender: "female", accent: "british" },
      { id: "marsh", name: "Marsh", gender: "male", accent: "british" },
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
    requiresApiKey: true,
    models: [{ id: "aura", name: "Aura", latency: "low" }],
    voices: [
      {
        id: "asteria-en",
        name: "Asteria",
        gender: "female",
        accent: "american",
      },
      { id: "luna-en", name: "Luna", gender: "female", accent: "american" },
      { id: "stella-en", name: "Stella", gender: "female", accent: "american" },
      { id: "athena-en", name: "Athena", gender: "female", accent: "british" },
      { id: "hera-en", name: "Hera", gender: "female", accent: "american" },
      { id: "orion-en", name: "Orion", gender: "male", accent: "american" },
      { id: "arcas-en", name: "Arcas", gender: "male", accent: "american" },
      { id: "perseus-en", name: "Perseus", gender: "male", accent: "american" },
      { id: "angus-en", name: "Angus", gender: "male", accent: "irish" },
      { id: "orpheus-en", name: "Orpheus", gender: "male", accent: "american" },
      { id: "helios-en", name: "Helios", gender: "male", accent: "british" },
      { id: "zeus-en", name: "Zeus", gender: "male", accent: "american" },
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
