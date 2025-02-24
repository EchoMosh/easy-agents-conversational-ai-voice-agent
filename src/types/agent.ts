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
          position: { x: 400, y: 100 },
          data: {
            greeting: "Hello! I'm here to help with any questions or concerns you may have. What brings you here today?",
            outcomes: [
              "I need technical support",
              "I have a billing question",
              "I want to return a product",
              "I have a different issue"
            ]
          }
        },
        {
          id: 'speak-tech',
          type: 'speakNode',
          position: { x: 700, y: 0 },
          data: {
            message: "I understand you need technical support. Could you please describe the issue you're experiencing?",
            outcomes: ["Explain issue", "Request human agent"]
          }
        },
        {
          id: 'speak-billing',
          type: 'speakNode',
          position: { x: 700, y: 150 },
          data: {
            message: "I'll be happy to help with your billing question. Which of these topics best describes your concern?",
            outcomes: ["Recent charge", "Subscription", "Refund status"]
          }
        },
        {
          id: 'speak-return',
          type: 'speakNode',
          position: { x: 700, y: 300 },
          data: {
            message: "I can help you process a return. Has the item been opened or used?",
            outcomes: ["Unopened", "Used", "Damaged"]
          }
        },
        {
          id: 'end-1',
          type: 'endNode',
          position: { x: 1000, y: 150 },
          data: {}
        }
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'greeting-1' },
        { id: 'e2-3', source: 'greeting-1', target: 'speak-tech', sourceHandle: 'outcome-0' },
        { id: 'e2-4', source: 'greeting-1', target: 'speak-billing', sourceHandle: 'outcome-1' },
        { id: 'e2-5', source: 'greeting-1', target: 'speak-return', sourceHandle: 'outcome-2' },
        { id: 'e3-6', source: 'speak-tech', target: 'end-1', sourceHandle: 'outcome-0' },
        { id: 'e4-6', source: 'speak-billing', target: 'end-1', sourceHandle: 'outcome-0' },
        { id: 'e5-6', source: 'speak-return', target: 'end-1', sourceHandle: 'outcome-0' }
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
          position: { x: 400, y: 100 },
          data: {
            greeting: "Hi there! Thanks for your interest. To better assist you, could you tell me what brings you to us today?",
            outcomes: [
              "Looking for pricing",
              "Want to see a demo",
              "Compare features",
              "General inquiry"
            ]
          }
        },
        {
          id: 'speak-pricing',
          type: 'speakNode',
          position: { x: 700, y: 0 },
          data: {
            message: "I'd be happy to discuss our pricing options. What's your typical team size?",
            outcomes: ["1-10", "11-50", "51-200", "201+"]
          }
        },
        {
          id: 'speak-demo',
          type: 'speakNode',
          position: { x: 700, y: 150 },
          data: {
            message: "Great! I can help schedule a personalized demo. When would you like to have the demonstration?",
            outcomes: ["This week", "Next week", "Specific date"]
          }
        },
        {
          id: 'speak-features',
          type: 'speakNode',
          position: { x: 700, y: 300 },
          data: {
            message: "Which features are you most interested in learning about?",
            outcomes: ["Integration capabilities", "Analytics", "Automation", "Security"]
          }
        },
        {
          id: 'end-1',
          type: 'endNode',
          position: { x: 1000, y: 150 },
          data: {}
        }
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'greeting-1' },
        { id: 'e2-3', source: 'greeting-1', target: 'speak-pricing', sourceHandle: 'outcome-0' },
        { id: 'e2-4', source: 'greeting-1', target: 'speak-demo', sourceHandle: 'outcome-1' },
        { id: 'e2-5', source: 'greeting-1', target: 'speak-features', sourceHandle: 'outcome-2' },
        { id: 'e3-6', source: 'speak-pricing', target: 'end-1', sourceHandle: 'outcome-0' },
        { id: 'e4-6', source: 'speak-demo', target: 'end-1', sourceHandle: 'outcome-0' },
        { id: 'e5-6', source: 'speak-features', target: 'end-1', sourceHandle: 'outcome-0' }
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
          position: { x: 400, y: 100 },
          data: {
            greeting: "Welcome to our scheduling assistant! How may I help you today?",
            outcomes: [
              "Schedule new appointment",
              "Reschedule existing",
              "Cancel appointment",
              "Check availability"
            ]
          }
        },
        {
          id: 'speak-new',
          type: 'speakNode',
          position: { x: 700, y: 0 },
          data: {
            message: "Let's schedule your appointment. What type of service are you interested in?",
            outcomes: ["Consultation", "Check-up", "Follow-up", "Specialist visit"]
          }
        },
        {
          id: 'speak-reschedule',
          type: 'speakNode',
          position: { x: 700, y: 150 },
          data: {
            message: "I can help you reschedule. When was your original appointment scheduled for?",
            outcomes: ["This week", "Next week", "Later", "Not sure"]
          }
        },
        {
          id: 'speak-cancel',
          type: 'speakNode',
          position: { x: 700, y: 300 },
          data: {
            message: "I understand you need to cancel. Could you please confirm your appointment details?",
            outcomes: ["Confirm details", "Need to look up", "Request confirmation email"]
          }
        },
        {
          id: 'end-1',
          type: 'endNode',
          position: { x: 1000, y: 150 },
          data: {}
        }
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'greeting-1' },
        { id: 'e2-3', source: 'greeting-1', target: 'speak-new', sourceHandle: 'outcome-0' },
        { id: 'e2-4', source: 'greeting-1', target: 'speak-reschedule', sourceHandle: 'outcome-1' },
        { id: 'e2-5', source: 'greeting-1', target: 'speak-cancel', sourceHandle: 'outcome-2' },
        { id: 'e3-6', source: 'speak-new', target: 'end-1', sourceHandle: 'outcome-0' },
        { id: 'e4-6', source: 'speak-reschedule', target: 'end-1', sourceHandle: 'outcome-0' },
        { id: 'e5-6', source: 'speak-cancel', target: 'end-1', sourceHandle: 'outcome-0' }
      ]
    }
  }
] as const;
