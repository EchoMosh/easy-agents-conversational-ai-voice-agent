
import { useParams, useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { DragProvider } from '@/components/flow/drag-context';
import { Flow } from '@/components/flow/agent-flow/flow';
import { Header } from '@/components/flow/agent-flow/header';
import { useCallback, useState, useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Agent, FlowData } from '@/types/agent';

export default function AgentFlowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const { data: agent, refetch } = useQuery({
    queryKey: ['agent', id],
    queryFn: async () => {
      if (!id) throw new Error('No agent ID provided');
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      console.log('Fetched agent data:', data); // Debug log
      return data as Agent;
    },
    enabled: !!id
  });

  useEffect(() => {
    if (agent?.flow) {
      try {
        console.log('Raw flow data:', agent.flow); // Debug log
        const flowData = typeof agent.flow === 'string' ? JSON.parse(agent.flow) as FlowData : agent.flow as FlowData;
        console.log('Parsed flow data:', flowData); // Debug log
        
        if (!flowData || !flowData.nodes || !Array.isArray(flowData.nodes)) {
          console.error('Invalid flow data structure:', flowData);
          return;
        }

        setNodes(flowData.nodes);
        setEdges(flowData.edges || []);
      } catch (error) {
        console.error('Error parsing flow data:', error);
      }
    } else {
      console.log('No flow data found for agent:', agent); // Debug log
    }
  }, [agent]);

  const handleNodesChange = useCallback(async (newNodes: Node[]) => {
    if (!id) return;
    setNodes(newNodes);
    
    const currentFlow = {
      nodes: newNodes,
      edges
    };

    try {
      const { error } = await supabase
        .from('agents')
        .update({
          flow: JSON.stringify(currentFlow)
        })
        .eq('id', id);

      if (error) throw error;
      console.log('Flow updated successfully:', currentFlow); // Debug log
      await refetch();
    } catch (error) {
      console.error('Error updating flow:', error);
    }
  }, [id, edges, refetch]);

  const handleEdgesChange = useCallback(async (newEdges: Edge[]) => {
    if (!id) return;
    setEdges(newEdges);
    
    const currentFlow = {
      nodes,
      edges: newEdges
    };

    try {
      const { error } = await supabase
        .from('agents')
        .update({
          flow: JSON.stringify(currentFlow)
        })
        .eq('id', id);

      if (error) throw error;
      console.log('Flow updated successfully:', currentFlow); // Debug log
      await refetch();
    } catch (error) {
      console.error('Error updating flow:', error);
    }
  }, [id, nodes, refetch]);

  const handleUpdateSettings = async (settings: { voiceId?: string; language?: string }) => {
    if (!id) return;
    const { error } = await supabase
      .from('agents')
      .update(settings)
      .eq('id', id);

    if (error) throw error;
  };

  if (!agent) {
    return null;
  }

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
              initialNodes={nodes}
              initialEdges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
            />
          </ReactFlowProvider>
        </div>
      </div>
    </DragProvider>
  );
}
