
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ReactFlowProvider } from '@xyflow/react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Agent } from '@/types/agent';
import { DragProvider } from '@/components/flow/drag-context';
import { Flow } from '@/components/flow/agent-flow/flow';
import { Header } from '@/components/flow/agent-flow/header';
import { Circle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Node, Edge } from '@xyflow/react';

export default function AgentFlowPage() {
  const { id } = useParams<{ id: string; }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  // 1. WebSocket Connection
  useEffect(() => {
    const channel = supabase.channel('any')
      .on('presence', { event: 'sync' }, () => {
        setIsConnected(true);
      })
      .on('presence', { event: 'join' }, () => {
        setIsConnected(true);
      })
      .on('presence', { event: 'leave' }, () => {
        setIsConnected(false);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online: true });
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Load initial data
  const { data: agent, isLoading, error } = useQuery({
    queryKey: ['agent', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch agent"
        });
        throw error;
      }

      if (data.flow?.nodes && data.flow?.edges) {
        setNodes(data.flow.nodes);
        setEdges(data.flow.edges);
      }
      
      return data as Agent;
    }
  });

  // Add this event listener for node updates
  useEffect(() => {
    const handleNodeUpdate = (event: CustomEvent) => {
      const { id: nodeId, data } = event.detail;
      setNodes(currentNodes => 
        currentNodes.map(node => 
          node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
        )
      );
    };

    window.addEventListener('nodeupdate', handleNodeUpdate as EventListener);
    return () => window.removeEventListener('nodeupdate', handleNodeUpdate as EventListener);
  }, []);

  // 2. Update nodes in Supabase with debounce
  const handleUpdateFlow = useCallback(async (newNodes: Node[], newEdges: Edge[]) => {
    console.log('Updating flow:', { nodes: newNodes, edges: newEdges });
    const { error } = await supabase
      .from('agents')
      .update({
        flow: {
          nodes: newNodes,
          edges: newEdges
        }
      })
      .eq('id', id);

    if (error) {
      console.error('Error updating flow:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save flow changes"
      });
    }
  }, [id, toast]);

  const handleNodesChange = useCallback((newNodes: Node[]) => {
    console.log('Nodes changed:', newNodes);
    setNodes(newNodes);
    handleUpdateFlow(newNodes, edges);
  }, [edges, handleUpdateFlow]);

  const handleEdgesChange = useCallback((newEdges: Edge[]) => {
    console.log('Edges changed:', newEdges);
    setEdges(newEdges);
    handleUpdateFlow(nodes, newEdges);
  }, [nodes, handleUpdateFlow]);

  if (isLoading) return <div className="flex items-center justify-center h-screen"><p className="text-lg">Loading agent...</p></div>;
  if (error || !agent) return <div className="flex items-center justify-center h-screen"><p className="text-lg text-destructive">Failed to load agent</p></div>;

  return (
    <DragProvider>
      <div className="h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <Header 
          agent={agent}
          onBack={() => navigate('/dashboard/agents')}
        />
        <div className="absolute top-20 right-4 z-50 flex items-center gap-2">
          <div className={`relative ${isConnected ? 'animate-pulse' : ''}`}>
            <div className={`absolute inset-0 rounded-full blur-md ${
              isConnected ? 'bg-green-500/50' : 'bg-red-500/50'
            }`} />
            <Circle 
              size={24}
              className={`relative ${
                isConnected ? 'text-green-500' : 'text-red-500'
              } transition-colors duration-200`}
              fill={isConnected ? 'rgb(34 197 94)' : 'rgb(239 68 68)'}
            />
          </div>
          <span className={`text-sm ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
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
