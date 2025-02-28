
import { Json } from '@/integrations/supabase/types';
import { Node, Edge } from '@xyflow/react';

export type Agent = {
  id: string;
  name: string;
  role: 'receptionist' | 'sales_agent' | 'customer_support' | 'technical_advisor' | 'appointment_scheduler' | 'product_specialist' | 'virtual_assistant';
  voice_id: string | null;
  language?: string;
  humor_level?: number;
  max_duration_seconds?: number;
  is_active: boolean;
  created_at: string;
  flow?: FlowData | string;
  user_id: string;
  interaction_type: string[];
  objective?: 'live_transfer' | 'answer_calls';
};

export type ContactData = {
  id: string;
  name: string;
  phoneNumber: string;
};

export type NodeData = {
  greeting?: string;
  message?: string;
  outcomes?: string[];
  platform?: 'facebook' | 'hubspot' | 'gohighlevel' | 'activix';
  action?: 
    | 'new_lead'           // Facebook
    | 'message_received'   // Facebook
    | 'new_contact'        // Hubspot
    | 'deal_stage_changed' // Hubspot
    | 'contact_created'    // GoHighLevel
    | 'opportunity_won'    // GoHighLevel
    | 'ticket_created'     // Activix
    | 'payment_received';  // Activix
  contacts?: ContactData[];
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
};

export type NodeType = 'greetingNode' | 'speakNode' | 'endNode' | 'triggerNode' | 'transferNode' | 'webhookNode';

export type FlowNode = Node<NodeData, NodeType>;
export type FlowEdge = Edge;

export type FlowData = {
  nodes: FlowNode[];
  edges: FlowEdge[];
};
