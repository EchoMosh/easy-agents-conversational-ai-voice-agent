
import { FlowData } from "@/types/agent";

export const getDefaultFlow = (): FlowData => {
  // Create a default speak node
  const defaultNode = {
    id: `greetingNode-${Date.now()}`,
    type: 'greetingNode',
    position: { x: 250, y: 150 },
    data: {
      greeting: 'Hello, how can I help you today?',
      outcomes: [],
      actions: []
    }
  };

  return {
    nodes: [defaultNode],
    edges: []
  };
};
