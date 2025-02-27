
import { useParams, useNavigate } from 'react-router-dom';
import { ReactFlowProvider } from '@xyflow/react';
import { DragProvider } from '@/components/flow/drag-context';
import { Flow } from '@/components/flow/agent-flow/flow';
import { Header } from '@/components/flow/agent-flow/header';
import { useCallback, useState, useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Agent } from '@/types/agent';
import { useToast } from '@/hooks/use-toast';

export default function AgentFlowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

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

  // Load initial flow data
  useEffect(() => {
    if (agent?.flow) {
      try {
        const flowData = typeof agent.flow === 'string' ? JSON.parse(agent.flow) : agent.flow;
        console.log('Loading flow data:', flowData);
        if (flowData.nodes) {
          console.log('Setting nodes:', flowData.nodes);
          setNodes(flowData.nodes);
        }
        if (flowData.edges) {
          console.log('Setting edges:', flowData.edges);
          setEdges(flowData.edges);
        }
      } catch (error) {
        console.error('Error parsing flow data:', error);
      }
    }
  }, [agent]);

  // Setup real-time updates with debounce
  const saveFlowMutation = useMutation({
    mutationFn: async (flowData: { nodes: Node[]; edges: Edge[] }) => {
      if (!id) throw new Error('No agent ID provided');
      
      const flowString = JSON.stringify(flowData);
      console.log('Saving flow to Supabase:', flowString);
      
      const { error } = await supabase
        .from('agents')
        .update({
          flow: flowString
        })
        .eq('id', id);

      if (error) {
        console.error('Error saving to Supabase:', error);
        throw error;
      }
      console.log('Successfully saved flow to Supabase');
    },
    onError: (error) => {
      console.error('Error saving flow:', error);
      toast({
        title: "Error saving flow",
        description: "Your changes couldn't be saved. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Debounced save function
  const debouncedSave = useCallback((newNodes: Node[], newEdges: Edge[]) => {
    const flowData = {
      nodes: newNodes.map(node => ({
        ...node,
        selected: false,
        dragging: false
      })),
      edges: newEdges
    };
    console.log('Debounced save triggered with:', flowData);
    saveFlowMutation.mutate(flowData);
  }, [saveFlowMutation]);

  const handleNodesChange = useCallback((newNodes: Node[]) => {
    console.log('Nodes changed:', newNodes);
    setNodes(newNodes);
    debouncedSave(newNodes, edges);
  }, [edges, debouncedSave]);

  const handleEdgesChange = useCallback((newEdges: Edge[]) => {
    console.log('Edges changed:', newEdges);
    setEdges(newEdges);
    debouncedSave(nodes, newEdges);
  }, [nodes, debouncedSave]);

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
