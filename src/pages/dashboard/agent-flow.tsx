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
  ReactFlowProvider,
  Node,
  Edge,
  NodeTypes,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useEffect, useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Agent, FlowNode, FlowEdge, NodeData, FlowData } from '@/types/agent';
import { SpeakNode } from '@/components/flow/nodes/speak-node';
import { GreetingNode } from '@/components/flow/nodes/greeting-node';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DragProvider, useDrag } from '@/components/flow/drag-context';
import { Json } from '@/integrations/supabase/types';

const nodeTypes: NodeTypes = {
  speakNode: SpeakNode,
  greetingNode: GreetingNode
};

function Flow() {
  const { id: agentId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData, string>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<any>>([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const [draggedNodeType, setDraggedNodeType] = useDrag();
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });

  const onConnect = useCallback((connection: Connection) => {
    setEdges(eds => addEdge(connection, eds));
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragStart = (event: React.DragEvent, type: 'greetingNode' | 'speakNode') => {
    event.dataTransfer.setData('application/reactflow', type);
    event.dataTransfer.effectAllowed = 'move';
    setDraggedNodeType(type);
    setDragPosition({ x: event.clientX, y: event.clientY });
  };

  const handleDrag = (event: React.DragEvent) => {
    setDragPosition({ x: event.clientX, y: event.clientY });
  };

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    if (!draggedNodeType) return;

    if (reactFlowWrapper.current) {
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const newNode: Node<NodeData, 'greetingNode' | 'speakNode'> = {
        id: `${draggedNodeType}-${Math.random()}`,
        type: draggedNodeType,
        position,
        data: draggedNodeType === 'speakNode' 
          ? { message: 'Enter your message here' }
          : { greeting: 'Enter your greeting here', outcomes: [] },
      };

      setNodes(nds => [...nds, newNode]);
    }
    
    setDraggedNodeType(null);
  }, [draggedNodeType, screenToFlowPosition, setNodes]);

  useEffect(() => {
    const loadFlow = async () => {
      const { data: agent } = await supabase
        .from('agents')
        .select('flow')
        .eq('id', agentId)
        .single();

      if (agent?.flow) {
        const flowData = agent.flow as any as { nodes: FlowNode[]; edges: FlowEdge[] };
        setNodes(flowData.nodes.map(node => ({
          ...node,
          type: node.type as 'greetingNode' | 'speakNode'
        })));
        setEdges(flowData.edges);
      }
    };
    loadFlow();
  }, [agentId]);

  const updateFlow = useCallback(async () => {
    const flowData = {
      nodes: nodes.map(node => ({
        id: node.id,
        type: node.type,
        position: node.position,
        data: node.data
      })),
      edges: edges
    };

    const { error } = await supabase
      .from('agents')
      .update({
        flow: flowData as unknown as Json
      })
      .eq('id', agentId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save flow changes",
      });
    }
  }, [nodes, edges, agentId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateFlow();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [nodes, edges, updateFlow]);

  useEffect(() => {
    const handleNodeUpdate = (event: CustomEvent<{ id: string; data: NodeData }>) => {
      setNodes((nodes) =>
        nodes.map((node) =>
          node.id === event.detail.id
            ? { ...node, data: event.detail.data }
            : node
        )
      );
    };

    window.addEventListener('nodeupdate', handleNodeUpdate as EventListener);
    return () => {
      window.removeEventListener('nodeupdate', handleNodeUpdate as EventListener);
    };
  }, [setNodes]);

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
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
        defaultEdgeOptions={{ animated: true }}
        className="bg-background"
      >
        <Background className="bg-background" />
        <Controls className="bg-background border-border" />
        <MiniMap 
          className="bg-background !border-border" 
          nodeColor={(node) => {
            return node.type === 'speakNode' ? 'hsl(var(--primary))' : 'hsl(var(--secondary))';
          }}
          maskColor="hsl(var(--muted))"
        />
      </ReactFlow>

      <TooltipProvider delayDuration={200}>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-8 p-6 rounded-xl bg-background/80 backdrop-blur-md border shadow-lg">
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, 'greetingNode')}
                onDrag={handleDrag}
                onDragEnd={() => setDraggedNodeType(null)}
                className="flex flex-col items-center gap-2 p-2 rounded-lg cursor-move hover:bg-accent transition-all duration-200 hover:scale-110 group"
              >
                <span className="text-blue-500 p-2 rounded-lg bg-blue-50 dark:bg-blue-950 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                </span>
                <span className="text-sm font-medium">Greeting</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px] text-center">
              Initial message to start the conversation
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, 'speakNode')}
                onDrag={handleDrag}
                onDragEnd={() => setDraggedNodeType(null)}
                className="flex flex-col items-center gap-2 p-2 rounded-lg cursor-move hover:bg-accent transition-all duration-200 hover:scale-110 group"
              >
                <span className="text-purple-500 p-2 rounded-lg bg-purple-50 dark:bg-purple-950 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6v12"/><path d="M8 10v4"/><path d="M16 10v4"/><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
                </span>
                <span className="text-sm font-medium">Speak</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[200px] text-center">
              Response message to user input
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {draggedNodeType && (
        <div 
          className="fixed pointer-events-none bg-background/80 backdrop-blur-sm border rounded-lg p-4 shadow-lg"
          style={{ 
            left: dragPosition.x,
            top: dragPosition.y,
            transform: 'translate(-50%, -50%)',
            minWidth: '200px',
            zIndex: 9999,
          }}
        >
          {draggedNodeType === 'greetingNode' ? (
            <div className="flex items-center gap-2">
              <span className="text-blue-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              </span>
              <span>Greeting Node</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-purple-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6v12"/><path d="M8 10v4"/><path d="M16 10v4"/><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
              </span>
              <span>Speak Node</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AgentFlowPage() {
  const {
    id
  } = useParams<{
    id: string;
  }>();
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const {
    data: agent,
    isLoading,
    error
  } = useQuery({
    queryKey: ['agent', id],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('agents').select('*').eq('id', id).single();
      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch agent"
        });
        throw error;
      }
      return data as unknown as Agent;
    }
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">
        <p className="text-lg">Loading agent...</p>
      </div>;
  }

  if (error || !agent) {
    return <div className="flex items-center justify-center h-screen">
        <p className="text-lg text-destructive">Failed to load agent</p>
      </div>;
  }

  return (
    <DragProvider>
      <div className="h-screen flex flex-col bg-background">
        <div className="h-14 border-b bg-background flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/agents')} className="hover:bg-accent">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex flex-col">
              <h1 className="font-semibold">{agent.name}</h1>
              <p className="text-xs text-muted-foreground capitalize">{agent.role.replace('_', ' ')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button variant="outline">Save Flow</Button>
            <Button>Deploy Agent</Button>
          </div>
        </div>

        <div className="flex-1 relative">
          <ReactFlowProvider>
            <Flow />
          </ReactFlowProvider>
        </div>
      </div>
    </DragProvider>
  );
}
