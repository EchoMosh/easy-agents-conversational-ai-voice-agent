
import { useCallback, useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { FlowData, FlowNode, FlowEdge, Agent } from '@/types/agent-types';
import { Node, Edge } from '@xyflow/react';
import { useMermaidChart } from './use-mermaid-chart';

export function useFlowManagement(
  id: string | undefined, 
  agent: Agent | undefined,
  refetch: () => Promise<any>,
  setMermaidChart: React.Dispatch<React.SetStateAction<string>>
) {
  const [flowState, setFlowState] = useState<FlowData>({ nodes: [], edges: [] });
  const { generateMermaidFromFlow, sanitizeMermaidChart } = useMermaidChart();

  const saveFlowMutation = useMutation({
    mutationFn: async (flowData: FlowData) => {
      if (!id) throw new Error('No agent ID provided');
      
      const clonedData = JSON.parse(JSON.stringify(flowData));
      
      console.log("[AgentFlowPage] SAVING FLOW DATA TO SUPABASE:", clonedData);
      
      let mermaidChartStr = generateMermaidFromFlow(clonedData);
      mermaidChartStr = sanitizeMermaidChart(mermaidChartStr);
      
      console.log('[AgentFlowPage] Mermaid Chart to save:', mermaidChartStr);
      setMermaidChart(mermaidChartStr);
      
      try {
        console.log(`[AgentFlowPage] Updating agent ${id} in Supabase`);
        const { data, error } = await supabase
          .from('agents')
          .update({ 
            flow: clonedData,
            mermaid_chart: mermaidChartStr
          })
          .eq('id', id)
          .select();
        
        if (error) {
          console.error('[AgentFlowPage] Error saving flow data:', error);
          throw error;
        }
        
        console.log("[AgentFlowPage] Supabase update response:", data);
        
        await refetch();
        return data;
      } catch (error) {
        console.error('[AgentFlowPage] Error in saveFlowMutation:', error);
        throw error;
      }
    }
  });

  useEffect(() => {
    if (agent?.flow) {
      try {
        console.log('[AgentFlowPage] Processing initial flow data:', agent.flow);
        const flowData = typeof agent.flow === 'string' ? JSON.parse(agent.flow) : agent.flow;
        setFlowState(flowData as FlowData);
        
        let mermaidChartStr = generateMermaidFromFlow(flowData as FlowData);
        mermaidChartStr = sanitizeMermaidChart(mermaidChartStr);
        console.log('[AgentFlowPage] Initial Mermaid Chart:', mermaidChartStr);
        setMermaidChart(mermaidChartStr);
      } catch (error) {
        console.error('[AgentFlowPage] Error generating mermaid chart:', error);
        setMermaidChart('graph TD\n  Error[Error generating chart]');
      }
    } else {
      setFlowState({ nodes: [], edges: [] });
      setMermaidChart('graph TD\n  EmptyFlow[Empty Flow]');
    }
  }, [agent, generateMermaidFromFlow, sanitizeMermaidChart, setMermaidChart]);

  const handleNodesChange = useCallback((newNodes: Node[]) => {
    if (!agent?.flow) {
      console.log('[AgentFlowPage] handleNodesChange: No agent flow data available');
      return;
    }
    try {
      console.log('[AgentFlowPage] Nodes changed, nodes to save:', newNodes);
      
      const clonedNodes = JSON.parse(JSON.stringify(newNodes));
      
      setFlowState(prevState => {
        const newState = {
          nodes: clonedNodes,
          edges: prevState.edges || []
        };
        return newState;
      });
      
      const flowData: FlowData = {
        nodes: clonedNodes,
        edges: flowState.edges || []
      };
      
      console.log('[AgentFlowPage] Saving updated flow data with new nodes');
      saveFlowMutation.mutate(flowData);
    } catch (error) {
      console.error('[AgentFlowPage] Error updating nodes:', error);
    }
  }, [agent, saveFlowMutation, flowState]);

  const handleEdgesChange = useCallback((newEdges: Edge[]) => {
    if (!agent?.flow) {
      console.log('[AgentFlowPage] handleEdgesChange: No agent flow data available');
      return;
    }
    try {
      console.log('[AgentFlowPage] Edges changed, edges to save:', newEdges);
      
      const clonedEdges = JSON.parse(JSON.stringify(newEdges));
      
      setFlowState(prevState => {
        const newState = {
          nodes: prevState.nodes || [],
          edges: clonedEdges
        };
        return newState;
      });
      
      const flowData: FlowData = {
        nodes: flowState.nodes || [],
        edges: clonedEdges
      };
      
      console.log('[AgentFlowPage] Saving updated flow data with new edges');
      saveFlowMutation.mutate(flowData);

      let mermaidChartStr = generateMermaidFromFlow(flowData);
      mermaidChartStr = sanitizeMermaidChart(mermaidChartStr);
      setMermaidChart(mermaidChartStr);
      
    } catch (error) {
      console.error('[AgentFlowPage] Error updating edges:', error);
    }
  }, [agent, saveFlowMutation, flowState, generateMermaidFromFlow, sanitizeMermaidChart, setMermaidChart]);

  const handleNodeDeletion = useCallback((deletedNodes: Node[], remainingNodes: Node[], remainingEdges: Edge[]) => {
    console.log('[AgentFlowPage] Nodes deleted:', deletedNodes);
    console.log('[AgentFlowPage] Remaining nodes:', remainingNodes);
    console.log('[AgentFlowPage] Remaining edges:', remainingEdges);
    
    setFlowState({
      nodes: remainingNodes,
      edges: remainingEdges
    });
    
    const updatedFlowData: FlowData = {
      nodes: remainingNodes,
      edges: remainingEdges
    };
    
    let mermaidChartStr = generateMermaidFromFlow(updatedFlowData);
    mermaidChartStr = sanitizeMermaidChart(mermaidChartStr);
    setMermaidChart(mermaidChartStr);
    
    saveFlowMutation.mutate(updatedFlowData);
  }, [saveFlowMutation, generateMermaidFromFlow, sanitizeMermaidChart, setMermaidChart]);

  return {
    flowState,
    handleNodesChange,
    handleEdgesChange,
    handleNodeDeletion
  };
}
