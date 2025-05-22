
import { FlowData } from "@/types/agent";

export const getDefaultFlow = (): FlowData => {
  const timestamp = Date.now();
  
  // Create a start node
  const startNode = {
    id: `startNode-${timestamp}`,
    type: 'startNode',
    position: { x: 100, y: 250 },
    data: {
      firstMessage: '<p></p>' // Empty paragraph for Tiptap
    },
    draggable: true
  };
  
  // Create a speak node (greeting node)
  const speakNode = {
    id: `greetingNode-${timestamp}`,
    type: 'greetingNode',
    position: { x: 500, y: 250 },
    data: { 
      greeting: '<p></p>', // Empty paragraph for Tiptap
      outcomes: [],
      actions: []
    },
    draggable: true
  };
  
  // Create an end node
  const endNode = {
    id: `endNode-${timestamp}`,
    type: 'endNode',
    position: { x: 900, y: 250 },
    data: {
      message: '<p></p>' // Empty paragraph for Tiptap
    },
    draggable: true
  };
  
  // Create edges to connect the nodes
  const edge1 = {
    id: `edge-start-speak-${timestamp}`,
    source: `startNode-${timestamp}`,
    target: `greetingNode-${timestamp}`,
    type: 'default'
  };
  
  const edge2 = {
    id: `edge-speak-end-${timestamp}`,
    source: `greetingNode-${timestamp}`,
    target: `endNode-${timestamp}`,
    sourceHandle: 'default',
    type: 'default'
  };

  return {
    nodes: [startNode, speakNode, endNode],
    edges: [edge1, edge2]
  };
};

// Beta Default Flow - Use the same flow as stable mode
export const getBetaDefaultFlow = (): FlowData => {
  // Just call the stable mode's flow function
  return getDefaultFlow();
};
