
import { FlowData } from "@/types/agent";

export const getDefaultFlow = (): FlowData => {
  // Create a default greeting node
  const defaultGreetingNode = {
    id: `greetingNode-${Date.now()}`,
    type: 'greetingNode',
    position: { x: 250, y: 150 },
    data: { 
      greeting: '', // Empty greeting by default
      outcomes: [],
      actions: []
    },
    draggable: true
  };

  return {
    nodes: [defaultGreetingNode],
    edges: []
  };
};
