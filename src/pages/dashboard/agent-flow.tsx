
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Agent } from '@/types/agent';
import { SpeakNode } from '@/components/flow/nodes/speak-node';
import { GreetingNode } from '@/components/flow/nodes/greeting-node';

const nodeTypes = {
  speakNode: SpeakNode,
  greetingNode: GreetingNode,
};

const initialNodes = [
  {
    id: '1',
    type: 'greetingNode',
    position: { x: 250, y: 100 },
    data: { greeting: 'Welcome! How can I assist you today?' },
  },
  {
    id: '2',
    type: 'speakNode',
    position: { x: 250, y: 250 },
    data: { message: 'I understand your request. Let me help you with that.' },
  },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
];

export default function AgentFlowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

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

  const onConnect = (connection: Connection) => {
    setEdges((eds) => addEdge(connection, eds));
  };

  const onDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();

    const type = event.dataTransfer.getData('application/reactflow');
    if (!type) return;

    const position = {
      x: event.clientX - 250,
      y: event.clientY - 100,
    };

    const newNode = {
      id: `${type}-${Math.random()}`,
      type,
      position,
      data: type === 'speakNode' 
        ? { message: 'Enter your message here' }
        : { greeting: 'Enter your greeting here' },
    };

    setNodes((nds) => nds.concat(newNode));
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
        <div className="flex items-center gap-4">
          <div className="flex gap-2 border rounded-lg p-2">
            <div
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('application/reactflow', 'greetingNode');
                event.dataTransfer.effectAllowed = 'move';
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded cursor-move hover:bg-blue-100 transition-colors"
            >
              <span className="text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              </span>
              Greeting
            </div>
            <div
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('application/reactflow', 'speakNode');
                event.dataTransfer.effectAllowed = 'move';
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded cursor-move hover:bg-purple-100 transition-colors"
            >
              <span className="text-purple-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6v12"/><path d="M8 10v4"/><path d="M16 10v4"/><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
              </span>
              Speak
            </div>
          </div>
          <Button variant="outline">Save Flow</Button>
          <Button>Deploy Agent</Button>
        </div>
      </div>

      {/* Flow Canvas */}
      <div style={{ flex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          nodeTypes={nodeTypes}
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
