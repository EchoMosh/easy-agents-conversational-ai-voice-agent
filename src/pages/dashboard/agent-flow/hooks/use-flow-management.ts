import { useCallback, useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FlowData, FlowNode, FlowEdge, Agent } from "@/types/agent-types";
import { Node, Edge } from "@xyflow/react";
import { useMermaidChart } from "./use-mermaid-chart";

export function useFlowManagement(
  id: string | undefined,
  agent: Agent | undefined,
  refetch: () => Promise<any>,
  setMermaidChart: React.Dispatch<React.SetStateAction<string>>,
) {
  const [flowState, setFlowState] = useState<FlowData>({
    nodes: [],
    edges: [],
  });
  const initialLoadDone = useRef(false);
  const { generateMermaidFromFlow, sanitizeMermaidChart } = useMermaidChart();

  const saveFlowMutation = useMutation({
    mutationFn: async (flowData: FlowData) => {
      if (!id) throw new Error("No agent ID provided");

      const clonedData = JSON.parse(JSON.stringify(flowData));

      console.log("[AgentFlowPage] SAVING FLOW DATA TO SUPABASE:", clonedData);

      let mermaidChartStr = generateMermaidFromFlow(clonedData);
      mermaidChartStr = sanitizeMermaidChart(mermaidChartStr);

      console.log("[AgentFlowPage] Mermaid Chart to save:", mermaidChartStr);
      setMermaidChart(mermaidChartStr);

      try {
        console.log(`[AgentFlowPage] Updating agent ${id} in Supabase`);
        const { data, error } = await supabase
          .from("agents")
          .update({
            flow: clonedData,
            mermaid_chart: mermaidChartStr,
          })
          .eq("id", id)
          .select();

        if (error) {
          console.error("[AgentFlowPage] Error saving flow data:", error);
          throw error;
        }

        console.log("[AgentFlowPage] Supabase update response:", data);

        // Don't refetch - local state is already correct and refetch would
        // overwrite it with potentially stale DB data before the write completes
        return data;
      } catch (error) {
        console.error("[AgentFlowPage] Error in saveFlowMutation:", error);
        throw error;
      }
    },
  });

  useEffect(() => {
    if (agent?.flow) {
      try {
        console.log(
          "[AgentFlowPage] Processing flow data from agent:",
          agent.flow,
        );
        const flowData =
          typeof agent.flow === "string" ? JSON.parse(agent.flow) : agent.flow;

        console.log("[AgentFlowPage] Parsed flow data:", flowData);
        setFlowState(flowData as FlowData);
        initialLoadDone.current = true;

        let mermaidChartStr = generateMermaidFromFlow(flowData as FlowData);
        mermaidChartStr = sanitizeMermaidChart(mermaidChartStr);
        console.log(
          "[AgentFlowPage] Generated Mermaid Chart:",
          mermaidChartStr,
        );
        setMermaidChart(mermaidChartStr);
      } catch (error) {
        console.error("[AgentFlowPage] Error processing flow data:", error);
        setFlowState({ nodes: [], edges: [] });
        setMermaidChart("graph TD\n  Error[Error processing flow]");
      }
    } else {
      console.log(
        "[AgentFlowPage] No flow data available, setting empty state",
      );
      setFlowState({ nodes: [], edges: [] });
      setMermaidChart("graph TD\n  EmptyFlow[Empty Flow]");
    }
  }, [agent, generateMermaidFromFlow, sanitizeMermaidChart, setMermaidChart]);

  // Debounce save: only persist to DB after dragging stops
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedSave = useCallback(
    (flowData: FlowData) => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        saveFlowMutation.mutate(flowData);
        let mermaidChartStr = generateMermaidFromFlow(flowData);
        mermaidChartStr = sanitizeMermaidChart(mermaidChartStr);
        setMermaidChart(mermaidChartStr);
      }, 300);
    },
    [
      saveFlowMutation,
      generateMermaidFromFlow,
      sanitizeMermaidChart,
      setMermaidChart,
    ],
  );

  const handleNodesChange = useCallback(
    (newNodes: Node[]) => {
      if (!agent || !initialLoadDone.current) return;
      try {
        setFlowState((prevState) => {
          const newState = {
            nodes: newNodes,
            edges: prevState.edges || [],
          };
          debouncedSave(newState);
          return newState;
        });
      } catch (error) {
        console.error("[AgentFlowPage] Error updating nodes:", error);
      }
    },
    [agent, debouncedSave],
  );

  const handleEdgesChange = useCallback(
    (newEdges: Edge[]) => {
      if (!agent || !initialLoadDone.current) return;
      try {
        setFlowState((prevState) => {
          const newState = {
            nodes: prevState.nodes || [],
            edges: newEdges,
          };
          debouncedSave(newState);
          return newState;
        });
      } catch (error) {
        console.error("[AgentFlowPage] Error updating edges:", error);
      }
    },
    [agent, debouncedSave],
  );

  const handleNodeDeletion = useCallback(
    (deletedNodes: Node[], remainingNodes: Node[], remainingEdges: Edge[]) => {
      console.log("[AgentFlowPage] Nodes deleted:", deletedNodes);
      console.log("[AgentFlowPage] Remaining nodes:", remainingNodes);
      console.log("[AgentFlowPage] Remaining edges:", remainingEdges);

      setFlowState({
        nodes: remainingNodes,
        edges: remainingEdges,
      });

      const updatedFlowData: FlowData = {
        nodes: remainingNodes,
        edges: remainingEdges,
      };

      let mermaidChartStr = generateMermaidFromFlow(updatedFlowData);
      mermaidChartStr = sanitizeMermaidChart(mermaidChartStr);
      setMermaidChart(mermaidChartStr);

      saveFlowMutation.mutate(updatedFlowData);
    },
    [
      saveFlowMutation,
      generateMermaidFromFlow,
      sanitizeMermaidChart,
      setMermaidChart,
    ],
  );

  return {
    flowState,
    handleNodesChange,
    handleEdgesChange,
    handleNodeDeletion,
  };
}
