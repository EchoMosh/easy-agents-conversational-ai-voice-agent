# Agent Settings Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the barebones agent settings dialog (voice + language + coming-soon behavior tab) with a comprehensive settings panel exposing all VAPI configuration options across voice providers, transcriber, LLM, call behavior, and knowledge base.

**Architecture:** Split the monolithic 1000-line `agent-settings.tsx` into focused tab components. Each tab manages its own state slice and passes changes up via a unified settings object. The `update-vapi-agent` edge function receives the full config and maps it to the VAPI API payload. DB stores configs in the existing `voice_config`, `transcriber_config`, `model_config` JSON columns.

**Tech Stack:** React, TypeScript, shadcn/ui, Supabase Edge Functions, VAPI API, Tailwind CSS

---

## File Structure

```
src/components/agents/settings/
  agent-settings-dialog.tsx      — Shell: dialog, tab navigation, save/cancel
  tabs/
    voice-tab.tsx                 — Voice provider, voice ID, emotion, speed, stability
    transcriber-tab.tsx           — Transcriber provider, model, language, endpointing
    llm-tab.tsx                   — LLM provider, model, temperature, maxTokens
    behavior-tab.tsx              — Speaking plan, stop plan, silence timeout, max duration, background sound
    knowledge-tab.tsx             — Knowledge base selector, file upload (extracted from current)
  constants/
    voice-providers.ts            — Provider definitions, voice lists, models
    transcriber-providers.ts      — Transcriber providers and models
    llm-providers.ts              — LLM providers and models
    behavior-defaults.ts          — Default values for all behavior settings
  types.ts                        — AgentSettingsState type combining all configs

supabase/functions/update-vapi-agent/index.ts  — Updated to accept full config
```

**Existing files modified:**

- `src/components/agents/flow/agent-settings.tsx` → Replaced by new `agent-settings-dialog.tsx`
- `src/pages/dashboard/agent-flow/hooks/use-flow-management.ts` → Import path update
- `supabase/functions/update-vapi-agent/index.ts` → Accept new config fields

---

### Task 1: Constants — Voice, Transcriber, LLM Provider Definitions

**Files:**

- Create: `src/components/agents/settings/constants/voice-providers.ts`
- Create: `src/components/agents/settings/constants/transcriber-providers.ts`
- Create: `src/components/agents/settings/constants/llm-providers.ts`
- Create: `src/components/agents/settings/constants/behavior-defaults.ts`

- [ ] **Step 1: Create voice-providers.ts**

```typescript
// src/components/agents/settings/constants/voice-providers.ts

export interface VoiceProviderDef {
  id: string;
  name: string;
  requiresApiKey: boolean;
  models: { id: string; name: string; latency: string }[];
  voices: { id: string; name: string; gender: string; accent?: string }[];
  supportsEmotion: boolean;
  supportsSpeed: boolean;
  supportsStability: boolean;
  emotionOptions?: string[];
}

export const VOICE_PROVIDERS: VoiceProviderDef[] = [
  {
    id: "vapi",
    name: "Built-in (Free)",
    requiresApiKey: false,
    models: [],
    voices: [
      { id: "Elliot", name: "Elliot", gender: "male", accent: "Canadian" },
      { id: "Clara", name: "Clara", gender: "female", accent: "American" },
      { id: "Godfrey", name: "Godfrey", gender: "male", accent: "American" },
      {
        id: "Savannah",
        name: "Savannah",
        gender: "female",
        accent: "Southern",
      },
      { id: "Rohan", name: "Rohan", gender: "male", accent: "Indian American" },
      { id: "Emma", name: "Emma", gender: "female", accent: "Asian American" },
      { id: "Nico", name: "Nico", gender: "male", accent: "American" },
      { id: "Kai", name: "Kai", gender: "male", accent: "American" },
      { id: "Sagar", name: "Sagar", gender: "male", accent: "Indian American" },
      { id: "Neil", name: "Neil", gender: "male", accent: "Indian American" },
      {
        id: "Naina",
        name: "Naina",
        gender: "female",
        accent: "Indian American",
      },
      { id: "Leah", name: "Leah", gender: "female", accent: "American" },
      { id: "Tara", name: "Tara", gender: "female", accent: "American" },
      { id: "Jess", name: "Jess", gender: "female", accent: "American" },
      { id: "Leo", name: "Leo", gender: "male", accent: "American" },
      { id: "Dan", name: "Dan", gender: "male", accent: "American" },
      { id: "Mia", name: "Mia", gender: "female", accent: "American" },
      { id: "Zac", name: "Zac", gender: "male", accent: "American" },
      { id: "Zoe", name: "Zoe", gender: "female", accent: "American" },
    ],
    supportsEmotion: false,
    supportsSpeed: false,
    supportsStability: false,
  },
  {
    id: "cartesia",
    name: "Cartesia",
    requiresApiKey: true,
    models: [
      { id: "sonic-3", name: "Sonic 3", latency: "~90ms" },
      { id: "sonic-turbo", name: "Sonic Turbo", latency: "~40ms" },
    ],
    voices: [], // Loaded dynamically from API key
    supportsEmotion: true,
    supportsSpeed: true,
    supportsStability: false,
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
      { id: "eleven_flash_v2_5", name: "Flash v2.5", latency: "~75ms" },
      { id: "eleven_turbo_v2_5", name: "Turbo v2.5", latency: "~135ms" },
    ],
    voices: [], // Loaded dynamically
    supportsEmotion: false,
    supportsSpeed: false,
    supportsStability: true,
  },
  {
    id: "openai",
    name: "OpenAI",
    requiresApiKey: true,
    models: [
      { id: "gpt-4o-mini-tts", name: "GPT-4o Mini TTS", latency: "~200ms" },
      { id: "tts-1", name: "TTS-1", latency: "~250ms" },
      { id: "tts-1-hd", name: "TTS-1 HD", latency: "~300ms" },
    ],
    voices: [
      { id: "alloy", name: "Alloy", gender: "neutral" },
      { id: "ash", name: "Ash", gender: "male" },
      { id: "coral", name: "Coral", gender: "female" },
      { id: "echo", name: "Echo", gender: "male" },
      { id: "fable", name: "Fable", gender: "neutral" },
      { id: "nova", name: "Nova", gender: "female" },
      { id: "onyx", name: "Onyx", gender: "male" },
      { id: "sage", name: "Sage", gender: "neutral" },
      { id: "shimmer", name: "Shimmer", gender: "female" },
    ],
    supportsEmotion: false,
    supportsSpeed: true,
    supportsStability: false,
  },
  {
    id: "playht",
    name: "PlayHT",
    requiresApiKey: true,
    models: [
      { id: "Play3.0-mini", name: "Play 3.0 Mini", latency: "~143ms" },
      { id: "PlayDialog", name: "PlayDialog", latency: "~200ms" },
    ],
    voices: [], // Loaded dynamically
    supportsEmotion: true,
    supportsSpeed: true,
    supportsStability: false,
    emotionOptions: [
      "female_happy",
      "female_sad",
      "female_angry",
      "female_fearful",
      "male_happy",
      "male_sad",
      "male_angry",
      "male_fearful",
    ],
  },
  {
    id: "rime-ai",
    name: "Rime AI",
    requiresApiKey: true,
    models: [
      { id: "mist", name: "Mist v2", latency: "~70ms" },
      { id: "arcana", name: "Arcana v3 (Emotive)", latency: "~150ms" },
    ],
    voices: [], // Loaded dynamically
    supportsEmotion: true,
    supportsSpeed: true,
    supportsStability: false,
  },
  {
    id: "deepgram",
    name: "Deepgram",
    requiresApiKey: true,
    models: [{ id: "aura-2", name: "Aura 2", latency: "~100ms" }],
    voices: [], // Loaded dynamically
    supportsEmotion: false,
    supportsSpeed: false,
    supportsStability: false,
  },
];

export const getProvider = (id: string) =>
  VOICE_PROVIDERS.find((p) => p.id === id);
```

- [ ] **Step 2: Create transcriber-providers.ts**

```typescript
// src/components/agents/settings/constants/transcriber-providers.ts

export interface TranscriberProviderDef {
  id: string;
  name: string;
  models: { id: string; name: string }[];
  requiresApiKey: boolean;
  description: string;
}

export const TRANSCRIBER_PROVIDERS: TranscriberProviderDef[] = [
  {
    id: "talkscriber",
    name: "Talkscriber (Built-in)",
    models: [{ id: "whisper", name: "Whisper" }],
    requiresApiKey: false,
    description: "Built-in transcriber. No setup needed.",
  },
  {
    id: "deepgram",
    name: "Deepgram",
    models: [
      { id: "nova-3", name: "Nova 3 (Latest)" },
      { id: "nova-2", name: "Nova 2" },
    ],
    requiresApiKey: true,
    description: "Fast and accurate. Best for English.",
  },
  {
    id: "gladia",
    name: "Gladia",
    models: [{ id: "default", name: "Default" }],
    requiresApiKey: true,
    description: "Strong multilingual support.",
  },
  {
    id: "assembly-ai",
    name: "AssemblyAI",
    models: [
      { id: "best", name: "Best" },
      { id: "nano", name: "Nano (Fast)" },
    ],
    requiresApiKey: true,
    description: "High accuracy with speaker diarization.",
  },
];

export const getTranscriber = (id: string) =>
  TRANSCRIBER_PROVIDERS.find((p) => p.id === id);
```

- [ ] **Step 3: Create llm-providers.ts**

```typescript
// src/components/agents/settings/constants/llm-providers.ts

export interface LlmProviderDef {
  id: string;
  name: string;
  models: { id: string; name: string; contextWindow: string }[];
  requiresApiKey: boolean;
}

export const LLM_PROVIDERS: LlmProviderDef[] = [
  {
    id: "groq",
    name: "Groq (Fast)",
    models: [
      {
        id: "llama-3.3-70b-versatile",
        name: "Llama 3.3 70B",
        contextWindow: "128k",
      },
      {
        id: "llama-3.1-8b-instant",
        name: "Llama 3.1 8B (Fastest)",
        contextWindow: "128k",
      },
      { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", contextWindow: "32k" },
    ],
    requiresApiKey: false,
  },
  {
    id: "openai",
    name: "OpenAI",
    models: [
      { id: "gpt-4o", name: "GPT-4o", contextWindow: "128k" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", contextWindow: "128k" },
      { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", contextWindow: "16k" },
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
        contextWindow: "200k",
      },
      {
        id: "claude-haiku-4-5-20251001",
        name: "Claude Haiku 4.5",
        contextWindow: "200k",
      },
    ],
    requiresApiKey: true,
  },
  {
    id: "together-ai",
    name: "Together AI",
    models: [
      {
        id: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        name: "Llama 3.3 70B Turbo",
        contextWindow: "128k",
      },
    ],
    requiresApiKey: true,
  },
];

export const getLlmProvider = (id: string) =>
  LLM_PROVIDERS.find((p) => p.id === id);
```

- [ ] **Step 4: Create behavior-defaults.ts**

```typescript
// src/components/agents/settings/constants/behavior-defaults.ts

export const BACKGROUND_SOUNDS = [
  { id: "off", name: "None" },
  { id: "office", name: "Office" },
  { id: "cafe", name: "Cafe" },
  { id: "nature", name: "Nature" },
] as const;

export const DEFAULT_BEHAVIOR = {
  backgroundSound: "off" as string,
  backgroundDenoisingEnabled: true,
  silenceTimeoutSeconds: 30,
  maxDurationSeconds: 600,
  startSpeakingPlan: {
    waitSeconds: 0.4,
    smartEndpointingEnabled: true,
    transcriptionEndpointingPlan: {
      onPunctuationSeconds: 0.1,
      onNoPunctuationSeconds: 0.8,
      onNumberSeconds: 0.4,
    },
  },
  stopSpeakingPlan: {
    numWords: 2,
    voiceSeconds: 0.2,
    backoffSeconds: 1.0,
  },
  hipaaEnabled: false,
} as const;

export const ENDPOINTING_PRESETS = [
  {
    id: "responsive",
    name: "Responsive (Fast)",
    description: "Agent responds quickly. May cut off slow speakers.",
    config: { waitSeconds: 0.2, onNoPunctuationSeconds: 0.5 },
  },
  {
    id: "balanced",
    name: "Balanced",
    description: "Good balance between speed and listening.",
    config: { waitSeconds: 0.4, onNoPunctuationSeconds: 0.8 },
  },
  {
    id: "patient",
    name: "Patient (Slow)",
    description: "Waits longer before responding. Best for complex topics.",
    config: { waitSeconds: 0.8, onNoPunctuationSeconds: 1.5 },
  },
] as const;
```

- [ ] **Step 5: Commit constants**

```bash
git add src/components/agents/settings/constants/
git commit -m "feat: add voice, transcriber, LLM, and behavior constant definitions for agent settings"
```

---

### Task 2: Shared Types

**Files:**

- Create: `src/components/agents/settings/types.ts`

- [ ] **Step 1: Create unified settings state type**

```typescript
// src/components/agents/settings/types.ts

export interface AgentSettingsState {
  // Voice
  voiceProvider: string;
  voiceId: string;
  voiceModel?: string;
  voiceSpeed?: number; // 0.5 - 2.0
  voiceStability?: number; // 0 - 1 (ElevenLabs)
  voiceSimilarityBoost?: number; // 0 - 1 (ElevenLabs)
  voiceEmotion?: string[]; // Cartesia/PlayHT emotion tags
  voiceStylePrompt?: string; // OpenAI natural language style instruction

  // Transcriber
  transcriberProvider: string;
  transcriberModel: string;
  transcriberLanguage: string;

  // LLM
  llmProvider: string;
  llmModel: string;
  llmTemperature: number; // 0 - 1
  llmMaxTokens: number; // 50 - 1000

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
  voiceEmotion: [],
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
```

- [ ] **Step 2: Commit**

```bash
git add src/components/agents/settings/types.ts
git commit -m "feat: add AgentSettingsState type and defaults"
```

---

### Task 3: Voice Tab Component

**Files:**

- Create: `src/components/agents/settings/tabs/voice-tab.tsx`

- [ ] **Step 1: Build voice tab**

This tab shows:

1. Voice Provider selector (VAPI Built-in, Cartesia, ElevenLabs, OpenAI, PlayHT, Rime, Deepgram)
2. Voice selector (changes based on provider — static list for VAPI/OpenAI, note for others)
3. Conditionally: Model selector (if provider has models)
4. Conditionally: Speed slider (if provider supports it)
5. Conditionally: Stability + Similarity sliders (ElevenLabs)
6. Conditionally: Emotion multi-select (Cartesia/PlayHT)
7. Conditionally: Style prompt textarea (OpenAI)
8. Preview button
9. Language selector

The component receives `settings: AgentSettingsState` and `onChange: (partial: Partial<AgentSettingsState>) => void`.

Key behaviors:

- When provider changes, reset voiceId to the first voice in that provider's list
- When provider changes, reset voiceModel to the first model
- Show latency badge next to model names
- Show gender badges next to voice names
- Provider card shows "Requires API Key" badge if applicable

- [ ] **Step 2: Commit**

```bash
git add src/components/agents/settings/tabs/voice-tab.tsx
git commit -m "feat: add voice tab with provider selection, emotion, speed controls"
```

---

### Task 4: Transcriber Tab Component

**Files:**

- Create: `src/components/agents/settings/tabs/transcriber-tab.tsx`

- [ ] **Step 1: Build transcriber tab**

This tab shows:

1. Transcriber Provider selector (Talkscriber, Deepgram, Gladia, AssemblyAI)
2. Model selector (based on provider)
3. Language selector (shared with voice tab — uses same `language` field)
4. Description text for each provider
5. "Requires API Key" badge where applicable

Simple, focused. Most users will leave this at Talkscriber/Whisper default.

- [ ] **Step 2: Commit**

```bash
git add src/components/agents/settings/tabs/transcriber-tab.tsx
git commit -m "feat: add transcriber tab with provider and model selection"
```

---

### Task 5: LLM Tab Component

**Files:**

- Create: `src/components/agents/settings/tabs/llm-tab.tsx`

- [ ] **Step 1: Build LLM tab**

This tab shows:

1. LLM Provider selector (Groq, OpenAI, Anthropic, Together AI)
2. Model selector (changes based on provider, shows context window badge)
3. Temperature slider (0 - 1, with labels: "Focused" at 0, "Creative" at 1)
4. Max Tokens slider (50 - 1000, with label showing estimated response length)
5. "Requires API Key" badge where applicable

- [ ] **Step 2: Commit**

```bash
git add src/components/agents/settings/tabs/llm-tab.tsx
git commit -m "feat: add LLM tab with provider, model, temperature, token controls"
```

---

### Task 6: Behavior Tab Component

**Files:**

- Create: `src/components/agents/settings/tabs/behavior-tab.tsx`

- [ ] **Step 1: Build behavior tab**

This tab shows:

1. **Response Speed** section — Endpointing preset selector (Responsive / Balanced / Patient) with description
2. **Advanced Endpointing** collapsible — waitSeconds, onPunctuationSeconds, onNoPunctuationSeconds, onNumberSeconds sliders
3. **Interruption Handling** section — stopSpeakingNumWords, voiceSeconds, backoffSeconds
4. **Call Limits** section — silenceTimeoutSeconds (5-120), maxDurationSeconds (60-3600 formatted as minutes)
5. **Ambiance** section — backgroundSound dropdown, backgroundDenoisingEnabled toggle

Each slider shows its current value. Presets auto-fill the advanced values.

- [ ] **Step 2: Commit**

```bash
git add src/components/agents/settings/tabs/behavior-tab.tsx
git commit -m "feat: add behavior tab with endpointing, interruption, call limits, ambiance"
```

---

### Task 7: Knowledge Tab Component (Extract from existing)

**Files:**

- Create: `src/components/agents/settings/tabs/knowledge-tab.tsx`
- Reference: `src/components/agents/flow/agent-settings.tsx` (lines 600-900 approx — knowledge base section)

- [ ] **Step 1: Extract knowledge base UI**

Move the existing knowledge base selector and file upload logic from the old `agent-settings.tsx` into this new focused component. Keep the same functionality:

1. Knowledge Base selector dropdown (None + available KB docs)
2. File upload for creating new knowledge bases
3. Status indicators for upload progress

The component receives `settings: AgentSettingsState`, `onChange`, `agentId: string`, `workspaceId: string`.

- [ ] **Step 2: Commit**

```bash
git add src/components/agents/settings/tabs/knowledge-tab.tsx
git commit -m "feat: extract knowledge tab from monolithic settings"
```

---

### Task 8: Agent Settings Dialog Shell

**Files:**

- Create: `src/components/agents/settings/agent-settings-dialog.tsx`

- [ ] **Step 1: Build dialog shell with tabs**

The shell component:

1. Uses `CustomModal` (same as current)
2. Has 5 tabs: Voice, Transcriber, LLM, Behavior, Knowledge
3. Manages unified `AgentSettingsState` via `useState`
4. On open: loads agent data from Supabase, maps DB fields to `AgentSettingsState`
5. On save: maps `AgentSettingsState` back to DB columns (`voice_config`, `transcriber_config`, `model_config`, etc.), saves to Supabase, calls `onUpdateSettings` callback
6. Cancel reverts to original values
7. Tab icons: Mic (Voice), AudioLines (Transcriber), Brain (LLM), Settings2 (Behavior), BookOpen (Knowledge)

Props match current `AgentSettingsProps` interface for drop-in replacement.

- [ ] **Step 2: Wire up data loading**

On dialog open, fetch agent from Supabase and hydrate `AgentSettingsState`:

```typescript
// Map DB → state
const settings: AgentSettingsState = {
  voiceProvider: agent.voice_config?.provider || "vapi",
  voiceId: agent.voice_id || "Elliot",
  voiceModel: agent.voice_config?.model,
  transcriberProvider: agent.transcriber_config?.provider || "talkscriber",
  transcriberModel: agent.transcriber_config?.model || "whisper",
  llmProvider: agent.model_config?.provider || "groq",
  llmModel: agent.model_config?.model || "llama-3.3-70b-versatile",
  llmTemperature: agent.model_config?.temperature ?? 0.3,
  llmMaxTokens: agent.model_config?.maxTokens ?? 250,
  backgroundSound: agent.background_sound || "off",
  maxDurationSeconds: agent.max_duration_seconds || 600,
  language: agent.language || "en",
  knowledgeBaseId: agent.vapi_knowledge_base_id || null,
  // ... rest from defaults
};
```

- [ ] **Step 3: Wire up save**

On save, map state back to DB columns:

```typescript
const updates = {
  voice_id: settings.voiceId,
  language: settings.language,
  background_sound: settings.backgroundSound,
  max_duration_seconds: settings.maxDurationSeconds,
  voice_config: {
    provider: settings.voiceProvider,
    voiceId: settings.voiceId,
    model: settings.voiceModel,
    speed: settings.voiceSpeed,
    stability: settings.voiceStability,
    similarityBoost: settings.voiceSimilarityBoost,
    emotion: settings.voiceEmotion,
    stylePrompt: settings.voiceStylePrompt,
  },
  transcriber_config: {
    provider: settings.transcriberProvider,
    model: settings.transcriberModel,
    language: settings.transcriberLanguage,
  },
  model_config: {
    provider: settings.llmProvider,
    model: settings.llmModel,
    temperature: settings.llmTemperature,
    maxTokens: settings.llmMaxTokens,
    knowledgeBaseId: settings.knowledgeBaseId,
  },
};
await supabase.from("agents").update(updates).eq("id", agentId);
```

- [ ] **Step 4: Commit**

```bash
git add src/components/agents/settings/agent-settings-dialog.tsx
git commit -m "feat: add agent settings dialog shell with tab navigation and data persistence"
```

---

### Task 9: Update Edge Function to Use Full Config

**Files:**

- Modify: `supabase/functions/update-vapi-agent/index.ts`

- [ ] **Step 1: Expand request interface**

Add new fields to the request body:

```typescript
interface UpdateVapiAgentRequest {
  agent_id: string;
  v_agent_id: string;
  // Voice
  voice_provider: string;
  voice_id: string;
  voice_model?: string;
  voice_speed?: number;
  voice_stability?: number;
  voice_similarity_boost?: number;
  voice_emotion?: string[];
  voice_style_prompt?: string;
  // Transcriber
  transcriber_provider: string;
  transcriber_model: string;
  // LLM
  llm_provider: string;
  llm_model: string;
  llm_temperature: number;
  llm_max_tokens: number;
  // Behavior
  background_sound: string;
  background_denoising_enabled: boolean;
  silence_timeout_seconds: number;
  max_duration_seconds: number;
  start_speaking_wait_seconds: number;
  smart_endpointing_enabled: boolean;
  on_punctuation_seconds: number;
  on_no_punctuation_seconds: number;
  on_number_seconds: number;
  stop_speaking_num_words: number;
  stop_speaking_voice_seconds: number;
  stop_speaking_backoff_seconds: number;
  // Existing
  language: string;
  first_message: string;
  mermaid_chart: string;
  knowledge_base_id?: string;
}
```

- [ ] **Step 2: Build dynamic VAPI payload**

Map the request fields to the correct VAPI API shape based on provider:

```typescript
// Voice payload varies by provider
const voicePayload: Record<string, unknown> = {
  provider: voice_provider || "vapi",
  voiceId: voice_id || "Elliot",
};
if (voice_model) voicePayload.model = voice_model;
if (voice_provider === "elevenlabs") {
  if (voice_stability !== undefined) voicePayload.stability = voice_stability;
  if (voice_similarity_boost !== undefined)
    voicePayload.similarityBoost = voice_similarity_boost;
}
if (
  voice_speed !== undefined &&
  ["cartesia", "playht", "openai"].includes(voice_provider)
) {
  voicePayload.speed = voice_speed;
}
if (voice_emotion?.length && ["cartesia", "playht"].includes(voice_provider)) {
  voicePayload.emotion = voice_emotion;
}
// Chunk plan for all providers
voicePayload.chunkPlan = {
  enabled: true,
  minCharacters: 30,
  punctuationBoundaries: [".", "!", "?", ","],
};

// Transcriber payload
const transcriberPayload = {
  provider: transcriber_provider || "talkscriber",
  model: transcriber_model || "whisper",
  language: language || "en",
};

// Model payload
const modelPayload = {
  provider: llm_provider || "groq",
  model: llm_model || "llama-3.3-70b-versatile",
  temperature: llm_temperature ?? 0.3,
  maxTokens: llm_max_tokens ?? 250,
  messages: [{ role: "system", content: systemPrompt }],
  ...(knowledge_base_id && { knowledgeBaseId: knowledge_base_id }),
};
```

- [ ] **Step 3: Deploy**

```bash
supabase functions deploy update-vapi-agent --no-verify-jwt
```

- [ ] **Step 4: Commit**

```bash
git add supabase/functions/update-vapi-agent/index.ts
git commit -m "feat: update-vapi-agent accepts full voice/transcriber/LLM/behavior config"
```

---

### Task 10: Swap Old Component for New

**Files:**

- Modify: `src/pages/dashboard/agent-flow/agent-flow-page.tsx` (or wherever `AgentSettings` is imported)
- Modify: `src/pages/dashboard/agent-flow/hooks/use-flow-management.ts`

- [ ] **Step 1: Find all imports of old AgentSettings**

```bash
grep -rn "from.*agent-settings" src/ --include="*.tsx" --include="*.ts"
```

- [ ] **Step 2: Update imports**

Replace:

```typescript
import { AgentSettings } from "@/components/agents/flow/agent-settings";
```

With:

```typescript
import { AgentSettings } from "@/components/agents/settings/agent-settings-dialog";
```

Keep the old file as `agent-settings-old.tsx` until verified working. The new component uses the same props interface so it's a drop-in replacement.

- [ ] **Step 3: Update onUpdateSettings callback**

The callback in `use-flow-management.ts` that calls `update-vapi-agent` needs to pass the full settings. Read the agent's `voice_config`, `transcriber_config`, `model_config` from DB and include them in the edge function call body.

- [ ] **Step 4: Commit**

```bash
git add src/
git commit -m "feat: swap old agent settings for new comprehensive settings dialog"
```

---

### Task 11: Update test-agent-dialog and launch-agent-dialog

**Files:**

- Modify: `src/components/agents/test-agent-dialog.tsx`
- Modify: `src/components/agents/launch-agent-dialog.tsx`

- [ ] **Step 1: Read agent config from DB before calling edge function**

Both dialogs call `update-vapi-agent`. Update them to read the agent's `voice_config`, `transcriber_config`, `model_config` from DB and pass them to the edge function:

```typescript
// In sendAgentDataToWebhookInternal():
const { data: agentFull } = await supabase
  .from("agents")
  .select("voice_config, transcriber_config, model_config, background_sound")
  .eq("id", currentAgentData.id)
  .single();

const voiceConfig = agentFull?.voice_config as any || {};
const transcriberConfig = agentFull?.transcriber_config as any || {};
const modelConfig = agentFull?.model_config as any || {};

// Add to edge function body:
voice_provider: voiceConfig.provider || "vapi",
voice_id: voiceIdForPayload,
voice_model: voiceConfig.model,
voice_stability: voiceConfig.stability,
voice_similarity_boost: voiceConfig.similarityBoost,
voice_emotion: voiceConfig.emotion,
transcriber_provider: transcriberConfig.provider || "talkscriber",
transcriber_model: transcriberConfig.model || "whisper",
llm_provider: modelConfig.provider || "groq",
llm_model: modelConfig.model || "llama-3.3-70b-versatile",
llm_temperature: modelConfig.temperature ?? 0.3,
llm_max_tokens: modelConfig.maxTokens ?? 250,
```

- [ ] **Step 2: Update voice call transcriber override**

In `agent-voice-call.tsx`, read the agent's `transcriber_config` and use it in the `vapi.start()` override instead of hardcoding talkscriber:

```typescript
await vapiRef.current.start(assistantId, {
  transcriber: {
    provider: agent.transcriber_config?.provider || "talkscriber",
    model: agent.transcriber_config?.model || "whisper",
    language: agent.language || "en",
  },
});
```

- [ ] **Step 3: Commit**

```bash
git add src/components/agents/test-agent-dialog.tsx src/components/agents/launch-agent-dialog.tsx src/components/agents/voice-call/agent-voice-call.tsx
git commit -m "feat: test/launch dialogs pass full agent config to edge function"
```

---

### Task 12: Clean Up Old File

**Files:**

- Delete: `src/components/agents/flow/agent-settings.tsx` (after verifying new one works)

- [ ] **Step 1: Verify new settings dialog works end-to-end**

Manual verification:

1. Open agent flow editor
2. Click settings gear icon
3. All 5 tabs render and are interactive
4. Change voice provider to Cartesia — emotion controls appear
5. Change to ElevenLabs — stability/similarity sliders appear
6. Behavior tab shows endpointing presets and sliders
7. Save — verify DB is updated with `voice_config`, `transcriber_config`, `model_config`
8. Test Agent — verify edge function receives full config
9. Voice call connects with selected transcriber

- [ ] **Step 2: Remove old file**

```bash
rm src/components/agents/flow/agent-settings.tsx
git add -u
git commit -m "chore: remove old monolithic agent settings component"
```
