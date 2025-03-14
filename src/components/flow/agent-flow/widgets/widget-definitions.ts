
import { Smile, XCircle, Zap } from 'lucide-react';

export interface WidgetDefinition {
  type: string;
  label: string;
  icon: React.ElementType;
  color: string;
  description: string;
  shortcut: string;
}

export const widgets: WidgetDefinition[] = [
  { 
    type: 'greetingNode', 
    label: 'Speak', 
    icon: Smile, 
    color: '#60a5fa',
    description: 'Start a conversation with customizable responses',
    shortcut: 'S'
  },
  { 
    type: 'endNode', 
    label: 'End', 
    icon: XCircle, 
    color: '#f87171',
    description: 'End the conversation flow',
    shortcut: 'E'
  },
  { 
    type: 'triggerNode', 
    label: 'Trigger', 
    icon: Zap, 
    color: '#fbbf24',
    description: 'Define when this flow should start',
    shortcut: 'T'
  }
];
