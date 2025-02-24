
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ReactFlowProvider } from '@xyflow/react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Agent, FlowNode, FlowEdge } from '@/types/agent';
import { DragProvider } from '@/components/flow/drag-context';
import { Flow } from '@/components/flow/agent-flow/flow';
import { Header } from '@/components/flow/agent-flow/header';
import { Node, Edge } from '@xyflow/react';

export default function AgentFlowPage() {
  const { id } = useParams<{ id: string; }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
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

  const handleNodesChange = async (nodes: Node[]) => {
    if (!agent) return;

    const flowNodes = nodes.map(node => ({
      id: node.id,
      type: node.type as FlowNode['type'],
      position: node.position,
      data: node.data as FlowNode['data']
    })) as FlowNode[];

    const { error } = await supabase
      .from('agents')
      .update({
        flow: {
          ...agent.flow,
          nodes: flowNodes
        }
      })
      .eq('id', id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update flow"
      });
    }
  };

  const handleEdgesChange = async (edges: Edge[]) => {
    if (!agent) return;

    const flowEdges = edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle
    })) as FlowEdge[];

    const { error } = await supabase
      .from('agents')
      .update({
        flow: {
          ...agent.flow,
          edges: flowEdges
        }
      })
      .eq('id', id);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update flow"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading agent...</p>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-destructive">Failed to load agent</p>
      </div>
    );
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
