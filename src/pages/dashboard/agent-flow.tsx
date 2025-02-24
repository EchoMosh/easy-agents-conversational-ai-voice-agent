
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ReactFlowProvider } from '@xyflow/react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Agent, FlowNode, FlowEdge, NodeType } from '@/types/agent';
import { Json } from '@/integrations/supabase/types';
import { DragProvider } from '@/components/flow/drag-context';
import { Flow } from '@/components/flow/agent-flow/flow';
import { Header } from '@/components/flow/agent-flow/header';
import { Node, Edge } from '@xyflow/react';
import { Circle } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

export default function AgentFlowPage() {
  const { id } = useParams<{ id: string; }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(false);
  
  const {
    data: agent,
    isLoading,
    error
  } = useQuery({
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
      return data as Agent;
    }
  });

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

  const handleUpdateSettings = async (settings: { voiceId?: string; language?: string }) => {
    const { error } = await supabase
      .from('agents')
      .update({
        voice_id: settings.voiceId,
        language: settings.language,
      })
      .eq('id', id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update agent settings"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Agent settings updated successfully"
    });
  };

  const saveFlowChanges = useCallback(async (nodes: Node[], edges: Edge[]) => {
    if (!agent) return;

    const flowData = {
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type as NodeType,
        position: {
          x: node.position.x,
          y: node.position.y
        },
        data: node.data as Record<string, unknown>
      })) as FlowNode[],
      edges: edges.map(edge => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle,
        targetHandle: edge.targetHandle
      })) as FlowEdge[]
    };

    const { error } = await supabase
      .from('agents')
      .update({
        flow: flowData
      } as { flow: Json })
      .eq('id', id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save flow changes"
      });
    }
  }, [agent, id, toast]);

  const handleNodesChange = useCallback((nodes: Node[]) => {
    saveFlowChanges(nodes, agent?.flow?.edges || []);
  }, [agent?.flow?.edges, saveFlowChanges]);

  const handleEdgesChange = useCallback((edges: Edge[]) => {
    saveFlowChanges(agent?.flow?.nodes || [], edges);
  }, [agent?.flow?.nodes, saveFlowChanges]);

  if (isLoading) return <div className="flex items-center justify-center h-screen"><p className="text-lg">Loading agent...</p></div>;
  if (error || !agent) return <div className="flex items-center justify-center h-screen"><p className="text-lg text-destructive">Failed to load agent</p></div>;

  return (
    <DragProvider>
      <div className="h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <Header 
          agent={agent}
          onBack={() => navigate('/dashboard/agents')}
          onUpdateSettings={handleUpdateSettings}
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
              initialNodes={agent.flow?.nodes || []}
              initialEdges={agent.flow?.edges || []}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
            />
          </ReactFlowProvider>
        </div>
      </div>
    </DragProvider>
  );
}
