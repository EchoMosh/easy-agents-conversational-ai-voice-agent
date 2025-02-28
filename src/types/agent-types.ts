
import { Node as ReactFlowNode, Edge } from '@xyflow/react';

// Rename to avoid conflict with the imported type
export type FlowNode = ReactFlowNode;
export type FlowEdge = Edge;

export interface FlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export interface NodeData {
  [key: string]: any;
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
  voice_id?: string;
  humorLevel?: number;
  maxDurationSeconds?: number;
  mermaid_chart?: string;
}
