
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

  // First, let's verify we're working with the correct agent
  const { data: agent, refetch, isError, error } = useQuery({
    queryKey: ['agent', id],
    queryFn: async () => {
      if (!id) throw new Error('No agent ID provided');
      console.log('Fetching agent with ID:', id);
      
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', id)
        .maybeSingle(); // Using maybeSingle instead of single to handle no results gracefully

      if (error) {
        console.error('Error fetching agent:', error);
        throw error;
      }

      if (!data) {
        throw new Error('Agent not found');
      }
      
      console.log('Fetched agent data:', data);
      return data as Agent;
    },
    enabled: !!id,
    retry: false, // Don't retry if agent doesn't exist
    onError: (err) => {
      console.error('Error loading agent:', err);
      toast({
        title: "Error loading agent",
        description: "The requested agent could not be found or accessed.",
        variant: "destructive"
      });
      // Redirect back to agents list after a short delay
      setTimeout(() => navigate('/dashboard/agents'), 2000);
    }
  });

  // Load initial flow data
  useEffect(() => {
    if (agent?.flow) {
      try {
        console.log('Raw flow data from agent:', agent.flow);
        const flowData = typeof agent.flow === 'string' ? JSON.parse(agent.flow) : agent.flow;
        console.log('Parsed flow data:', flowData);
        
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
        toast({
          title: "Error loading flow",
          description: "There was an error loading the flow data.",
          variant: "destructive"
        });
      }
    } else {
      console.log('No flow data found for agent:', id);
    }
  }, [agent, id]);

  // Setup real-time updates with debounce
  const saveFlowMutation = useMutation({
    mutationFn: async (flowData: { nodes: Node[]; edges: Edge[] }) => {
      if (!id) throw new Error('No agent ID provided');
      
      const flowString = JSON.stringify(flowData);
      console.log('Attempting to save flow for agent:', id);
      console.log('Flow data to save:', flowString);
      
      const { data, error } = await supabase
        .from('agents')
        .update({
          flow: flowString
        })
        .eq('id', id)
        .select();

      if (error) {
        console.error('Error saving to Supabase:', error);
        throw error;
      }
      
      console.log('Successfully saved flow to Supabase for agent:', id);
      console.log('Updated agent data:', data);
      
      // Refetch the agent data to ensure we have the latest state
      refetch();
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
    console.log('Debounced save triggered for agent:', id);
    console.log('Flow data to be saved:', flowData);
    saveFlowMutation.mutate(flowData);
  }, [saveFlowMutation, id]);

  const handleNodesChange = useCallback((newNodes: Node[]) => {
    console.log('Nodes changed for agent:', id);
    console.log('New nodes:', newNodes);
    setNodes(newNodes);
    debouncedSave(newNodes, edges);
  }, [edges, debouncedSave, id]);

  const handleEdgesChange = useCallback((newEdges: Edge[]) => {
    console.log('Edges changed for agent:', id);
    console.log('New edges:', newEdges);
    setEdges(newEdges);
    debouncedSave(nodes, newEdges);
  }, [nodes, debouncedSave, id]);

  const handleUpdateSettings = async (settings: { voiceId?: string; language?: string }) => {
    if (!id) return;
    const { error } = await supabase
      .from('agents')
      .update(settings)
      .eq('id', id);

    if (error) throw error;
  };

  // If there's an error, the toast and redirect will handle it
  if (isError) {
    return null;
  }

  // Show loading state if no agent data yet
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
