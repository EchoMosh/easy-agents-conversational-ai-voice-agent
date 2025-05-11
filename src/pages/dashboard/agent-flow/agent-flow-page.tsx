import { useParams, useNavigate } from "react-router-dom";
import { ReactFlowProvider } from "@xyflow/react";
import { DragProvider } from "@/components/flow/drag-context";
import { Flow } from "@/components/flow/agent-flow/flow";
import { useCallback, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { AgentTrainingPopup } from "@/components/agents/training/agent-training-popup";
import { useAgentData } from "./hooks/use-agent-data";
import { useMermaidChart } from "./hooks/use-mermaid-chart";
import { useFlowManagement } from "./hooks/use-flow-management";
import { MermaidChartPreview } from "./components/mermaid-chart-preview";
import { Header } from "@/components/flow/agent-flow/header";

export default function AgentFlowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showMermaid, setShowMermaid] = useState<boolean>(false);
  const [showTraining, setShowTraining] = useState(false);

  // Custom hooks for managing agent data and flow
  const { agent, refetch, isError, isLoading, handleUpdateSettings } =
    useAgentData(id, navigate, toast);

  // Log agent data to debug
  useEffect(() => {
    if (agent) {
      console.log("Agent data loaded:", agent);
    }
  }, [agent]);

  const { mermaidChart, setMermaidChart } = useMermaidChart();

  const {
    flowState,
    handleNodesChange,
    handleEdgesChange,
    handleNodeDeletion,
  } = useFlowManagement(id, agent, refetch, setMermaidChart);

  // Keyboard shortcut for toggling mermaid chart
  useCallback(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "m") {
        event.preventDefault();
        setShowMermaid((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError || !agent) {
    return null;
  }

  const flowData =
    typeof agent.flow === "string"
      ? JSON.parse(agent.flow)
      : agent.flow || { nodes: [], edges: [] };

  // Add a style to hide scrollbars
  useEffect(() => {
    // Prevent wheel events
    const preventWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Add the event listener with passive: false to allow preventDefault
    window.addEventListener("wheel", preventWheel, { passive: false });

    // Clean up
    return () => {
      window.removeEventListener("wheel", preventWheel);
    };
  }, []);

  return (
    <DragProvider>
      <div
        className="h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 overflow-hidden"
        style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
      >
        {agent && (
          <Header
            agent={agent}
            onBack={() => navigate("/dashboard/agents")}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        <div className="flex flex-col flex-1 overflow-hidden">
          <ReactFlowProvider>
            <Flow
              initialNodes={flowData.nodes || []}
              initialEdges={flowData.edges || []}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onNodeDeletion={handleNodeDeletion}
            />
          </ReactFlowProvider>

          {showMermaid && (
            <MermaidChartPreview
              mermaidChart={mermaidChart}
              onClose={() => setShowMermaid(false)}
            />
          )}
        </div>

        {agent && (
          <AgentTrainingPopup
            agent={agent}
            open={showTraining}
            onOpenChange={setShowTraining}
          />
        )}
      </div>
    </DragProvider>
  );
}
