export interface AgentSettingsState {
  // Voice
  voiceProvider: string;
  voiceId: string;
  voiceModel?: string;
  voiceSpeed?: number;
  voiceStability?: number;
  voiceSimilarityBoost?: number;
  voiceEmotions?: string[];
  voiceStylePrompt?: string;

  // Transcriber
  transcriberProvider: string;
  transcriberModel: string;
  transcriberLanguage: string;

  // LLM
  llmProvider: string;
  llmModel: string;
  llmTemperature: number;
  llmMaxTokens: number;

  // Behavior
  backgroundSound: string;
  backgroundDenoisingEnabled: boolean;
  silenceTimeoutSeconds: number;
  maxDurationSeconds: number;
  startSpeakingWaitSeconds: number;
  smartEndpointingEnabled: boolean;
  onPunctuationSeconds: number;
  onNoPunctuationSeconds: number;
  onNumberSeconds: number;
  stopSpeakingNumWords: number;
  stopSpeakingVoiceSeconds: number;
  stopSpeakingBackoffSeconds: number;

  // Knowledge
  knowledgeBaseId: string | null;

  // Language
  language: string;
}

export const DEFAULT_SETTINGS: AgentSettingsState = {
  voiceProvider: "vapi",
  voiceId: "Elliot",
  voiceModel: undefined,
  voiceSpeed: 1.0,
  voiceStability: 0.5,
  voiceSimilarityBoost: 0.75,
  voiceEmotions: [],
  voiceStylePrompt: "",
  transcriberProvider: "talkscriber",
  transcriberModel: "whisper",
  transcriberLanguage: "en",
  llmProvider: "groq",
  llmModel: "llama-3.3-70b-versatile",
  llmTemperature: 0.3,
  llmMaxTokens: 250,
  backgroundSound: "off",
  backgroundDenoisingEnabled: true,
  silenceTimeoutSeconds: 30,
  maxDurationSeconds: 600,
  startSpeakingWaitSeconds: 0.4,
  smartEndpointingEnabled: true,
  onPunctuationSeconds: 0.1,
  onNoPunctuationSeconds: 0.8,
  onNumberSeconds: 0.4,
  stopSpeakingNumWords: 2,
  stopSpeakingVoiceSeconds: 0.2,
  stopSpeakingBackoffSeconds: 1.0,
  knowledgeBaseId: null,
  language: "en",
};
