
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

  const { data: agent, refetch, isError, isLoading } = useQuery({
    queryKey: ['agent', id],
    queryFn: async () => {
      if (!id) throw new Error('No agent ID provided');
      
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching agent:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Agent not found');
      }

      return data as Agent;
    },
    enabled: !!id,
    retry: false,
    staleTime: 0
  });

  // Load initial flow data
  useEffect(() => {
    if (!agent?.flow) {
      // Initialize with empty flow
      setNodes([]);
      setEdges([]);
      return;
    }

    try {
      const flowData = typeof agent.flow === 'string' ? JSON.parse(agent.flow) : agent.flow;

      // Ensure we have the required node properties
      const validNodes = (flowData.nodes || []).map((node: any) => ({
        ...node,
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data,
        draggable: true,
        selected: false,
        dragging: false
      }));

      // Ensure we have the required edge properties
      const validEdges = (flowData.edges || []).map((edge: any) => ({
        ...edge,
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: edge.type || 'default',
        animated: edge.animated || false
      }));

      setNodes(validNodes);
      setEdges(validEdges);

    } catch (error) {
      console.error('Error parsing flow data:', error);
      toast({
        title: "Error loading flow",
        description: "There was an error loading the flow data.",
        variant: "destructive"
      });
    }
  }, [agent, toast]);

  const saveFlowMutation = useMutation({
    mutationFn: async (flowData: { nodes: Node[]; edges: Edge[] }) => {
      if (!id) throw new Error('No agent ID provided');

      const flowString = JSON.stringify(flowData);
      
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

      await refetch();
    },
    onSuccess: () => {
      toast({
        title: "Flow saved",
        description: "Your changes have been saved successfully.",
      });
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

  const handleNodesChange = useCallback((newNodes: Node[]) => {
    setNodes(newNodes);
    
    saveFlowMutation.mutate({
      nodes: newNodes.map(node => ({
        ...node,
        selected: false,
        dragging: false
      })),
      edges
    });
  }, [edges, saveFlowMutation]);

  const handleEdgesChange = useCallback((newEdges: Edge[]) => {
    setEdges(newEdges);
    
    saveFlowMutation.mutate({
      nodes: nodes.map(node => ({
        ...node,
        selected: false,
        dragging: false
      })),
      edges: newEdges
    });
  }, [nodes, saveFlowMutation]);

  const handleUpdateSettings = async (settings: { voiceId?: string; language?: string }) => {
    if (!id) return;
    const { error } = await supabase
      .from('agents')
      .update(settings)
      .eq('id', id);

    if (error) throw error;
  };

  if (isError) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

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
