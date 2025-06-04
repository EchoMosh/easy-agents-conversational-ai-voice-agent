import { useParams, useNavigate } from "react-router-dom";
import { ReactFlowProvider } from "@xyflow/react";
import { DragProvider } from "@/components/flow/drag-context";
import { Flow } from "@/components/flow/agent-flow/flow";
import { useState, useEffect } from "react"; // Removed useCallback, useEffect is already here
import { useDocumentTitle } from "@/hooks/use-document-title";
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

  const { mermaidChart, setMermaidChart } = useMermaidChart();

  const {
    flowState,
    handleNodesChange,
    handleEdgesChange,
    handleNodeDeletion,
  } = useFlowManagement(id, agent, refetch, setMermaidChart);

  // Set document title
  useDocumentTitle(
    agent ? `${agent.name || "Agent"} | Flow Editor` : "Agent Flow Editor",
    [agent?.name]
  );

  // Effect for agent data logging (moved up, but its original position was fine too)
  useEffect(() => {
    if (agent) {
      console.log("Agent data loaded:", agent);
      if (agent.name && agent.id) {
        sessionStorage.setItem(`agent_name_${agent.id}`, agent.name);
      }
    }
  }, [agent]);

  // Effect for CTRL+M shortcut to show/hide Mermaid chart
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "m") {
        event.preventDefault();
        setShowMermaid((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  // Effect to prevent wheel events (moved up before conditional returns)
  useEffect(() => {
    const preventWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("wheel", preventWheel, { passive: false });
    return () => window.removeEventListener("wheel", preventWheel);
  }, []);

  // Conditional returns AFTER all hooks have been called
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isError || !agent) {
    // Error handling (toast and navigation) is now inside useAgentData
    return null;
  }

  // Main component render
  return (
    <DragProvider>
      <div className="h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 overflow-hidden"
           style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}>
        {agent && (
          <Header
            agent={agent}
            onBack={() => navigate("/dashboard/agents")}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          <ReactFlowProvider>
            {agent && ( // This conditional rendering of Flow is fine as it's part of the JSX
              <Flow
                nodes={flowState.nodes || []}
                edges={flowState.edges || []}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onNodeDeletion={handleNodeDeletion}
              />
            )}
          </ReactFlowProvider>

          {showMermaid && (
            <MermaidChartPreview
              mermaidChart={mermaidChart}
              onClose={() => setShowMermaid(false)}
            />
          )}
        </div>

        {agent && ( // This conditional rendering is also fine
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
