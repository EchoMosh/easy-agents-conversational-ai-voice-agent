import { Smile, XCircle, Zap, PlayCircle, TestTube2 } from 'lucide-react'; // Added TestTube2 for potential Beta use

// This file defines the widget (node) types for the BETA agent flow canvas.
// It can be customized independently of the stable widget-definitions.ts

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
    type: 'startNode', // Assuming startNode type remains consistent, or it could be 'startNodeBeta'
    label: 'Start (Beta)', 
    icon: PlayCircle, 
    color: '#a78bfa', // Consider a slightly different color for beta nodes if desired
    description: 'Entry point for your BETA agent flow',
    shortcut: 'A'
  },
  { 
    type: 'greetingNode', // Assuming greetingNode type remains consistent, or 'greetingNodeBeta'
    label: 'Speak (Beta)', 
    icon: Smile, 
    color: '#60a5fa',
    description: 'Start a conversation with customizable responses (Beta version)',
    shortcut: 'S'
  },
  { 
    type: 'endNode', // Assuming endNode type remains consistent, or 'endNodeBeta'
    label: 'End (Beta)', 
    icon: XCircle, 
    color: '#f87171',
    description: 'End the conversation flow (Beta version)',
    shortcut: 'E'
  },
  // Example of a new node type exclusively for Beta:
  // {
  //   type: 'advancedFeatureNode',
  //   label: 'Advanced AI (Beta)',
  //   icon: TestTube2,
  //   color: '#34d399',
  //   description: 'Utilize an advanced AI feature, exclusive to Beta.',
  //   shortcut: 'X'
  // }
];
