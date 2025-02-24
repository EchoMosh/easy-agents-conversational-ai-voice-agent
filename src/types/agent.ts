
import { Json } from '@/integrations/supabase/types';

export type Agent = {
  id: string;
  name: string;
  role: 'receptionist' | 'sales_agent' | 'customer_support' | 'technical_advisor' | 'appointment_scheduler' | 'product_specialist' | 'virtual_assistant';
  voice_id: string | null;
  is_active: boolean;
  created_at: string;
  flow?: FlowData;
  user_id: string;
  interaction_type: string[];
};

export type NodeData = {
  greeting?: string;
  message?: string;
  outcomes?: string[];
};

export type FlowNode = {
  id: string;
  type: 'greetingNode' | 'speakNode';
  position: { x: number; y: number };
  data: NodeData;
};

export type FlowEdge = {
  id: string;
  source: string;
  target: string;
};

export type FlowData = {
  nodes: FlowNode[];
  edges: FlowEdge[];
};

export const AGENT_ROLES = [
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'sales_agent', label: 'Sales Agent' },
  { value: 'customer_support', label: 'Customer Support' },
  { value: 'technical_advisor', label: 'Technical Advisor' },
  { value: 'appointment_scheduler', label: 'Appointment Scheduler' },
  { value: 'product_specialist', label: 'Product Specialist' },
  { value: 'virtual_assistant', label: 'Virtual Assistant' },
] as const;
