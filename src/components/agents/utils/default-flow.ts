
import { NodeData, FlowData } from "@/types/agent";

export const getDefaultFlow = (platform?: string, action?: string, objective?: string): FlowData => {
  const baseFlow = {
    nodes: [
      {
        id: 'trigger-1',
        type: 'triggerNode' as const,
        position: { x: 100, y: 100 },
        data: {
          platform: platform as NodeData['platform'],
          action: action as NodeData['action']
        }
      },
      {
        id: 'greeting-1',
        type: 'greetingNode' as const,
        position: { x: 500, y: 100 },
        data: {
          greeting: "Hello! How can I help you today?",
          outcomes: ["I need help with a product", "I have a question"]
        }
      },
      {
        id: 'speak-1',
        type: 'speakNode' as const,
        position: { x: 900, y: 100 },
        data: {
          message: "I'd be happy to assist you. Please let me know what you need help with.",
          outcomes: ["Thanks, that's all", "I have another question"]
        }
      }
    ],
    edges: [
      {
        id: 'trigger-to-greeting',
        source: 'trigger-1',
        target: 'greeting-1'
      },
      {
        id: 'greeting-to-speak',
        source: 'greeting-1',
        target: 'speak-1',
        sourceHandle: 'outcome-0'
      }
    ]
  };

  if (objective === 'live_transfer') {
    baseFlow.nodes.push({
      id: 'transfer-1',
      type: 'transferNode' as const,
      position: { x: 1300, y: 100 },
      data: {
        message: "I'll transfer you to an available agent now.",
        outcomes: [],
        contacts: [] as Array<{ id: string; name: string; phoneNumber: string }>
      }
    });
    baseFlow.edges.push({
      id: 'speak-to-transfer',
      source: 'speak-1',
      target: 'transfer-1',
      sourceHandle: 'outcome-0'
    });
  } else {
    baseFlow.nodes.push({
      id: 'end-1',
      type: 'endNode' as const,
      position: { x: 1300, y: 100 },
      data: {
        message: "Thank you for your time. Goodbye!",
        outcomes: []
      }
    });
    baseFlow.edges.push({
      id: 'speak-to-end',
      source: 'speak-1',
      target: 'end-1',
      sourceHandle: 'outcome-0'
    });
  }

  return baseFlow;
};
