import { Lead } from "@/pages/dashboard/leads";
import { create } from "zustand";

export interface Message {
  id: string;
  leadId: string;
  content: string;
  type: 'email' | 'sms' | 'note';
  createdAt: string;
  isLoading?: boolean;
  userId?: string; // The user who sent the message
  userAvatar?: string;
  userName?: string;
}

interface LeadActivity {
  leadId: string;
  lastActive: string;
  messageCount: {
    email: number;
    sms: number;
    note: number;
    total: number;
  };
  responseTime: number; // Average response time in minutes
  activityHistory?: any[]; // Array of activity records from lead_activities table
}

interface ChatState {
  messages: Message[];
  selectedLeadId: string | null;
  messageType: 'email' | 'sms' | 'note';
  leadActivities: Record<string, LeadActivity>;
}

interface ChatActions {
  setSelectedLeadId: (leadId: string | null) => void;
  setMessageType: (messageType: 'email' | 'sms' | 'note') => void;
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  updateLeadActivity: (leadId: string, activity: Partial<LeadActivity>) => void;
}

const useChatStore = create<ChatState & ChatActions>((set) => ({
  messages: [],
  selectedLeadId: null,
  messageType: 'email',
  leadActivities: {},

  setSelectedLeadId: (leadId) => set({ selectedLeadId: leadId }),
  
  setMessageType: (messageType) => set({ messageType }),
  
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message],
    // Update lead activity when adding a message
    leadActivities: {
      ...state.leadActivities,
      [message.leadId]: {
        ...(state.leadActivities[message.leadId] || {
          leadId: message.leadId,
          lastActive: new Date().toISOString(),
          messageCount: { email: 0, sms: 0, note: 0, total: 0 },
          responseTime: 0,
        }),
        lastActive: new Date().toISOString(),
        messageCount: {
          ...(state.leadActivities[message.leadId]?.messageCount || { email: 0, sms: 0, note: 0, total: 0 }),
          [message.type]: (state.leadActivities[message.leadId]?.messageCount?.[message.type] || 0) + 1,
          total: (state.leadActivities[message.leadId]?.messageCount?.total || 0) + 1,
        },
      },
    },
  })),

  setMessages: (messages) => set({ messages }),

  updateLeadActivity: (leadId, activity) => set((state) => ({
    leadActivities: {
      ...state.leadActivities,
      [leadId]: {
        ...(state.leadActivities[leadId] || {
          leadId,
          lastActive: new Date().toISOString(),
          messageCount: { email: 0, sms: 0, note: 0, total: 0 },
          responseTime: 0,
        }),
        ...activity,
      },
    },
  })),
}));

export default useChatStore;
