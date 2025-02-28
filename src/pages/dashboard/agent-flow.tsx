
import { useParams, useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { DragProvider } from '@/components/flow/drag-context';
import { Flow } from '@/components/flow/agent-flow/flow';
import { Header } from '@/components/flow/agent-flow/header';
import { useCallback, useEffect, useState } from 'react';
import { Node, Edge } from '@xyflow/react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Agent } from '@/types/agent';
import { useToast } from '@/hooks/use-toast';
import { FlowData, FlowNode, FlowEdge } from '@/types/agent-types';

// Function to convert flow data to mermaid chart
function generateMermaidFromFlow(flowData: FlowData): string {
  if (!flowData || !flowData.nodes || !flowData.edges) {
    return 'graph TD\n  EmptyFlow[Empty Flow]';
  }

  let mermaidString = 'graph TD\n';
  
  // Map to store node ID mappings
  const nodeIdMap = new Map<string, string>();
  
  // Create simple sequential IDs for the mermaid chart - using type with sequential counter
  flowData.nodes.forEach((node: FlowNode, index: number) => {
    // Extract base node type without any numeric part
    const baseNodeType = node.type?.replace(/([A-Za-z]+).*/, '$1') || 'node';
    // Create simple node ID like speakNode-1, triggerNode-2, etc.
    const simpleId = `${baseNodeType}-${index + 1}`;
    nodeIdMap.set(node.id, simpleId);
  });
  
  // Process nodes with simplified IDs
  flowData.nodes.forEach((node: FlowNode, index: number) => {
    // Get the appropriate label based on node type and data
    let nodeLabel = 'Node';
    
    if (node.data) {
      console.log(`Node ${node.id} data:`, node.data);
      if (node.type === 'speakNode' && node.data.message) {
        nodeLabel = node.data.message.toString();
      } else if (node.type === 'greetingNode' && node.data.greeting) {
        nodeLabel = node.data.greeting.toString();
      } else if (node.type === 'triggerNode' && node.data.platform) {
        nodeLabel = node.data.platform.toString();
      } else if (node.type) {
        nodeLabel = node.type;
      }
    }
    
    // Clean label by removing newlines and quotes
    const cleanLabel = nodeLabel
      .replace(/\n/g, ' ')
      .replace(/"/g, '')
      .substring(0, 30); // Limit length
    
    const simpleId = nodeIdMap.get(node.id) || `node-${index + 1}`;
    
    mermaidString += `  ${simpleId}["${cleanLabel}"`;
    
    // Add node type as a comment instead of styling
    switch (node.type) {
      case 'speakNode':
        mermaidString += ' (Speak)';
        break;
      case 'greetingNode':
        mermaidString += ' (Greeting)';
        break;
      case 'endNode':
        mermaidString += ' (End)';
        break;
      case 'triggerNode':
        mermaidString += ' (Trigger)';
        break;
      case 'transferNode':
        mermaidString += ' (Transfer)';
        break;
      case 'webhookNode':
        mermaidString += ' (Webhook)';
        break;
    }
    
    mermaidString += ']\n';
  });
  
  // Process edges with simplified IDs
  flowData.edges.forEach((edge: FlowEdge) => {
    const sourceId = nodeIdMap.get(edge.source) || edge.source;
    const targetId = nodeIdMap.get(edge.target) || edge.target;
    mermaidString += `  ${sourceId} --> ${targetId}\n`;
  });
  
  return mermaidString;
}

// Helper function to ensure no styling classes are in the mermaid chart
function sanitizeMermaidChart(mermaidChart: string): string {
  // Remove any classDef lines that might be left from previous versions
  const cleanedChart = mermaidChart
    .replace(/classDef .+/g, '')
    // Remove any :::style references
    .replace(/:::[a-zA-Z0-9_-]+/g, '');
  
  return cleanedChart;
}

export default function AgentFlowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mermaidChart, setMermaidChart] = useState<string>('');
  const [showMermaid, setShowMermaid] = useState<boolean>(true);

  const { data: agent, refetch, isError, isLoading } = useQuery({
    queryKey: ['agent', id],
    queryFn: async () => {
      if (!id) throw new Error('No agent ID provided');
      
      console.log('[AgentFlowPage] Fetching agent data for ID:', id);
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('[AgentFlowPage] Error fetching agent:', error);
        throw error;
      }
      if (!data) {
        console.error('[AgentFlowPage] Agent not found');
        throw new Error('Agent not found');
      }

      console.log('[AgentFlowPage] Agent data retrieved:', data);
      return data as Agent;
    },
    enabled: !!id
  });

  const saveFlowMutation = useMutation({
    mutationFn: async (flowData: FlowData) => {
      if (!id) throw new Error('No agent ID provided');
      
      // Deep clone to avoid reference issues and ensure proper serialization
      const clonedData = JSON.parse(JSON.stringify(flowData));
      
      console.log("[AgentFlowPage] SAVING FLOW DATA TO SUPABASE:", clonedData);
      
      // Generate mermaid chart and ensure no styling classes are present
      let mermaidChartStr = generateMermaidFromFlow(clonedData);
      mermaidChartStr = sanitizeMermaidChart(mermaidChartStr);
      
      console.log('[AgentFlowPage] Mermaid Chart to save:', mermaidChartStr);
      setMermaidChart(mermaidChartStr);
      
      try {
        console.log(`[AgentFlowPage] Updating agent ${id} in Supabase`);
        const { data, error } = await supabase
          .from('agents')
          .update({ 
            flow: clonedData, // Store the cloned data
            mermaid_chart: mermaidChartStr // Save sanitized mermaid diagram to database
          })
          .eq('id', id)
          .select();
        
        if (error) {
          console.error('[AgentFlowPage] Error saving flow data:', error);
          throw error;
        }
        
        console.log("[AgentFlowPage] Supabase update response:", data);
        
        // Show success toast
        toast({
          title: "Flow updated",
          description: "Your changes have been saved",
          variant: "default"
        });
        
        await refetch();
        return data;
      } catch (error) {
        console.error('[AgentFlowPage] Error in saveFlowMutation:', error);
        throw error;
      }
    }
  });

  // Log initial mermaid chart when flow data is loaded
  useEffect(() => {
    if (agent?.flow) {
      try {
        console.log('[AgentFlowPage] Processing initial flow data:', agent.flow);
        const flowData = typeof agent.flow === 'string' ? JSON.parse(agent.flow) : agent.flow;
        let mermaidChartStr = generateMermaidFromFlow(flowData);
        mermaidChartStr = sanitizeMermaidChart(mermaidChartStr);
        console.log('[AgentFlowPage] Initial Mermaid Chart:', mermaidChartStr);
        setMermaidChart(mermaidChartStr);
      } catch (error) {
        console.error('[AgentFlowPage] Error generating mermaid chart:', error);
        setMermaidChart('graph TD\n  Error[Error generating chart]');
      }
    }
  }, [agent]);

  const handleNodesChange = useCallback((newNodes: Node[]) => {
    if (!agent?.flow) {
      console.log('[AgentFlowPage] handleNodesChange: No agent flow data available');
      return;
    }
    try {
      console.log('[AgentFlowPage] Nodes changed, nodes to save:', newNodes);
      
      // Deep clone to ensure no reference issues
      const clonedNodes = JSON.parse(JSON.stringify(newNodes)) as FlowNode[];
      
      // Get the current edges from the agent flow
      const currentFlow = typeof agent.flow === 'string' ? JSON.parse(agent.flow) : agent.flow;
      const currentEdges = currentFlow.edges || [];
      
      // Create a complete flow data object
      const flowData: FlowData = {
        nodes: clonedNodes,
        edges: currentEdges
      };
      
      // Save the flow data
      console.log('[AgentFlowPage] Saving updated flow data with new nodes');
      saveFlowMutation.mutate(flowData);
    } catch (error) {
      console.error('[AgentFlowPage] Error updating nodes:', error);
      toast({
        title: 'Error updating flow',
        description: 'Unable to update nodes in the flow',
        variant: 'destructive'
      });
    }
  }, [agent, saveFlowMutation, toast]);

  const handleEdgesChange = useCallback((newEdges: Edge[]) => {
    if (!agent?.flow) {
      console.log('[AgentFlowPage] handleEdgesChange: No agent flow data available');
      return;
    }
    try {
      console.log('[AgentFlowPage] Edges changed, edges to save:', newEdges);
      
      // Deep clone to ensure no reference issues
      const clonedEdges = JSON.parse(JSON.stringify(newEdges)) as FlowEdge[];
      
      // Get the current nodes from the agent flow
      const currentFlow = typeof agent.flow === 'string' ? JSON.parse(agent.flow) : agent.flow;
      const currentNodes = currentFlow.nodes || [];
      
      // Create a complete flow data object
      const flowData: FlowData = {
        nodes: currentNodes,
        edges: clonedEdges
      };
      
      // Save the flow data
      console.log('[AgentFlowPage] Saving updated flow data with new edges');
      saveFlowMutation.mutate(flowData);
    } catch (error) {
      console.error('[AgentFlowPage] Error updating edges:', error);
      toast({
        title: 'Error updating flow',
        description: 'Unable to update connections in the flow',
        variant: 'destructive'
      });
    }
  }, [agent, saveFlowMutation, toast]);

  const handleUpdateSettings = async (settings: { voiceId?: string; language?: string; humorLevel?: number; maxDurationSeconds?: number }) => {
    if (!id) return;
    console.log('[AgentFlowPage] Updating agent settings:', settings);
    const { error } = await supabase
      .from('agents')
      .update(settings)
      .eq('id', id);
    
    if (error) {
      console.error('[AgentFlowPage] Error updating agent settings:', error);
      throw error;
    }
    console.log('[AgentFlowPage] Agent settings updated successfully');
  };

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

  // Parse flow data once for the render
  const flowData = typeof agent.flow === 'string' ? JSON.parse(agent.flow) : agent.flow || { nodes: [], edges: [] };

  return (
    <DragProvider>
      <div className="h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <Header 
          agent={agent}
          onBack={() => navigate('/dashboard/agents')}
          onUpdateSettings={handleUpdateSettings}
        />
        <div className="flex-1 relative">
          <ReactFlowProvider>
            <Flow
              initialNodes={flowData.nodes || []}
              initialEdges={flowData.edges || []}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
            />
          </ReactFlowProvider>
          
          {/* Mermaid chart display for testing */}
          {showMermaid && (
            <div 
              className="absolute bottom-4 right-4 p-4 bg-white dark:bg-gray-800 border rounded-md shadow-md max-w-md max-h-96 overflow-auto z-50 text-xs"
              style={{ opacity: 0.9 }}
            >
              <div className="flex justify-between mb-2">
                <span className="font-bold">Mermaid Chart Preview</span>
                <button 
                  className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  onClick={() => setShowMermaid(false)}
                >
                  Close
                </button>
              </div>
              <pre className="whitespace-pre-wrap break-all">{mermaidChart}</pre>
            </div>
          )}
        </div>
      </div>
    </DragProvider>
  );
}
