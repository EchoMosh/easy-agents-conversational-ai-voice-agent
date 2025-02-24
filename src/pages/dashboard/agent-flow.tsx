
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Agent } from '@/types/agent';

// This ensures the flow container takes up the full height
const flowStyles = {
  background: '#fafafa',
  height: 'calc(100vh - 56px)', // 56px is the height of our top bar
};

export default function AgentFlowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

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
          description: "Failed to fetch agent",
        });
        throw error;
      }

      return data as Agent;
    },
  });

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
    <div className="h-screen flex flex-col bg-background">
      {/* Top Bar */}
      <div className="h-14 border-b bg-background flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/dashboard/agents')}
            className="hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex flex-col">
            <h1 className="font-semibold">{agent.name}</h1>
            <p className="text-xs text-muted-foreground capitalize">{agent.role.replace('_', ' ')}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">Save Flow</Button>
          <Button>Deploy Agent</Button>
        </div>
      </div>

      {/* Flow Canvas */}
      <div style={flowStyles}>
        <ReactFlow
          defaultNodes={[]}
          defaultEdges={[]}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>
    </div>
  );
}
