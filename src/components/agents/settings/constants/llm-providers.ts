export interface LLMModel {
  id: string;
  name: string;
  contextWindow: number;
}

export interface LLMProvider {
  id: string;
  name: string;
  models: LLMModel[];
  requiresApiKey: boolean;
}

export const LLM_PROVIDERS: LLMProvider[] = [
  {
    id: "groq",
    name: "Groq",
    models: [
      {
        id: "llama-3.3-70b-versatile",
        name: "Llama 3.3 70B",
        contextWindow: 128000,
      },
      {
        id: "llama-3.1-8b-instant",
        name: "Llama 3.1 8B",
        contextWindow: 128000,
      },
      { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", contextWindow: 32768 },
    ],
    requiresApiKey: true,
  },
  {
    id: "openai",
    name: "OpenAI",
    models: [
      { id: "gpt-4o", name: "GPT-4o", contextWindow: 128000 },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", contextWindow: 128000 },
    ],
    requiresApiKey: true,
  },
  {
    id: "anthropic",
    name: "Anthropic",
    models: [
      {
        id: "claude-sonnet-4-6",
        name: "Claude Sonnet 4.6",
        contextWindow: 200000,
      },
      {
        id: "claude-haiku-4-5",
        name: "Claude Haiku 4.5",
        contextWindow: 200000,
      },
    ],
    requiresApiKey: true,
  },
  {
    id: "together-ai",
    name: "Together AI",
    models: [
      {
        id: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
        name: "Llama 3.1 70B Turbo",
        contextWindow: 128000,
      },
      {
        id: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
        name: "Llama 3.1 8B Turbo",
        contextWindow: 128000,
      },
      {
        id: "mistralai/Mixtral-8x7B-Instruct-v0.1",
        name: "Mixtral 8x7B",
        contextWindow: 32768,
      },
    ],
    requiresApiKey: true,
  },
];

export const DEFAULT_LLM_PROVIDER_ID = "openai";
export const DEFAULT_LLM_MODEL_ID = "gpt-4o";

export function getLLMProvider(providerId: string): LLMProvider | undefined {
  return LLM_PROVIDERS.find((p) => p.id === providerId);
}

export function getLLMModel(
  providerId: string,
  modelId: string,
): LLMModel | undefined {
  const provider = getLLMProvider(providerId);
  return provider?.models.find((m) => m.id === modelId);
}
