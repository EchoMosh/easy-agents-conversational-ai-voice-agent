export interface TranscriberModel {
  id: string;
  name: string;
}

export interface TranscriberProvider {
  id: string;
  name: string;
  models: TranscriberModel[];
  requiresApiKey: boolean;
  description: string;
}

export const TRANSCRIBER_PROVIDERS: TranscriberProvider[] = [
  {
    id: "talkscriber",
    name: "Talkscriber (Built-in)",
    models: [{ id: "whisper", name: "Whisper" }],
    requiresApiKey: false,
    description:
      "Built-in transcription powered by Whisper. No additional API key required.",
  },
  {
    id: "deepgram",
    name: "Deepgram",
    models: [
      { id: "nova-3", name: "Nova 3" },
      { id: "nova-2", name: "Nova 2" },
    ],
    requiresApiKey: false,
    description:
      "High-accuracy real-time transcription with low latency. Supports multiple languages.",
  },
  {
    id: "gladia",
    name: "Gladia",
    models: [{ id: "default", name: "Default" }],
    requiresApiKey: false,
    description:
      "Enterprise-grade speech-to-text with speaker diarization and real-time processing.",
  },
  {
    id: "assembly-ai",
    name: "AssemblyAI",
    models: [
      { id: "best", name: "Best" },
      { id: "nano", name: "Nano" },
    ],
    requiresApiKey: false,
    description:
      "AI-powered transcription with built-in content moderation and topic detection.",
  },
];

export const DEFAULT_TRANSCRIBER_PROVIDER_ID = "talkscriber";
export const DEFAULT_TRANSCRIBER_MODEL_ID = "whisper";

export function getTranscriberProvider(
  providerId: string,
): TranscriberProvider | undefined {
  return TRANSCRIBER_PROVIDERS.find((p) => p.id === providerId);
}
