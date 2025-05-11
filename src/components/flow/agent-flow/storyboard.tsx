import { Flow } from "./flow";
import { ReactFlowProvider } from "@xyflow/react";
import { DragProvider } from "@/components/flow/drag-context";

export default function AgentFlowStoryboard() {
  // Sample flow data for demonstration
  const sampleFlowData = {
    nodes: [
      {
        id: "greetingNode-1",
        type: "greetingNode",
        position: { x: 250, y: 100 },
        data: {
          greeting: "Hello, how can I help you today?",
          outcomes: [],
          actions: [],
        },
        draggable: true,
      },
      {
        id: "endNode-1",
        type: "endNode",
        position: { x: 250, y: 300 },
        data: { message: "Thank you for your time!" },
        draggable: true,
      },
    ],
    edges: [],
  };

  const handleNodesChange = (nodes) => {
    console.log("Nodes changed:", nodes);
  };

  const handleEdgesChange = (edges) => {
    console.log("Edges changed:", edges);
  };

  const handleNodeDeletion = (deletedNodes, remainingNodes, remainingEdges) => {
    console.log("Node deleted:", deletedNodes);
  };

  return (
    <div className="h-screen w-full bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <DragProvider>
        <ReactFlowProvider>
          <Flow
            initialNodes={sampleFlowData.nodes}
            initialEdges={sampleFlowData.edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onNodeDeletion={handleNodeDeletion}
          />
        </ReactFlowProvider>
      </DragProvider>
    </div>
  );
}
