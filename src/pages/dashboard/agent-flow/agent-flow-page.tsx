import { useParams, useNavigate } from "react-router-dom";
import { ReactFlowProvider } from "@xyflow/react";
import { DragProvider } from "@/components/flow/drag-context";
import { Flow } from "@/components/flow/agent-flow/flow";
import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { useDocumentTitle } from "@/hooks/use-document-title";
import { useToast } from "@/hooks/use-toast";
import { AgentTrainingPopup } from "@/components/agents/training/agent-training-popup";
import { useAgentData } from "./hooks/use-agent-data";
import { useMermaidChart } from "./hooks/use-mermaid-chart";
import { useFlowManagement } from "./hooks/use-flow-management";
import { MermaidChartPreview } from "./components/mermaid-chart-preview";
// Removed CommandDeckContainer import - using stable mode only
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

  useEffect(() => {
    if (agent) {
      console.log("Agent data loaded:", agent);
      if (agent.name && agent.id) {
        sessionStorage.setItem(`agent_name_${agent.id}`, agent.name);
      }
    }
  }, [agent]);

  useDocumentTitle(
    agent ? `${agent.name || "Agent"} | Flow Editor` : "Agent Flow Editor",
    [agent?.name]
  );

  const { mermaidChart, setMermaidChart } = useMermaidChart();

  const {
    flowState,
    handleNodesChange,
    handleEdgesChange,
    handleNodeDeletion,
  } = useFlowManagement(id, agent, refetch, setMermaidChart);

  useCallback(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "m") {
        event.preventDefault();
        setShowMermaid((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
  
  const creationMode = useMemo(() => {
    if (!agent) return 'stable';
    
    // DEBUG LOGS - Add these logs to understand what mode is being used
    console.log("%c👁️ AGENT CREATION MODE DEBUG", "background-color: purple; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold", {
      fromDatabase: agent.creation_mode,
      agentId: agent.id,
      fromLocalStorage: agent.id ? localStorage.getItem(`agent_${agent.id}_mode`) : null,
      nameContainsBeta: agent.name?.toLowerCase().includes('beta'),
      actualAgentObject: agent // Log the entire agent object to inspect
    });
    
    // Regular logic - Prioritize agent.creation_mode from the database
    if (agent.creation_mode) {
      console.log("Using creation_mode from database:", agent.creation_mode);
      return agent.creation_mode;
    }
    
    // Fallback for older agents or if DB field isn't populated yet
    const storedMode = localStorage.getItem(`agent_${agent.id}_mode`);
    if (storedMode === 'beta' || storedMode === 'stable') {
      console.log("Using mode from localStorage:", storedMode);
      return storedMode;
    }
    
    const isBetaFromName = agent.name?.toLowerCase().includes('beta') || false;
    console.log("Using mode inferred from name:", isBetaFromName ? 'beta' : 'stable');
    return isBetaFromName ? 'beta' : 'stable';
  }, [agent]);

  // Prevent wheel events
  useEffect(() => {
    const preventWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("wheel", preventWheel, { passive: false });
    return () => window.removeEventListener("wheel", preventWheel);
  }, []);

  // BETA MODE RENDERING (now similar to stable, with CommandDeckInput)
  if (creationMode === 'beta') {
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

          <div className="flex-1 flex flex-col overflow-hidden min-h-0 relative"> {/* Added relative for positioning CommandDeckInput */}
            <ReactFlowProvider>
              {agent && (
                <Flow
                  initialNodes={flowData.nodes || []}
                  initialEdges={flowData.edges || []}
                  onNodesChange={handleNodesChange}
                  onEdgesChange={handleEdgesChange}
                  onNodeDeletion={handleNodeDeletion}
                  creationMode={creationMode} 
                />
              )}
            </ReactFlowProvider>

          {/* CommandDeckInput is now handled by ViewportPortal in Flow.tsx */}

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

  // STABLE MODE RENDERING (remains the same)
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
            {agent && (
              <Flow
                initialNodes={flowData.nodes || []}
                initialEdges={flowData.edges || []}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onNodeDeletion={handleNodeDeletion}
                creationMode={creationMode} 
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
