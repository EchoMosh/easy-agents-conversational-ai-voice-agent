
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
};

export type FlowNode = {
  id: string;
  type: 'greetingNode' | 'speakNode' | 'endNode' | 'triggerNode';
  position: { x: number; y: number };
  data: NodeData;
};

export type FlowEdge = {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
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

export const AGENT_TEMPLATES = [
  {
    id: 'customer-support',
    name: 'Customer Support Agent',
    description: 'Handles customer inquiries and resolves issues efficiently',
    role: 'customer_support' as Agent['role'],
    flow: {
      nodes: [
        {
          id: 'trigger-1',
          type: 'triggerNode',
          position: { x: 100, y: 100 },
          data: {
            platform: 'facebook',
            action: 'message_received'
          }
        },
        {
          id: 'greeting-1',
          type: 'greetingNode',
          position: { x: 500, y: 100 },
          data: {
            greeting: "Hello! I'm here to help with any questions or concerns you may have. How can I assist you today?",
            outcomes: ["I have a product issue", "I need help with my account", "I want to make a return"]
          }
        },
        {
          id: 'speak-1',
          type: 'speakNode',
          position: { x: 900, y: 100 },
          data: {
            message: "I understand you need assistance. I'll be happy to help resolve your issue. Could you please provide more details?",
            outcomes: ["Yes, let me explain", "I'd prefer to speak with a human"]
          }
        },
        {
          id: 'end-1',
          type: 'endNode',
          position: { x: 1300, y: 100 },
          data: {}
        }
      ],
      edges: [
        {
          id: 'e1-2',
          source: 'trigger-1',
          target: 'greeting-1'
        },
        {
          id: 'e2-3',
          source: 'greeting-1',
          target: 'speak-1',
          sourceHandle: 'outcome-0'
        },
        {
          id: 'e3-4',
          source: 'speak-1',
          target: 'end-1',
          sourceHandle: 'outcome-0'
        }
      ]
    }
  },
  {
    id: 'sales-agent',
    name: 'Sales Representative',
    description: 'Qualifies leads and books product demonstrations',
    role: 'sales_agent' as Agent['role'],
    flow: {
      nodes: [
        {
          id: 'trigger-1',
          type: 'triggerNode',
          position: { x: 100, y: 100 },
          data: {
            platform: 'hubspot',
            action: 'new_contact'
          }
        },
        {
          id: 'greeting-1',
          type: 'greetingNode',
          position: { x: 500, y: 100 },
          data: {
            greeting: "Hi there! Thanks for your interest in our products. Would you like to learn more about our solutions?",
            outcomes: ["Yes, tell me more", "I'd like to see a demo", "Just browsing"]
          }
        },
        {
          id: 'speak-1',
          type: 'speakNode',
          position: { x: 900, y: 100 },
          data: {
            message: "Great! I'd be happy to schedule a personalized demo for you. What's the best time for a 30-minute call?",
            outcomes: ["Schedule now", "Send me more information first"]
          }
        },
        {
          id: 'end-1',
          type: 'endNode',
          position: { x: 1300, y: 100 },
          data: {}
        }
      ],
      edges: [
        {
          id: 'e1-2',
          source: 'trigger-1',
          target: 'greeting-1'
        },
        {
          id: 'e2-3',
          source: 'greeting-1',
          target: 'speak-1',
          sourceHandle: 'outcome-1'
        },
        {
          id: 'e3-4',
          source: 'speak-1',
          target: 'end-1',
          sourceHandle: 'outcome-0'
        }
      ]
    }
  },
  {
    id: 'appointment-scheduler',
    name: 'Appointment Scheduler',
    description: 'Manages appointment bookings and reminders',
    role: 'appointment_scheduler' as Agent['role'],
    flow: {
      nodes: [
        {
          id: 'trigger-1',
          type: 'triggerNode',
          position: { x: 100, y: 100 },
          data: {
            platform: 'gohighlevel',
            action: 'contact_created'
          }
        },
        {
          id: 'greeting-1',
          type: 'greetingNode',
          position: { x: 500, y: 100 },
          data: {
            greeting: "Welcome! I can help you schedule an appointment. Would you like to book a new appointment or reschedule an existing one?",
            outcomes: ["Book new appointment", "Reschedule existing", "Cancel appointment"]
          }
        },
        {
          id: 'speak-1',
          type: 'speakNode',
          position: { x: 900, y: 100 },
          data: {
            message: "I'll help you book a new appointment. What type of service are you interested in?",
            outcomes: ["Consultation", "Follow-up", "General inquiry"]
          }
        },
        {
          id: 'end-1',
          type: 'endNode',
          position: { x: 1300, y: 100 },
          data: {}
        }
      ],
      edges: [
        {
          id: 'e1-2',
          source: 'trigger-1',
          target: 'greeting-1'
        },
        {
          id: 'e2-3',
          source: 'greeting-1',
          target: 'speak-1',
          sourceHandle: 'outcome-0'
        },
        {
          id: 'e3-4',
          source: 'speak-1',
          target: 'end-1',
          sourceHandle: 'outcome-0'
        }
      ]
    }
  }
] as const;
