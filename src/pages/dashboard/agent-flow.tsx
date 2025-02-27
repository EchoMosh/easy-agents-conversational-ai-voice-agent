
import { useParams, useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { DragProvider } from '@/components/flow/drag-context';
import { Flow } from '@/components/flow/agent-flow/flow';
import { Header } from '@/components/flow/agent-flow/header';
import { useCallback, useState } from 'react';
import { Node, Edge } from '@xyflow/react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Agent } from '@/types/agent';

const initialNodes: Node[] = [
  {
    id: 'trigger-1',
    type: 'triggerNode',
    position: { x: 100, y: 100 },
    data: { platform: 'facebook', action: 'new_lead' }
  },
  {
    id: 'greeting-1',
    type: 'greetingNode',
    position: { x: 400, y: 100 },
    data: { greeting: 'Hello! How can I help you today?', outcomes: ['I need help', 'Just browsing'] }
  }
];

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: 'trigger-1',
    target: 'greeting-1',
    type: 'smoothstep',
    animated: true
  }
];

export default function AgentFlowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const { data: agent } = useQuery({
    queryKey: ['agent', id],
    queryFn: async () => {
      if (!id) throw new Error('No agent ID provided');
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Agent;
    },
    enabled: !!id
  });

  const handleNodesChange = useCallback((newNodes: Node[]) => {
    console.log('Nodes changed:', newNodes);
    setNodes(newNodes);
  }, []);

  const handleEdgesChange = useCallback((newEdges: Edge[]) => {
    console.log('Edges changed:', newEdges);
    setEdges(newEdges);
  }, []);

  const handleUpdateSettings = async (settings: { voiceId?: string; language?: string }) => {
    if (!id) return;
    const { error } = await supabase
      .from('agents')
      .update(settings)
      .eq('id', id);

    if (error) throw error;
  };

  if (!agent) {
    return null; // or a loading state
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
