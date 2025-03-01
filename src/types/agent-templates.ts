
import type { FlowData } from './agent-types';

// Define the type inline to avoid circular dependencies
type AgentRole = 'virtual_assistant' | 'customer_support' | 'sales_agent' | 'appointment_scheduler';

type AgentTemplate = {
  id: string;
  name: string;
  description: string;
  role: AgentRole;
  flow: FlowData;
};

export const AGENT_TEMPLATES: readonly AgentTemplate[] = [
  {
    id: 'customer-support',
    name: 'Customer Support Agent',
    description: 'Handles customer inquiries and resolves issues efficiently',
    role: 'customer_support',
    flow: {
      nodes: [
        {
          id: 'trigger-1',
          type: 'triggerNode',
          position: { x: 50, y: 250 },
          data: {
            platform: 'facebook',
            action: 'message_received'
          }
        },
        {
          id: 'greeting-1',
          type: 'greetingNode',
          position: { x: 350, y: 250 },
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
          id: 'end-1',
          type: 'endNode',
          position: { x: 750, y: 250 },
          data: {}
        }
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'greeting-1' },
        { id: 'e2-3', source: 'greeting-1', target: 'end-1', sourceHandle: 'outcome-0' }
      ]
    }
  },
  {
    id: 'sales-agent',
    name: 'Sales Representative',
    description: 'Qualifies leads and books product demonstrations',
    role: 'sales_agent',
    flow: {
      nodes: [
        {
          id: 'trigger-1',
          type: 'triggerNode',
          position: { x: 50, y: 250 },
          data: {
            platform: 'hubspot',
            action: 'new_contact'
          }
        },
        {
          id: 'greeting-1',
          type: 'greetingNode',
          position: { x: 350, y: 250 },
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
          id: 'end-1',
          type: 'endNode',
          position: { x: 750, y: 250 },
          data: {}
        }
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'greeting-1' },
        { id: 'e2-3', source: 'greeting-1', target: 'end-1', sourceHandle: 'outcome-0' }
      ]
    }
  },
  {
    id: 'appointment-scheduler',
    name: 'Appointment Scheduler',
    description: 'Manages appointment bookings and reminders',
    role: 'appointment_scheduler',
    flow: {
      nodes: [
        {
          id: 'trigger-1',
          type: 'triggerNode',
          position: { x: 50, y: 250 },
          data: {
            platform: 'gohighlevel',
            action: 'contact_created'
          }
        },
        {
          id: 'greeting-1',
          type: 'greetingNode',
          position: { x: 350, y: 250 },
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
          id: 'end-1',
          type: 'endNode',
          position: { x: 750, y: 250 },
          data: {}
        }
      ],
      edges: [
        { id: 'e1-2', source: 'trigger-1', target: 'greeting-1' },
        { id: 'e2-3', source: 'greeting-1', target: 'end-1', sourceHandle: 'outcome-0' }
      ]
    }
  }
] as const;
