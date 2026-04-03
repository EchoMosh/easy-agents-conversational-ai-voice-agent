# VAPI Assistant Configuration - Complete Reference

> Compiled from official VAPI documentation, API schemas, and Swagger specs.
> Last updated: April 2026

---

## Table of Contents

1. [Top-Level Assistant Properties](#1-top-level-assistant-properties)
2. [Transcriber Options](#2-transcriber-options)
3. [Voice Options](#3-voice-options)
4. [Model / LLM Options](#4-model--llm-options)
5. [Call Behavior Settings](#5-call-behavior-settings)
6. [Speaking Plans](#6-speaking-plans)
7. [Chunk Plan & Format Plan](#7-chunk-plan--format-plan)
8. [Emotional / Realistic Voice Controls](#8-emotional--realistic-voice-controls)
9. [Artifact Plan (Recording/Logging)](#9-artifact-plan)
10. [Analysis Plan](#10-analysis-plan)
11. [Voicemail Detection](#11-voicemail-detection)
12. [Knowledge Base](#12-knowledge-base)
13. [Compliance & Security](#13-compliance--security)
14. [Monitor Plan](#14-monitor-plan)
15. [Hooks](#15-hooks)

---

## 1. Top-Level Assistant Properties

These are the root-level fields on a VAPI assistant object (`POST https://api.vapi.ai/assistant`).

| Property                           | Type     | Default                           | Description                                                                                                       |
| ---------------------------------- | -------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `name`                             | string   | -                                 | Name of the assistant. Required for transfer between assistants.                                                  |
| `firstMessage`                     | string   | -                                 | First message the assistant says (text or URL to audio file).                                                     |
| `firstMessageMode`                 | enum     | `"assistant-speaks-first"`        | `"assistant-speaks-first"`, `"assistant-speaks-first-with-model-generated-message"`, `"assistant-waits-for-user"` |
| `firstMessageInterruptionsEnabled` | boolean  | `false`                           | Whether the user can interrupt the first message.                                                                 |
| `voicemailMessage`                 | string   | -                                 | Message spoken if call forwards to voicemail. Hangs up if unset.                                                  |
| `endCallMessage`                   | string   | -                                 | Message spoken when assistant ends the call. Hangs up silently if unset.                                          |
| `endCallPhrases`                   | string[] | -                                 | Phrases that trigger hangup (case insensitive).                                                                   |
| `transcriber`                      | object   | -                                 | Transcriber/STT configuration (see Section 2).                                                                    |
| `model`                            | object   | -                                 | LLM configuration (see Section 4).                                                                                |
| `voice`                            | object   | -                                 | Voice/TTS configuration (see Section 3).                                                                          |
| `startSpeakingPlan`                | object   | -                                 | When the assistant starts speaking (see Section 6).                                                               |
| `stopSpeakingPlan`                 | object   | -                                 | When the assistant stops on interruption (see Section 6).                                                         |
| `backgroundSound`                  | string   | `"office"` (phone), `"off"` (web) | Background sound. Values: `"off"`, `"office"`, or a URL to custom audio.                                          |
| `backgroundDenoisingEnabled`       | boolean  | `false`                           | Enables noise filtering from user audio.                                                                          |
| `backgroundSpeechDenoisingPlan`    | object   | -                                 | Configuration for filtering background speech/noise.                                                              |
| `silenceTimeoutSeconds`            | number   | `30`                              | Seconds of silence before ending the call.                                                                        |
| `maxDurationSeconds`               | number   | `600`                             | Maximum call duration in seconds. Range: 10-43200.                                                                |
| `clientMessages`                   | string[] | (predefined list)                 | Message types sent to Client SDKs.                                                                                |
| `serverMessages`                   | string[] | (predefined list)                 | Message types sent to your Server URL.                                                                            |
| `server`                           | object   | -                                 | Server URL configuration for webhooks (`server.url`). Highest precedence.                                         |
| `metadata`                         | object   | -                                 | Custom metadata key-value pairs stored with assistant.                                                            |
| `credentialIds`                    | string[] | -                                 | Subset of credentials available for this assistant's calls.                                                       |
| `transportConfigurations`          | object[] | -                                 | Transport provider configs (e.g., Twilio).                                                                        |
| `observabilityPlan`                | object   | -                                 | Observability integration (e.g., Langfuse).                                                                       |
| `artifactPlan`                     | object   | -                                 | Recording, logging, transcript config (see Section 9).                                                            |
| `analysisPlan`                     | object   | -                                 | Post-call analysis config (see Section 10).                                                                       |
| `messagePlan`                      | object   | -                                 | Message formatting configuration.                                                                                 |
| `voicemailDetection`               | object   | -                                 | Voicemail detection config (see Section 11).                                                                      |
| `compliancePlan`                   | object   | -                                 | HIPAA/PCI compliance settings (see Section 13).                                                                   |
| `monitorPlan`                      | object   | -                                 | Real-time call monitoring (see Section 14).                                                                       |
| `hooks`                            | object[] | -                                 | Event-driven actions (see Section 15).                                                                            |
| `keypadInputPlan`                  | object   | -                                 | DTMF/keypad input handling config.                                                                                |
| `modelOutputInMessagesEnabled`     | boolean  | `false`                           | Whether model output is used in conversation history.                                                             |
| `credentials`                      | object[] | -                                 | Dynamic credentials for this assistant's calls.                                                                   |

---

## 2. Transcriber Options

### Supported Providers

| Provider     | Key                    | Notable Feature                              |
| ------------ | ---------------------- | -------------------------------------------- |
| Deepgram     | `"deepgram"`           | Most popular, Flux models with EOT detection |
| AssemblyAI   | `"assembly-ai"`        | Universal streaming, keyterms prompt         |
| Gladia       | `"gladia"`             | Multi-language, prosody (laugh detection)    |
| Google       | `"google"`             | Gemini-based transcription                   |
| Azure Speech | `"azure"`              | 60+ languages, segmentation strategies       |
| ElevenLabs   | `"elevenlabs"`         | Scribe models                                |
| OpenAI       | `"openai"`             | GPT-4o transcribe models                     |
| Speechmatics | `"speechmatics"`       | Diarization, custom vocabulary               |
| Talkscriber  | `"talkscriber"`        | Whisper-based                                |
| Cartesia     | `"cartesia"`           | Ink-Whisper model                            |
| Soniox       | `"soniox"`             | Ultra-low latency                            |
| Custom       | `"custom-transcriber"` | Your own WebSocket STT server                |

### Common Transcriber Properties

| Property              | Type   | Default  | Description                                       |
| --------------------- | ------ | -------- | ------------------------------------------------- |
| `provider`            | string | required | The transcriber provider identifier.              |
| `model`               | string | varies   | Provider-specific model name.                     |
| `language`            | string | varies   | Language code for transcription.                  |
| `confidenceThreshold` | number | `0.4`    | Minimum confidence to accept transcription (0-1). |
| `fallbackPlan`        | object | -        | Array of fallback transcribers if primary fails.  |

### Deepgram-Specific

| Property              | Type     | Default    | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------- | -------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `model`               | enum     | `"nova-2"` | `"nova-3"`, `"nova-3-general"`, `"nova-3-medical"`, `"nova-2"`, `"nova-2-general"`, `"nova-2-meeting"`, `"nova-2-phonecall"`, `"nova-2-finance"`, `"nova-2-conversationalai"`, `"nova-2-voicemail"`, `"nova-2-video"`, `"nova-2-medical"`, `"nova-2-drivethru"`, `"nova-2-automotive"`, `"enhanced"`, `"enhanced-general"`, `"enhanced-meeting"`, `"enhanced-phonecall"`, `"enhanced-finance"`, `"base"`, `"base-general"`, `"base-meeting"`, `"base-phonecall"`, `"base-finance"`, `"base-conversationalai"`, `"base-voicemail"`, `"base-video"`, `"whisper-tiny"`, `"whisper-small"`, `"whisper-base"`, `"whisper-medium"`, `"whisper-large"`, `"flux-general-en"` |
| `language`            | enum     | `"en"`     | 30+ language codes: `"bg"`, `"ca"`, `"cs"`, `"da"`, `"de"`, `"el"`, `"en"`, `"en-US"`, `"en-AU"`, `"en-GB"`, `"en-IN"`, `"en-NZ"`, `"es"`, `"es-419"`, `"et"`, `"fi"`, `"fr"`, `"fr-CA"`, `"hi"`, `"hu"`, `"id"`, `"it"`, `"ja"`, `"ko"`, `"lt"`, `"lv"`, `"ms"`, `"multi"`, `"nl"`, `"no"`, `"pl"`, `"pt"`, `"pt-BR"`, `"ro"`, `"ru"`, `"sk"`, `"sv"`, `"th"`, `"tr"`, `"uk"`, `"vi"`, `"zh"`, `"zh-CN"`, `"zh-Hans"`, `"zh-Hant"`, `"zh-TW"`                                                                                                                                                                                                                       |
| `smartFormat`         | boolean  | `false`    | Smart formatting for numbers, dates, etc. Can sometimes misformat.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `mipOptOut`           | boolean  | `false`    | Opt out of Deepgram Model Improvement Partnership. Only with own API key.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `numerals`            | boolean  | `false`    | Convert spoken numbers to digit numerals.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| `profanityFilter`     | boolean  | `false`    | Replace profanity with asterisks (e.g., "f\*\*\*").                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `keywords`            | string[] | -          | Keywords with optional boost values for improved recognition.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `keyterm`             | string[] | -          | Keyterm prompting (KRR) -- up to 90% improved keyword recall.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `endpointing`         | number   | `10`       | Silence timeout in seconds before Deepgram sends transcription. Recommended: 10 (latency) or 300 (quality).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `confidenceThreshold` | number   | `0.5`      | Discard transcriptions below this confidence.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `eagerEotThreshold`   | number   | -          | Early end-of-turn detection threshold (Flux models only, 0-1).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| `eotThreshold`        | number   | `0.7`      | End-of-turn confidence threshold (Flux models only, 0.5-1.0).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `eotTimeoutMs`        | number   | `5000`     | Max wait time for EOT detection in ms (Flux models only).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |

### AssemblyAI-Specific

| Property                           | Type     | Default                         | Description                                                           |
| ---------------------------------- | -------- | ------------------------------- | --------------------------------------------------------------------- |
| `speechModel`                      | enum     | `"universal-streaming-english"` | `"universal-streaming-english"`, `"universal-streaming-multilingual"` |
| `formatTurns`                      | boolean  | `true`                          | Enable turn formatting.                                               |
| `endOfTurnConfidenceThreshold`     | number   | `0.7`                           | EOT confidence (0-1).                                                 |
| `minEndOfTurnSilenceWhenConfident` | number   | `160`                           | Minimum silence (ms) when confident about EOT.                        |
| `maxTurnSilence`                   | number   | `400`                           | Maximum silence (ms) before forcing turn end.                         |
| `vadAssistedEndpointingEnabled`    | boolean  | `true`                          | VAD-assisted endpoint detection.                                      |
| `wordBoost`                        | string[] | -                               | Up to 2500 characters of boosted words.                               |
| `keytermsPrompt`                   | string[] | -                               | Up to 100 keyterms, 50 chars each. Costs $0.04/hour.                  |
| `disablePartialTranscripts`        | boolean  | `false`                         | Disable streaming partial results.                                    |

### Gladia-Specific

| Property                    | Type     | Default  | Description                                                                 |
| --------------------------- | -------- | -------- | --------------------------------------------------------------------------- |
| `model`                     | enum     | `"fast"` | `"fast"`, `"accurate"`, `"solaria-1"`                                       |
| `languageBehaviour`         | enum     | -        | `"manual"`, `"automatic single language"`, `"automatic multiple languages"` |
| `language`                  | string   | -        | Required when `languageBehaviour` is `"manual"`.                            |
| `languages`                 | string[] | -        | Required for `"automatic multiple languages"`.                              |
| `transcriptionHint`         | string   | -        | Hint text, max 600 chars.                                                   |
| `prosody`                   | boolean  | `false`  | Includes non-verbal sounds: `(laugh)`, `(giggles)`, etc.                    |
| `audioEnhancer`             | boolean  | `false`  | Audio enhancement (increases latency).                                      |
| `endpointing`               | number   | -        | Silence timeout in seconds.                                                 |
| `speechThreshold`           | number   | -        | Speech detection threshold (0.0-1.0).                                       |
| `customVocabularyEnabled`   | boolean  | `false`  | Enable custom vocabulary.                                                   |
| `customVocabularyConfig`    | object   | -        | `{ vocabulary: [...], defaultIntensity: number }`                           |
| `region`                    | enum     | -        | `"us-west"`, `"eu-west"`                                                    |
| `receivePartialTranscripts` | boolean  | `false`  | Enable low-latency streaming partial transcripts.                           |

### Azure Speech-Specific

| Property                       | Type   | Default     | Description                               |
| ------------------------------ | ------ | ----------- | ----------------------------------------- |
| `language`                     | enum   | -           | 60+ language codes (af-ZA through zu-ZA). |
| `segmentationStrategy`         | enum   | `"Default"` | `"Default"`, `"Time"`, `"Semantic"`       |
| `segmentationSilenceTimeoutMs` | number | -           | Silence timeout for segmentation (ms).    |
| `segmentationMaximumTimeMs`    | number | -           | Maximum segment time (ms).                |

### ElevenLabs Transcriber-Specific

| Property                  | Type   | Default | Description                                             |
| ------------------------- | ------ | ------- | ------------------------------------------------------- |
| `model`                   | enum   | -       | `"scribe_v1"`, `"scribe_v2"`, `"scribe_v2_realtime"`    |
| `silenceThresholdSeconds` | number | -       | Silence threshold (0.3-3.0).                            |
| `confidenceThreshold`     | number | -       | Confidence threshold (0.1-0.9). Lower = more sensitive. |
| `minSpeechDurationMs`     | number | -       | Minimum speech duration (50-2000ms).                    |
| `minSilenceDurationMs`    | number | -       | Minimum silence duration (50-2000ms).                   |

### Google Transcriber-Specific

| Property | Type | Default | Description                                                                                                                                                                                                    |
| -------- | ---- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `model`  | enum | -       | `"gemini-3-flash-preview"`, `"gemini-2.5-pro"`, `"gemini-2.5-flash"`, `"gemini-2.5-flash-lite"`, `"gemini-2.0-flash"`, `"gemini-2.0-flash-lite"`, `"gemini-1.5-pro"`, `"gemini-1.5-flash"`, `"gemini-1.0-pro"` |

### Speechmatics-Specific

| Property                | Type     | Default      | Description                                            |
| ----------------------- | -------- | ------------ | ------------------------------------------------------ |
| `model`                 | string   | `"default"`  | Model name.                                            |
| `operatingPoint`        | enum     | `"enhanced"` | `"standard"`, `"enhanced"`                             |
| `region`                | enum     | `"eu"`       | `"eu"`, `"us"`                                         |
| `enableDiarization`     | boolean  | `false`      | Speaker diarization.                                   |
| `maxDelay`              | number   | `3000`       | Max delay in ms.                                       |
| `customVocabulary`      | object[] | required     | Array of `{ content: string, soundsLike?: string[] }`. |
| `numeralStyle`          | enum     | `"written"`  | `"written"`, `"spoken"`                                |
| `endOfTurnSensitivity`  | number   | `0.5`        | EOT sensitivity (0-1).                                 |
| `removeDisfluencies`    | boolean  | `false`      | Remove disfluencies (English only).                    |
| `minimumSpeechDuration` | number   | `0`          | Minimum speech duration in seconds.                    |

### OpenAI Transcriber-Specific

| Property | Type | Default  | Description                                       |
| -------- | ---- | -------- | ------------------------------------------------- |
| `model`  | enum | required | `"gpt-4o-transcribe"`, `"gpt-4o-mini-transcribe"` |

### Soniox-Specific

| Property              | Type     | Default       | Description                          |
| --------------------- | -------- | ------------- | ------------------------------------ |
| `model`               | string   | `"stt-rt-v4"` | Model identifier.                    |
| `languageHintsStrict` | boolean  | `true`        | Strict language hint enforcement.    |
| `maxEndpointDelayMs`  | number   | `500`         | Max endpoint delay (500-3000ms).     |
| `customVocabulary`    | string[] | -             | Brand/product names for recognition. |

### Cartesia Transcriber-Specific

| Property | Type   | Default         | Description         |
| -------- | ------ | --------------- | ------------------- |
| `model`  | string | `"ink-whisper"` | Cartesia STT model. |

### Talkscriber-Specific

| Property | Type   | Default     | Description          |
| -------- | ------ | ----------- | -------------------- |
| `model`  | string | `"whisper"` | Whisper-based model. |

### Custom Transcriber

| Property                          | Type     | Default  | Description                             |
| --------------------------------- | -------- | -------- | --------------------------------------- | ------------------------------------------------------------------- |
| `server.url`                      | string   | required | WebSocket endpoint for your STT server. |
| `server.timeoutSeconds`           | number   | `20`     | Connection timeout.                     |
| `server.credentialId`             | string   | -        | Credential for authentication.          |
| `server.staticIpAddressesEnabled` | boolean  | `false`  | Use static IPs for the connection.      |
| `server.encryptedPaths`           | string[] | -        | Paths to encrypt in transit.            |
| `server.headers`                  | object   | -        | Custom headers.                         |
| `server.backoffPlan`              | object   | -        | Retry config: `{ type: "fixed"          | "exponential", maxRetries, baseDelaySeconds, excludedStatusCodes }` |

---

## 3. Voice Options

### Supported Voice Providers

| Provider        | Key          | Notable Feature                            |
| --------------- | ------------ | ------------------------------------------ |
| Vapi (built-in) | `"vapi"`     | Pre-optimized voices, no API key needed    |
| ElevenLabs      | `"11labs"`   | Stability/similarity/style controls, SSML  |
| Cartesia        | `"cartesia"` | Emotion steering, laughter, Sonic-3        |
| PlayHT          | `"playht"`   | Temperature, textGuidance, styleGuidance   |
| OpenAI          | `"openai"`   | TTS-1, TTS-1-HD, Realtime models           |
| Azure           | `"azure"`    | 400+ voices, 140+ languages, pitch control |
| LMNT            | `"lmnt"`     | Ultrafast synthesis, voice cloning         |
| Rime AI         | `"rime-ai"`  | Shortest response times                    |
| Deepgram        | `"deepgram"` | Aura TTS voices                            |

### Common Voice Properties (all providers)

| Property       | Type   | Default  | Description                                                          |
| -------------- | ------ | -------- | -------------------------------------------------------------------- |
| `provider`     | string | required | Voice provider identifier.                                           |
| `voiceId`      | string | required | Provider-specific voice ID.                                          |
| `chunkPlan`    | object | -        | How model output is chunked before sending to voice (see Section 7). |
| `fallbackPlan` | object | -        | Fallback voice providers if primary fails.                           |

### Vapi Built-in Voices

| Property   | Type     | Default  | Description                                                                                                                                                                                                                                                                                                                                                  |
| ---------- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `provider` | `"vapi"` | required | -                                                                                                                                                                                                                                                                                                                                                            |
| `voiceId`  | string   | required | Voice names: `"Elliot"` (M, Canadian, 20s), `"Savannah"` (F, Southern American, 20s), `"Rohan"` (M, Indian American, 20s), `"Emma"` (F, Asian American, 20s), `"Clara"` (F, American, 30s), `"Nico"` (M, American, 20s), `"Kai"` (M, American, 30s), `"Sagar"` (M, Indian American, 20s), `"Godfrey"` (M, American, 20s), `"Neil"` (M, Indian American, 20s) |

### ElevenLabs Voice

| Property                          | Type         | Default             | Description                                                                                                                                                                              |
| --------------------------------- | ------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider`                        | `"11labs"`   | required            | -                                                                                                                                                                                        |
| `voiceId`                         | string       | required            | Voice ID from your ElevenLabs Voice Library.                                                                                                                                             |
| `model`                           | enum         | `"eleven_turbo_v2"` | `"eleven_monolingual_v1"`, `"eleven_multilingual_v1"`, `"eleven_multilingual_v2"`, `"eleven_turbo_v2"`, `"eleven_turbo_v2_5"`, `"eleven_v3"`, `"eleven_flash_v2"`, `"eleven_flash_v2_5"` |
| `stability`                       | number (0-1) | -                   | Voice consistency. Lower = more emotional range. Higher = more monotone.                                                                                                                 |
| `similarityBoost`                 | number (0-1) | -                   | Clarity + Similarity Enhancement. Higher = closer to original voice but more compute.                                                                                                    |
| `style`                           | number (0-1) | -                   | Style exaggeration. Amplifies the style of the original speaker.                                                                                                                         |
| `useSpeakerBoost`                 | boolean      | -                   | Boosts similarity to original speaker. Increases latency slightly.                                                                                                                       |
| `speed`                           | number       | -                   | Playback speed multiplier.                                                                                                                                                               |
| `optimizeStreamingLatency`        | number       | `3`                 | Streaming latency optimization level (0-4). Higher = lower latency but potentially lower quality.                                                                                        |
| `enableSsmlParsing`               | boolean      | `false`             | Enable SSML pronunciation tags. Saves latency when disabled.                                                                                                                             |
| `autoMode`                        | boolean      | `false`             | Auto mode for voice settings.                                                                                                                                                            |
| `language`                        | string       | -                   | ISO 639-1 language code. Only Turbo v2.5 supports language enforcement.                                                                                                                  |
| `cachingEnabled`                  | boolean      | `true`              | Toggle voice caching.                                                                                                                                                                    |
| `pronunciationDictionaryLocators` | object[]     | -                   | ElevenLabs pronunciation dictionary locators.                                                                                                                                            |
| `inputPreprocessingEnabled`       | boolean      | -                   | Enable input text preprocessing.                                                                                                                                                         |
| `inputReformattingEnabled`        | boolean      | -                   | Enable input text reformatting.                                                                                                                                                          |
| `inputMinCharacters`              | number       | -                   | Minimum input characters before generating audio.                                                                                                                                        |

### Cartesia Voice

| Property   | Type         | Default  | Description                                                         |
| ---------- | ------------ | -------- | ------------------------------------------------------------------- |
| `provider` | `"cartesia"` | required | -                                                                   |
| `voiceId`  | string       | required | Cartesia voice ID.                                                  |
| `model`    | enum         | -        | `"sonic-english"`, `"sonic-multilingual"`, `"sonic-2"`, `"sonic-3"` |
| `language` | string       | -        | Language code. Sonic-3 supports 27 languages.                       |
| `speed`    | number       | -        | Speed multiplier (0.6-1.5) or normalized (-1.0 to 1.0).             |
| `emotion`  | string[]     | -        | Array of emotion controls (see Section 8 for full list).            |

### PlayHT Voice

| Property        | Type       | Default  | Description                                                          |
| --------------- | ---------- | -------- | -------------------------------------------------------------------- |
| `provider`      | `"playht"` | required | -                                                                    |
| `voiceId`       | string     | required | PlayHT voice ID.                                                     |
| `model`         | enum       | -        | `"PlayHT2.0"`, `"PlayHT2.0-turbo"`, `"Play3.0-mini"`, `"PlayDialog"` |
| `speed`         | number     | -        | Playback speed.                                                      |
| `temperature`   | number     | -        | Voice randomness/variation.                                          |
| `emotion`       | string     | -        | Emotion preset for the voice.                                        |
| `textGuidance`  | number     | -        | How closely to follow the text.                                      |
| `styleGuidance` | number     | -        | How strongly to apply the voice style.                               |
| `voiceGuidance` | number     | -        | How closely to match the voice.                                      |

### OpenAI Voice

| Property   | Type       | Default  | Description                                                                                                                                                                                 |
| ---------- | ---------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `provider` | `"openai"` | required | -                                                                                                                                                                                           |
| `voiceId`  | enum       | required | Standard TTS: `"alloy"`, `"ash"`, `"coral"`, `"echo"`, `"fable"`, `"onyx"`, `"nova"`, `"sage"`, `"shimmer"`. Realtime models have limited voice support (ash, ballad, coral NOT supported). |
| `model`    | enum       | -        | `"tts-1"`, `"tts-1-hd"`, `"gpt-4o-mini-tts"`                                                                                                                                                |
| `speed`    | number     | -        | Speed multiplier (0.25-4.0).                                                                                                                                                                |

### Azure Voice

| Property   | Type      | Default  | Description                                                                          |
| ---------- | --------- | -------- | ------------------------------------------------------------------------------------ |
| `provider` | `"azure"` | required | -                                                                                    |
| `voiceId`  | string    | required | Azure voice ID (e.g., `"es-ES-ElviraNeural"`). 400+ prebuilt voices, 140+ languages. |
| `speed`    | number    | -        | Speech rate.                                                                         |
| `pitch`    | number    | -        | Voice pitch adjustment.                                                              |

### LMNT Voice

| Property   | Type     | Default  | Description         |
| ---------- | -------- | -------- | ------------------- |
| `provider` | `"lmnt"` | required | -                   |
| `voiceId`  | string   | required | LMNT voice ID.      |
| `speed`    | number   | -        | Speech speed.       |
| `model`    | string   | -        | LMNT model variant. |

### Rime AI Voice

| Property   | Type        | Default  | Description         |
| ---------- | ----------- | -------- | ------------------- |
| `provider` | `"rime-ai"` | required | -                   |
| `voiceId`  | string      | required | Rime AI voice ID.   |
| `speed`    | number      | -        | Speech speed.       |
| `model`    | string      | -        | Rime model variant. |

### Deepgram Voice

| Property   | Type         | Default  | Description             |
| ---------- | ------------ | -------- | ----------------------- |
| `provider` | `"deepgram"` | required | -                       |
| `voiceId`  | string       | required | Deepgram Aura voice ID. |

### Custom Voice Provider

| Property   | Type             | Default  | Description                                                                           |
| ---------- | ---------------- | -------- | ------------------------------------------------------------------------------------- |
| `provider` | `"custom-voice"` | required | -                                                                                     |
| `server`   | object           | required | Server config with `url`, `timeoutSeconds`, `credentialId`, `headers`, `backoffPlan`. |

---

## 4. Model / LLM Options

### Supported LLM Providers

| Provider     | Key                   | Models                                                                                                                                                                   |
| ------------ | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| OpenAI       | `"openai"`            | `"gpt-4o"`, `"gpt-4o-mini"`, `"gpt-4-turbo"`, `"gpt-4"`, `"gpt-3.5-turbo"`, `"gpt-4o-realtime-preview"`, `"gpt-4o-mini-realtime-preview"`, `"gpt-4.1"`, `"gpt-4.1-mini"` |
| Anthropic    | `"anthropic"`         | `"claude-3-opus"`, `"claude-3-sonnet"`, `"claude-3-haiku"`, `"claude-3.5-sonnet"`, `"claude-3.5-haiku"`, `"claude-4-sonnet"`, `"claude-4-opus"`                          |
| Google       | `"google"`            | `"gemini-2.5-pro"`, `"gemini-2.5-flash"`, `"gemini-2.0-flash"`, `"gemini-1.5-pro"`, `"gemini-1.5-flash"`                                                                 |
| Groq         | `"groq"`              | `"llama-3.3-70b-versatile"`, `"llama-3.1-8b-instant"`, `"llama-3.1-70b-versatile"`, `"mixtral-8x7b-32768"`, `"gemma2-9b-it"`                                             |
| Together AI  | `"together-ai"`       | Any model on Together AI platform                                                                                                                                        |
| OpenRouter   | `"openrouter"`        | Any model on OpenRouter (hundreds available)                                                                                                                             |
| DeepInfra    | `"deep-infra"`        | Models hosted on DeepInfra                                                                                                                                               |
| Perplexity   | `"perplexity-ai"`     | Perplexity AI models                                                                                                                                                     |
| Azure OpenAI | `"azure-openai"`      | Your Azure-deployed OpenAI models                                                                                                                                        |
| Custom LLM   | `"custom-llm-openai"` | Any OpenAI-compatible endpoint (your own server, Ollama, etc.)                                                                                                           |

### Common Model Properties

| Property                    | Type     | Default  | Description                                                                                              |
| --------------------------- | -------- | -------- | -------------------------------------------------------------------------------------------------------- | ------ | ----------- | ------------------------------- |
| `provider`                  | string   | required | LLM provider identifier.                                                                                 |
| `model`                     | string   | required | Specific model ID string.                                                                                |
| `messages`                  | object[] | -        | Starting conversation state. Array of `{ role: "system"                                                  | "user" | "assistant" | "function", content: string }`. |
| `temperature`               | number   | varies   | Controls randomness (0-2 typically). Lower = more deterministic.                                         |
| `maxTokens`                 | number   | `250`    | Max tokens the assistant generates per turn.                                                             |
| `emotionRecognitionEnabled` | boolean  | `false`  | Detect user emotion from speech and send as additional context to the model.                             |
| `numFastTurns`              | number   | `0`      | Number of initial turns using a smaller/faster model from the same provider before switching to primary. |
| `tools`                     | object[] | -        | Tools the assistant can invoke during calls (function calling, transfer, query, etc.).                   |
| `toolIds`                   | string[] | -        | IDs of pre-created tools to attach. Can be used alongside `tools`.                                       |
| `knowledgeBase`             | object   | -        | Knowledge base configuration (see Section 12).                                                           |
| `knowledgeBaseId`           | string   | -        | ID of a pre-created knowledge base.                                                                      |

### Custom LLM Server Properties

| Property                | Type   | Default  | Description                          |
| ----------------------- | ------ | -------- | ------------------------------------ | ---------------------------------------------- |
| `server.url`            | string | required | Your OpenAI-compatible endpoint URL. |
| `server.timeoutSeconds` | number | `20`     | Connection timeout.                  |
| `server.credentialId`   | string | -        | Credential for authentication.       |
| `server.headers`        | object | -        | Custom headers.                      |
| `server.backoffPlan`    | object | -        | Retry config: `{ type: "fixed"       | "exponential", maxRetries, baseDelaySeconds }` |

---

## 5. Call Behavior Settings

| Property                           | Type     | Default                           | Description                                                                                                                                                                                                                                           |
| ---------------------------------- | -------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `backgroundSound`                  | string   | `"office"` (phone), `"off"` (web) | `"off"`, `"office"`, or URL to custom audio file.                                                                                                                                                                                                     |
| `backgroundDenoisingEnabled`       | boolean  | `false`                           | Filter noise from user audio input.                                                                                                                                                                                                                   |
| `backgroundSpeechDenoisingPlan`    | object   | -                                 | Advanced config for background speech filtering.                                                                                                                                                                                                      |
| `silenceTimeoutSeconds`            | number   | `30`                              | Seconds of silence before ending the call.                                                                                                                                                                                                            |
| `maxDurationSeconds`               | number   | `600` (10 min)                    | Maximum call duration. Range: 10-43200 (12 hours).                                                                                                                                                                                                    |
| `endCallMessage`                   | string   | -                                 | Message spoken when ending the call.                                                                                                                                                                                                                  |
| `endCallPhrases`                   | string[] | -                                 | Phrases that trigger hangup (case-insensitive matching).                                                                                                                                                                                              |
| `voicemailMessage`                 | string   | -                                 | Message to leave on voicemail.                                                                                                                                                                                                                        |
| `firstMessage`                     | string   | -                                 | Opening message (text or audio URL).                                                                                                                                                                                                                  |
| `firstMessageMode`                 | enum     | `"assistant-speaks-first"`        | Controls who speaks first and how.                                                                                                                                                                                                                    |
| `firstMessageInterruptionsEnabled` | boolean  | `false`                           | Allow interruptions during first message.                                                                                                                                                                                                             |
| `modelOutputInMessagesEnabled`     | boolean  | `false`                           | Include model raw output in conversation history.                                                                                                                                                                                                     |
| `clientMessages`                   | string[] | predefined                        | Messages sent to Client SDK: `"conversation-update"`, `"function-call"`, `"hang"`, `"metadata"`, `"model-output"`, `"speech-update"`, `"status-update"`, `"transcript"`, `"tool-calls"`, `"tool-calls-result"`, `"user-interrupted"`, `"voice-input"` |
| `serverMessages`                   | string[] | predefined                        | Messages sent to Server URL: `"conversation-update"`, `"end-of-call-report"`, `"function-call"`, `"hang"`, `"speech-update"`, `"status-update"`, `"tool-calls"`, `"transfer-destination-request"`, `"user-interrupted"`, `"voice-input"`              |

---

## 6. Speaking Plans

### startSpeakingPlan

Controls when the assistant begins responding after the user stops talking.

| Property                       | Type     | Default | Description                                                                     |
| ------------------------------ | -------- | ------- | ------------------------------------------------------------------------------- |
| `waitSeconds`                  | number   | `0.4`   | How long the assistant waits before speaking after user finishes (0-5 seconds). |
| `smartEndpointingEnabled`      | boolean  | `false` | Use AI-based endpoint detection.                                                |
| `smartEndpointingPlan`         | object   | -       | Advanced smart endpointing config (see below).                                  |
| `transcriptionEndpointingPlan` | object   | -       | Text-based heuristic endpointing (see below).                                   |
| `customEndpointingRules`       | object[] | -       | Custom regex-based rules for endpointing (see below).                           |

#### smartEndpointingPlan

| Property       | Type   | Default            | Description                                                                            |
| -------------- | ------ | ------------------ | -------------------------------------------------------------------------------------- |
| `provider`     | enum   | -                  | `"livekit"`, `"vapi"`, `"krisp"`, `"deepgram-flux"`, `"assembly"`, `"off"`             |
| `threshold`    | number | `0.5`              | Detection threshold (0.0-1.0). Krisp provider only.                                    |
| `waitFunction` | string | `"200 + 8000 * x"` | Math expression for wait time. LiveKit provider. Supports sigmoid, polynomial, linear. |

#### transcriptionEndpointingPlan

| Property                 | Type   | Default | Description                                                            |
| ------------------------ | ------ | ------- | ---------------------------------------------------------------------- |
| `onPunctuationSeconds`   | number | `0.1`   | Wait time after detecting sentence-ending punctuation (., !, ?).       |
| `onNoPunctuationSeconds` | number | `1.5`   | Wait time when transcriber lacks confidence / no punctuation detected. |
| `onNumberSeconds`        | number | `0.5`   | Wait time after detecting numbers (user may still be dictating).       |

#### customEndpointingRules

| Property         | Type   | Default | Description                                         |
| ---------------- | ------ | ------- | --------------------------------------------------- |
| `type`           | enum   | -       | `"assistant"` or `"user"` -- whose speech to match. |
| `regex`          | string | -       | Regex pattern to match against transcript.          |
| `timeoutSeconds` | number | -       | Custom timeout when pattern matches.                |

### stopSpeakingPlan

Controls how interruptions are detected when the user speaks while the assistant is talking.

| Property                 | Type     | Default | Description                                                                                                                             |
| ------------------------ | -------- | ------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `numWords`               | number   | `0`     | Words the customer must say before assistant stops. 0 = immediate reaction. Increase to ignore brief acknowledgments ("okay", "right"). |
| `voiceSeconds`           | number   | `0.2`   | Duration of voice activity (seconds) required to trigger stop (0-0.5).                                                                  |
| `backoffSeconds`         | number   | `1.0`   | How long the assistant waits before resuming speech after being interrupted (0-10).                                                     |
| `acknowledgementPhrases` | string[] | -       | Phrases to ignore as interruptions (e.g., "uh huh", "okay").                                                                            |
| `interruptionPhrases`    | string[] | -       | Phrases that always trigger interruption regardless of numWords.                                                                        |

---

## 7. Chunk Plan & Format Plan

### chunkPlan

Controls how model output text is divided into chunks before being sent to the voice provider.

| Property                | Type    | Default | Description                                                                                                                                                                                                          |
| ----------------------- | ------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `enabled`               | boolean | `true`  | Enable chunking. Set `false` to let voice provider handle it. Note: disabling breaks Vapi audio control tokens like `<flush />`.                                                                                     |
| `minCharacters`         | number  | `30`    | Minimum characters per chunk. Increase for quality, decrease for latency.                                                                                                                                            |
| `punctuationBoundaries` | object  | auto    | Which punctuation marks serve as chunk boundaries. Properties: `period` (bool), `comma` (bool), `questionMark` (bool), `exclamationMark` (bool). Fewer boundaries = higher quality. More boundaries = lower latency. |
| `formatPlan`            | object  | -       | Formatting rules applied to chunks (see below).                                                                                                                                                                      |

### formatPlan

Transforms raw LLM text output into natural-sounding speech text. Enabled by default for all assistants.

| Property               | Type     | Default     | Description                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------- | -------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `enabled`              | boolean  | `true`      | Enable/disable all text formatting.                                                                                                                                                                                                                                                                                                                                                        |
| `numberToDigitsCutoff` | number   | `2025`      | Numbers above this threshold are read as individual digits.                                                                                                                                                                                                                                                                                                                                |
| `replacements`         | object[] | -           | Custom substitutions: `{ type: "exact", key: string, value: string }` or `{ type: "regex", regex: string, value: string }`.                                                                                                                                                                                                                                                                |
| `formattersEnabled`    | string[] | all enabled | List of active formatters. Available: `"removeAngleBracketContent"`, `"removeMarkdownSymbols"`, `"replaceNewLinesWithPeriods"`, `"replaceColonsWithPeriods"`, `"formatAcronyms"`, `"formatDollarAmounts"`, `"formatEmails"`, `"formatDates"`, `"formatTimes"`, `"formatDistances"`, `"formatUnits"`, `"formatPercentages"`, `"formatPhoneNumbers"`, `"formatNumbers"`, `"removeAsterisks"` |

> **Note:** Currently only `replacements` and `numberToDigitsCutoff` are fully customizable. The other formatters are enabled/disabled as a group.

---

## 8. Emotional / Realistic Voice Controls

### ElevenLabs Emotion Controls

ElevenLabs provides emotion through its voice parameter sliders:

| Parameter         | Range   | Effect                                                                                  |
| ----------------- | ------- | --------------------------------------------------------------------------------------- |
| `stability`       | 0.0-1.0 | **Lower** = broader emotional range, more variation. **Higher** = consistent, monotone. |
| `similarityBoost` | 0.0-1.0 | How closely the output matches the original voice.                                      |
| `style`           | 0.0-1.0 | Style exaggeration -- amplifies the speaking style of the original voice.               |
| `useSpeakerBoost` | boolean | Extra boost to match original speaker (subtle, adds latency).                           |

- **Expressive Mode**: ElevenLabs v3 Conversational model detects user emotion (e.g., frustration) and adjusts tone to respond with empathy.
- **SSML**: Enable `enableSsmlParsing: true` for pronunciation control tags.

### Cartesia Emotion Controls (Sonic-3)

Cartesia provides the most granular emotion steering via an `emotion` array on the voice config.

**Primary Emotions** (best quality):

- `"neutral"`, `"angry"`, `"excited"`, `"content"`, `"sad"`, `"scared"`

**Extended Emotions** (full palette):

- **Positive**: `"happy"`, `"enthusiastic"`, `"elated"`, `"euphoric"`, `"triumphant"`, `"amazed"`, `"surprised"`, `"flirtatious"`, `"joking"`, `"curious"`, `"peaceful"`, `"serene"`, `"calm"`, `"grateful"`, `"affectionate"`, `"proud"`, `"confident"`
- **Neutral/Mixed**: `"trust"`, `"sympathetic"`, `"anticipation"`, `"mysterious"`, `"contemplative"`, `"determined"`, `"distant"`, `"skeptical"`, `"nostalgic"`, `"wistful"`
- **Negative**: `"mad"`, `"outraged"`, `"frustrated"`, `"agitated"`, `"threatened"`, `"disgusted"`, `"contempt"`, `"envious"`, `"sarcastic"`, `"ironic"`, `"dejected"`, `"melancholic"`, `"disappointed"`, `"hurt"`, `"guilty"`, `"bored"`, `"tired"`, `"rejected"`, `"apologetic"`, `"hesitant"`, `"insecure"`, `"confused"`, `"resigned"`, `"anxious"`, `"panicked"`, `"alarmed"`

**Emotion Levels**: `"lowest"`, `"low"`, `"high"`, `"highest"` -- purely additive. Format: `"emotion:level"` (e.g., `"surprise:low"`).

**Non-verbal Sounds**: Insert `[laughter]` in transcript text to generate laughter.

**Speed**: 0.6-1.5 (multiplier) or -1.0 to 1.0 (normalized).
**Volume**: 0.5-2.0 (multiplier).

### PlayHT Emotion Controls

| Parameter       | Type   | Description                               |
| --------------- | ------ | ----------------------------------------- |
| `emotion`       | string | Emotion preset applied to the voice.      |
| `temperature`   | number | Variation/randomness in the voice output. |
| `textGuidance`  | number | How closely to follow the input text.     |
| `styleGuidance` | number | How strongly to apply the voice's style.  |
| `voiceGuidance` | number | How closely to match the voice clone.     |

### OpenAI Voice

- No direct emotion controls. Uses `instructions` parameter via Realtime API session config.
- `gpt-4o-mini-tts` supports emotional/tonal instructions via the `instructions` parameter.

### Azure Voice

- Supports SSML emotion tags through Azure's Speech Synthesis Markup Language.
- `speed` and `pitch` parameters available.

### Vapi Built-in Voices

- Pre-optimized voices with no additional emotion/style controls.
- Designed for natural conversation out of the box.

---

## 9. Artifact Plan

Controls recording, logging, and transcript generation.

| Property                           | Type    | Default     | Description                                                        |
| ---------------------------------- | ------- | ----------- | ------------------------------------------------------------------ |
| `recordingEnabled`                 | boolean | `true`      | Enable call recording (stored in `call.artifact.recording`).       |
| `recordingFormat`                  | string  | `"wav;l16"` | Audio format. Options: `"wav;l16"`, `"mp3"`.                       |
| `recordingUseCustomStorageEnabled` | boolean | `true`      | Use custom storage for recordings.                                 |
| `recordingPath`                    | string  | -           | Custom path for recording storage.                                 |
| `loggingEnabled`                   | boolean | `true`      | Enable detailed call logs (stored in `call.artifact.logUrl`).      |
| `loggingUseCustomStorageEnabled`   | boolean | `true`      | Use custom storage for logs.                                       |
| `loggingPath`                      | string  | -           | Custom path for log storage.                                       |
| `pcapEnabled`                      | boolean | `true`      | Enable SIP packet capture for phone calls.                         |
| `pcapUseCustomStorageEnabled`      | boolean | `true`      | Use custom storage for PCAP files.                                 |
| `pcapS3PathPrefix`                 | string  | -           | S3 path prefix for PCAP files.                                     |
| `transcriptPlan.enabled`           | boolean | `true`      | Enable transcript generation.                                      |
| `transcriptPlan.assistantName`     | string  | -           | Name for assistant messages in transcripts.                        |
| `transcriptPlan.userName`          | string  | -           | Name for user messages in transcripts.                             |
| `fullMessageHistoryEnabled`        | boolean | `false`     | Include full message history across all assistants in squad calls. |

---

## 10. Analysis Plan

Post-call analysis configuration. Runs after the call ends.

### summaryPlan

| Property        | Type   | Default                             | Description                                                           |
| --------------- | ------ | ----------------------------------- | --------------------------------------------------------------------- |
| `summaryPrompt` | string | `"You are an expert note-taker..."` | Custom prompt for call summarization. Set to empty string to disable. |

### structuredDataPlan

| Property               | Type                 | Default                                 | Description                                  |
| ---------------------- | -------------------- | --------------------------------------- | -------------------------------------------- |
| `structuredDataPrompt` | string               | `"You are an expert data extractor..."` | Instructions for data extraction.            |
| `structuredDataSchema` | object (JSON Schema) | -                                       | Schema defining the shape of extracted data. |

### successEvaluationPlan

| Property                  | Type   | Default | Description                                                                                                                                                                                     |
| ------------------------- | ------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `successEvaluationPrompt` | string | -       | Prompt for evaluating call success. Set to empty string to disable.                                                                                                                             |
| `successEvaluationRubric` | enum   | -       | `"NumericScale"` (1-10), `"DescriptiveScale"` (Excellent/Good/Fair/Poor), `"Checklist"`, `"Matrix"`, `"PercentageScale"` (0-100%), `"LikertScale"`, `"AutomaticRubric"`, `"PassFail"` (boolean) |

---

## 11. Voicemail Detection

### Providers

| Provider           | Key        | Description                                      |
| ------------------ | ---------- | ------------------------------------------------ |
| Vapi (recommended) | `"vapi"`   | Gemini model-based detection + beep recognition. |
| Google             | `"google"` | Google-based detection.                          |
| OpenAI             | `"openai"` | OpenAI-based detection.                          |
| Twilio (legacy)    | `"twilio"` | Twilio AMD (Answering Machine Detection).        |
| Off                | `"off"`    | Disable voicemail detection.                     |

### Vapi Provider Properties

| Property                       | Type     | Default   | Description                                                         |
| ------------------------------ | -------- | --------- | ------------------------------------------------------------------- |
| `provider`                     | `"vapi"` | -         | Use Vapi's built-in detection.                                      |
| `type`                         | enum     | `"audio"` | `"audio"` (audio analysis) or `"transcript"` (transcript analysis). |
| `backoffPlan.startAtSeconds`   | number   | -         | Delay before detection begins (0-60).                               |
| `backoffPlan.frequencySeconds` | number   | -         | Checking interval (minimum 2.5s).                                   |
| `backoffPlan.maxRetries`       | number   | -         | Maximum detection attempts.                                         |
| `beepMaxAwaitSeconds`          | number   | `30`      | Max wait for voicemail beep from call start (0-60).                 |

### Twilio Provider Properties

| Property                             | Type       | Default | Description                                                                                                                 |
| ------------------------------------ | ---------- | ------- | --------------------------------------------------------------------------------------------------------------------------- |
| `provider`                           | `"twilio"` | -       | Use Twilio AMD.                                                                                                             |
| `enabled`                            | boolean    | `true`  | Enable/disable detection.                                                                                                   |
| `voicemailDetectionTypes`            | string[]   | -       | Detection event types: `"machine_start"`, `"machine_end_beep"`, `"machine_end_silence"`, `"machine_end_other"`, `"unknown"` |
| `machineDetectionTimeout`            | number     | `30`    | Seconds to wait before confirming machine (lower = faster but more false positives).                                        |
| `machineDetectionSpeechThreshold`    | number     | -       | Speech threshold for machine detection.                                                                                     |
| `machineDetectionSpeechEndThreshold` | number     | -       | Speech end threshold.                                                                                                       |
| `machineDetectionSilenceTimeout`     | number     | -       | Silence timeout for detection.                                                                                              |

---

## 12. Knowledge Base

### Configuration via Query Tool

Knowledge bases are attached to assistants through the `tools` array as a query tool.

```json
{
  "model": {
    "provider": "openai",
    "model": "gpt-4o",
    "tools": [
      {
        "type": "query",
        "function": {
          "name": "product-query"
        },
        "knowledgeBases": [
          {
            "provider": "google",
            "name": "product-kb",
            "description": "Contains product info, service details, and company offerings.",
            "fileIds": ["file-id-1", "file-id-2"]
          }
        ]
      }
    ]
  }
}
```

### Knowledge Base Properties

| Property      | Type     | Description                                                               |
| ------------- | -------- | ------------------------------------------------------------------------- |
| `provider`    | string   | Currently `"google"` (uses Gemini for retrieval).                         |
| `name`        | string   | Identifier for the knowledge base.                                        |
| `description` | string   | Describes content purpose. Important for the model to know when to query. |
| `fileIds`     | string[] | Array of file IDs uploaded via API or dashboard.                          |

### Supported File Formats

`.txt`, `.pdf`, `.docx`, `.doc`, `.csv`, `.md`, `.tsv`, `.yaml`, `.json`, `.xml`, `.log`

### Custom Knowledge Base

For full control over retrieval (own vector DB, custom search):

| Property                | Type   | Description                      |
| ----------------------- | ------ | -------------------------------- |
| `server.url`            | string | Your retrieval server endpoint.  |
| `server.timeoutSeconds` | number | Connection timeout (default 20). |
| `server.credentialId`   | string | Authentication credential.       |
| `server.headers`        | object | Custom headers.                  |

### Important Notes

- You **must** instruct the assistant in its system prompt about when to use the query tool.
- Knowledge base must be set at the assistant level; it cannot be set in the call creation request directly.
- Multiple knowledge bases can be configured within a single query tool.

---

## 13. Compliance & Security

### compliancePlan

| Property       | Type    | Default | Description                                                                                                                                                                                                                                      |
| -------------- | ------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `hipaaEnabled` | boolean | `false` | Enable HIPAA compliance. Requires Enterprise plan + BAA. When enabled: no call logs, recordings, or transcriptions stored on Vapi servers. End-of-call report sent to your server only. Variable values processed during call but not persisted. |
| `pciEnabled`   | boolean | `false` | Enable PCI compliance for handling payment card data.                                                                                                                                                                                            |

---

## 14. Monitor Plan

| Property         | Type     | Default | Description                                      |
| ---------------- | -------- | ------- | ------------------------------------------------ |
| `listenEnabled`  | boolean  | `false` | Enable live listening to assistant calls.        |
| `controlEnabled` | boolean  | `false` | Enable live control of assistant calls.          |
| `monitorIds`     | string[] | -       | Specific monitor IDs to attach to the assistant. |

---

## 15. Hooks

Event-driven actions triggered during calls.

### Supported Hook Types

| Hook Type                            | Trigger                                     |
| ------------------------------------ | ------------------------------------------- |
| `CallHookCallEnding`                 | When a call is ending.                      |
| `CallHookAssistantSpeechInterrupted` | When the assistant's speech is interrupted. |
| `CallHookCustomerSpeechInterrupted`  | When the customer's speech is interrupted.  |
| `CallHookCustomerSpeechTimeout`      | When the customer goes silent too long.     |
| `SessionCreatedHook`                 | When a new session/call is created.         |

---

## Appendix: OpenAI Realtime Model Notes

When using OpenAI Realtime models (`gpt-4o-realtime-preview`, `gpt-4o-mini-realtime-preview`):

- These models handle STT + LLM + TTS natively in a single pipeline.
- You do NOT configure separate transcriber/voice objects.
- System messages are converted to session instructions automatically.
- Supported voices are limited compared to standard TTS.
- Temperature and other params are set via session config, not the standard model object.

---

## Appendix: Fallback Plans

Both voice and transcriber support fallback configurations:

```json
{
  "fallbackPlan": {
    "voices": [
      { "provider": "cartesia", "voiceId": "backup-voice" },
      { "provider": "openai", "voiceId": "alloy" }
    ]
  }
}
```

Transcriber fallback:

```json
{
  "fallbackPlan": {
    "transcribers": [
      { "provider": "deepgram", "model": "nova-2" },
      { "provider": "assembly-ai" }
    ]
  }
}
```

---

## Appendix: Server / Webhook Configuration

| Property                          | Type     | Default | Description                                        |
| --------------------------------- | -------- | ------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `server.url`                      | string   | -       | Webhook URL for server events. Highest precedence. |
| `server.timeoutSeconds`           | number   | `20`    | Server response timeout.                           |
| `server.credentialId`             | string   | -       | Credential for authentication.                     |
| `server.staticIpAddressesEnabled` | boolean  | `false` | Use static IP addresses.                           |
| `server.encryptedPaths`           | string[] | -       | Paths to encrypt in webhook payloads.              |
| `server.headers`                  | object   | -       | Custom headers sent with webhooks.                 |
| `server.backoffPlan`              | object   | -       | Retry plan: `{ type: "fixed"                       | "exponential", maxRetries: number, baseDelaySeconds: number, excludedStatusCodes: number[] }` |
