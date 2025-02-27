
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

  const { data: agent, refetch, isError } = useQuery({
    queryKey: ['agent', id],
    queryFn: async () => {
      if (!id) throw new Error('No agent ID provided');
      console.log('Fetching agent with ID:', id);
      
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
      
      console.log('Raw agent data from Supabase:', data);
      console.log('Flow data type:', typeof data.flow);
      return data as Agent;
    },
    enabled: !!id,
    retry: false,
    staleTime: 0
  });

  useEffect(() => {
    if (isError) {
      console.error('Error loading agent');
      toast({
        title: "Error loading agent",
        description: "The requested agent could not be found or accessed.",
        variant: "destructive"
      });
      setTimeout(() => navigate('/dashboard/agents'), 2000);
    }
  }, [isError, navigate, toast]);

  useEffect(() => {
    if (agent?.flow) {
      try {
        console.log('Raw flow data before parsing:', agent.flow);
        let flowData;
        
        if (typeof agent.flow === 'string') {
          console.log('Parsing flow data from string');
          flowData = JSON.parse(agent.flow);
        } else {
          console.log('Using flow data directly');
          flowData = agent.flow;
        }
        
        console.log('Parsed/processed flow data:', flowData);
        
        if (flowData.nodes) {
          console.log('Node data structure:', flowData.nodes[0]); // Log first node structure if exists
          setNodes(flowData.nodes);
        }
        if (flowData.edges) {
          console.log('Edge data structure:', flowData.edges[0]); // Log first edge structure if exists
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
      setNodes([]);
      setEdges([]);
    }
  }, [agent, id, toast]);

  const saveFlowMutation = useMutation({
    mutationFn: async (flowData: { nodes: Node[]; edges: Edge[] }) => {
      if (!id) throw new Error('No agent ID provided');
      
      // Log the data we're about to save
      console.log('Saving flow data structure:', {
        nodes: flowData.nodes[0], // Log first node structure
        edges: flowData.edges[0]  // Log first edge structure
      });
      
      const flowString = JSON.stringify(flowData);
      console.log('Flow data stringified:', flowString);
      
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
      
      console.log('Successfully saved flow for agent:', id);
      refetch();
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
    console.log('Nodes changed for agent:', id);
    console.log('New nodes structure:', newNodes[0]); // Log first node structure
    setNodes(newNodes);
    
    saveFlowMutation.mutate({
      nodes: newNodes.map(node => ({
        ...node,
        selected: false,
        dragging: false
      })),
      edges
    });
  }, [edges, saveFlowMutation, id]);

  const handleEdgesChange = useCallback((newEdges: Edge[]) => {
    console.log('Edges changed for agent:', id);
    console.log('New edges structure:', newEdges[0]); // Log first edge structure
    setEdges(newEdges);
    
    saveFlowMutation.mutate({
      nodes: nodes.map(node => ({
        ...node,
        selected: false,
        dragging: false
      })),
      edges: newEdges
    });
  }, [nodes, saveFlowMutation, id]);

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
