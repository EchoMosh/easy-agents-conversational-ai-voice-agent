
import { useParams, useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { DragProvider } from '@/components/flow/drag-context';
import { Flow } from '@/components/flow/agent-flow/flow';
import { Header } from '@/components/flow/agent-flow/header';
import { useCallback } from 'react';
import { Node, Edge } from '@xyflow/react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Agent } from '@/types/agent';
import { useToast } from '@/hooks/use-toast';
import { FlowData, FlowNode, FlowEdge } from '@/types/agent-types';

export default function AgentFlowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: agent, refetch, isError, isLoading } = useQuery({
    queryKey: ['agent', id],
    queryFn: async () => {
      if (!id) throw new Error('No agent ID provided');
      
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Agent not found');

      return data as Agent;
    },
    enabled: !!id
  });

  const saveFlowMutation = useMutation({
    mutationFn: async (flowData: FlowData) => {
      if (!id) throw new Error('No agent ID provided');
      const { error } = await supabase
        .from('agents')
        .update({ 
          flow: JSON.stringify(flowData) // Convert to string to satisfy Json type
        })
        .eq('id', id);
      
      if (error) throw error;
      await refetch();
    }
  });

  const handleNodesChange = useCallback((newNodes: Node[]) => {
    if (!agent?.flow) return;
    const currentFlow = typeof agent.flow === 'string' ? JSON.parse(agent.flow) : agent.flow;
    const flowData: FlowData = {
      nodes: newNodes as FlowNode[],
      edges: currentFlow.edges || []
    };
    saveFlowMutation.mutate(flowData);
  }, [agent, saveFlowMutation]);

  const handleEdgesChange = useCallback((newEdges: Edge[]) => {
    if (!agent?.flow) return;
    const currentFlow = typeof agent.flow === 'string' ? JSON.parse(agent.flow) : agent.flow;
    const flowData: FlowData = {
      nodes: currentFlow.nodes || [],
      edges: newEdges as FlowEdge[]
    };
    saveFlowMutation.mutate(flowData);
  }, [agent, saveFlowMutation]);

  const handleUpdateSettings = async (settings: { voiceId?: string; language?: string }) => {
    if (!id) return;
    const { error } = await supabase
      .from('agents')
      .update(settings)
      .eq('id', id);
    if (error) throw error;
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
        </div>
      </div>
    </DragProvider>
  );
}
