import { Node as ReactFlowNode, Edge } from '@xyflow/react';

// Rename to avoid conflict with the imported type
export type FlowNode = ReactFlowNode;
export type FlowEdge = Edge;

export interface FlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface NodeAction {
  type: 'sms' | 'webhook' | 'email';
  id: string;
  config: {
    [key: string]: any;
  };
}

export interface NodeData {
  [key: string]: any;
  actions?: NodeAction[];
}

export interface TrainingExample {
  user_message: string;
  ai_response: string;
  corrected_response: string;
  created_at?: string;
}

// Configuration for voice settings
export interface VoiceConfig {
  provider?: string;
  voiceId?: string;
  speed?: number;
  chunkPlan?: {
    enabled?: boolean;
    minCharacters?: number;
    punctuationBoundaries?: string[];
  };
  fallbackVoices?: Array<{
    provider: string;
    voiceId: string;
  }>;
}

// Configuration for transcription
export interface TranscriberConfig {
  provider?: string;
  language?: string;
  disablePartialTranscripts?: boolean;
  endUtteranceSilenceThreshold?: number;
  wordBoost?: string[];
}

// Model configuration
export interface ModelConfig {
  provider?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  emotionRecognitionEnabled?: boolean;
  numFastTurns?: number;
  knowledgeBaseId?: string;
}

// Call timing settings
export interface CallTimingConfig {
  silenceTimeoutSeconds?: number;
  maxDurationSeconds?: number;
  idleTimeoutSeconds?: number;
}

// Speaking behavior configuration
export interface SpeakingBehaviorConfig {
  startSpeakingDelay?: number;
  smartEndpointingEnabled?: boolean;
  acknowledgementPhrases?: string[];
  interruptionPhrases?: string[];
}

export interface Agent {
  id: string;
  name: string;
  role: "receptionist" | "sales_agent" | "customer_support" | "technical_advisor" | "appointment_scheduler" | "product_specialist" | "virtual_assistant";
  user_id: string;
  workspace_id?: string; // Added workspace_id as it seems to be a common requirement
  flow: FlowData | string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  objective?: string;
  interaction_type?: string[];
  language?: string;
  voice_id?: string;
  humor_level?: number;
  humorLevel?: number; // Keep for backward compatibility
  maxDurationSeconds?: number;
  mermaid_chart?: string;
  elevenlabs_agent_id?: string;
  knowledge_ids?: string[];
  v_agent_id?: string;
  
  // Advanced configuration options
  voice_config?: VoiceConfig;
  transcriber_config?: TranscriberConfig;
  model_config?: ModelConfig;
  call_timing?: CallTimingConfig;
  speaking_behavior?: SpeakingBehaviorConfig;
  background_sound?: 'off' | 'office' | 'cafe' | 'nature';
  background_denoising_enabled?: boolean;
  first_message?: string;
  first_message_mode?: 'assistant-speaks-first' | 'user-speaks-first';
  end_call_message?: string;
  end_call_phrases?: string[];
  silence_timeout_message?: string;
  
  // Training related fields
  training_status?: 'not_started' | 'in_progress' | 'completed';
  last_trained_at?: string;
  training_webhook_url?: string;
  training_examples?: TrainingExample[];
}
