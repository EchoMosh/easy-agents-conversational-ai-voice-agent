
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
  id?: string;
  user_message: string;
  ai_response: string;
  corrected_response: string;
  created_at?: string;
}

export interface Agent {
  id: string;
  name: string;
  role: "receptionist" | "sales_agent" | "customer_support" | "technical_advisor" | "appointment_scheduler" | "product_specialist" | "virtual_assistant";
  user_id: string;
  flow: FlowData | string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  objective?: string;
  interaction_type?: string[];
  language?: string;
  voice_id?: string; // This field should match the database column name
  humor_level?: number; // Changed to match database column name
  humorLevel?: number; // Keep for backward compatibility
  maxDurationSeconds?: number;
  mermaid_chart?: string;
  elevenlabs_agent_id?: string;
  knowledge_ids?: string[]; // Array of knowledge base IDs
  
  // Training related fields
  training_status?: 'not_started' | 'in_progress' | 'completed';
  last_trained_at?: string;
  training_webhook_url?: string;
  training_examples?: TrainingExample[]; // New field for training examples
}
