import { useParams, useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { DragProvider } from '@/components/flow/drag-context';
import { Flow } from '@/components/flow/agent-flow/flow';
import { Header } from '@/components/flow/agent-flow/header';
import { useCallback, useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Agent, FlowData, FlowNode, FlowEdge } from '@/types/agent-types';
import { useToast } from '@/hooks/use-toast';
import { AgentTrainingPopup } from '@/components/agents/training/agent-training-popup';
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';

function stripHtmlTags(html: string): string {
  if (!html) return '';
  
  let content = html.replace(/<span class="editor-variable"[^>]*data-variable="([^"]+)"[^>]*>\{([^}]+)\}<\/span>/g, '{$2}');
  
  content = content.replace(/<\/?[^>]+(>|$)/g, '');
  
  return content;
}

function generateMermaidFromFlow(flowData: FlowData): string {
  if (!flowData || !flowData.nodes || !flowData.edges) {
    return 'graph TD\n  EmptyFlow[Empty Flow]';
  }

  if (Array.isArray(flowData.nodes) && flowData.nodes.length === 0) {
    return 'graph TD\n  EmptyFlow[Empty Flow]';
  }

  let mermaidString = 'graph TD\n';
  
  const nodeIdMap = new Map<string, string>();
  
  const nodeTypeCounter: Record<string, number> = {};
  
  flowData.nodes.forEach((node: FlowNode) => {
    let baseNodeType = node.type?.replace(/([A-Za-z]+).*/, '$1') || 'node';
    
    if (baseNodeType === 'greetingNode') {
      baseNodeType = 'speak';
    } else if (baseNodeType === 'speakNode') {
      baseNodeType = 'speak';
    } else if (baseNodeType === 'endNode') {
      baseNodeType = 'end';
    } else if (baseNodeType === 'triggerNode') {
      baseNodeType = 'trigger';
    } else if (baseNodeType === 'webhookNode') {
      baseNodeType = 'webhook';
    } else if (baseNodeType === 'transferNode') {
      baseNodeType = 'transfer';
    }
    
    if (!nodeTypeCounter[baseNodeType]) {
      nodeTypeCounter[baseNodeType] = 1;
    } else {
      nodeTypeCounter[baseNodeType]++;
    }
    
    const simpleId = `${baseNodeType}-${nodeTypeCounter[baseNodeType]}`;
    nodeIdMap.set(node.id, simpleId);
  });
  
  flowData.nodes.forEach((node: FlowNode) => {
    let nodeLabel = '';
    let outcomeLabels: string[] = [];
    
    if (node.data) {
      if (node.type === 'speakNode' && node.data.message) {
        nodeLabel = stripHtmlTags(String(node.data.message));
        if (node.data.outcomes && Array.isArray(node.data.outcomes)) {
          outcomeLabels = node.data.outcomes.map(outcome => stripHtmlTags(String(outcome)));
        }
      } else if (node.type === 'greetingNode' && node.data.greeting) {
        nodeLabel = stripHtmlTags(String(node.data.greeting));
        if (node.data.outcomes && Array.isArray(node.data.outcomes)) {
          outcomeLabels = node.data.outcomes.map(outcome => stripHtmlTags(String(outcome)));
        }
      } else if (node.type === 'endNode' && node.data.message) {
        nodeLabel = `End: ${stripHtmlTags(String(node.data.message))}`;
      } else if (node.type === 'endNode') {
        nodeLabel = 'End Call';
      } else if (node.type === 'triggerNode' && node.data.platform) {
        nodeLabel = String(node.data.platform);
      } else if (node.type === 'webhookNode') {
        nodeLabel = node.data.url ? `Webhook: ${node.data.url}` : 'Webhook';
      }
    }
    
    const cleanLabel = nodeLabel
      .replace(/\n/g, ' ')
      .replace(/"/g, '');
    
    const simpleId = nodeIdMap.get(node.id) || `unknown-${node.id}`;
    
    if (cleanLabel) {
      mermaidString += `  ${simpleId}["${cleanLabel}"]\n`;
    } else {
      mermaidString += `  ${simpleId}[]\n`;
    }
    
    if (outcomeLabels.length > 0) {
      mermaidString += `  %% Node ${simpleId} has outcomes: ${outcomeLabels.join(', ')}\n`;
    }
  });
  
  const validEdges = flowData.edges.filter((edge: FlowEdge) => 
    nodeIdMap.has(edge.source) && nodeIdMap.has(edge.target)
  );
  
  validEdges.forEach((edge: FlowEdge) => {
    const sourceId = nodeIdMap.get(edge.source) || edge.source;
    const targetId = nodeIdMap.get(edge.target) || edge.target;
    
    const sourceNode = flowData.nodes.find(node => node.id === edge.source);
    let edgeLabel = '';
    
    if (sourceNode && sourceNode.data && (sourceNode.type === 'speakNode' || sourceNode.type === 'greetingNode')) {
      const outcomes = sourceNode.data.outcomes && Array.isArray(sourceNode.data.outcomes) 
        ? sourceNode.data.outcomes 
        : [];
      
      if (edge.sourceHandle && edge.sourceHandle.startsWith('outcome-')) {
        const outcomeIndex = parseInt(edge.sourceHandle.replace('outcome-', ''), 10);
        if (!isNaN(outcomeIndex) && outcomeIndex < outcomes.length) {
          const outcomeText = stripHtmlTags(outcomes[outcomeIndex]).replace(/"/g, '');
          edgeLabel = `|"${outcomeText}"|`;
        }
      }
    }
    
    mermaidString += `  ${sourceId} --> ${edgeLabel} ${targetId}\n`;
  });
  
  return mermaidString;
}

function sanitizeMermaidChart(mermaidChart: string): string {
  return mermaidChart
    .replace(/classDef .+/g, '')
    .replace(/:::[a-zA-Z0-9_-]+/g, '');
}

export default function AgentFlowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mermaidChart, setMermaidChart] = useState<string>('');
  const [showMermaid, setShowMermaid] = useState<boolean>(false);
  const [flowState, setFlowState] = useState<FlowData>({ nodes: [], edges: [] });
  const [showTraining, setShowTraining] = useState(false);

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

      if (!data.v_agent_id) {
        console.error('[AgentFlowPage] Agent missing v_agent_id');
        throw new Error('Agent has not been properly initialized with n8n');
      }

      console.log('[AgentFlowPage] Agent data retrieved:', data);
      return data as Agent;
    },
    enabled: !!id
  });

  useEffect(() => {
    if (isError) {
      toast({
        variant: "destructive",
        title: "Agent Error",
        description: "This agent has not been properly initialized. Redirecting back to agents list.",
      });
      const timer = setTimeout(() => {
        navigate('/dashboard/agents');
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [isError, navigate, toast]);

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
  }, [agent]);

  const handleNodesChange = useCallback((newNodes: any[]) => {
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

  const handleEdgesChange = useCallback((newEdges: any[]) => {
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
  }, [agent, saveFlowMutation, flowState]);

  const handleNodeDeletion = useCallback((deletedNodes: any[], remainingNodes: any[], remainingEdges: any[]) => {
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
  }, [saveFlowMutation]);

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

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === 'm') {
        event.preventDefault();
        setShowMermaid(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
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

  const flowData = typeof agent.flow === 'string' 
    ? JSON.parse(agent.flow) 
    : agent.flow || { nodes: [], edges: [] };

  return (
    <DragProvider>
      <div className="h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="flex justify-between items-center">
          <Header 
            agent={agent}
            onBack={() => navigate('/dashboard/agents')}
            onUpdateSettings={handleUpdateSettings}
          />
        </div>
        
        <div className="flex flex-col flex-1">
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
            <div 
              className="absolute bottom-4 right-4 p-4 bg-white dark:bg-gray-800 border rounded-md shadow-md max-w-md max-h-96 overflow-auto z-50 text-xs"
              style={{ opacity: 0.9 }}
            >
              <div className="flex justify-between mb-2">
                <span className="font-bold">Mermaid Chart Preview (CTRL+M)</span>
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
