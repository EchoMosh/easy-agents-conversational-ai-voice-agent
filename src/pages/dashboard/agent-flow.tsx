import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Network, MessageCircle, X, Plus, PhoneForwarded } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, Connection, ReactFlowProvider, Node, Edge, NodeTypes, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useEffect, useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Agent, FlowNode, FlowEdge, NodeData, FlowData } from '@/types/agent';
import { SpeakNode } from '@/components/flow/nodes/speak-node';
import { GreetingNode } from '@/components/flow/nodes/greeting-node';
import { EndNode } from '@/components/flow/nodes/end-node';
import { TriggerNode } from '@/components/flow/nodes/trigger-node';
import { TransferNode } from '@/components/flow/nodes/transfer-node';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DragProvider, useDrag } from '@/components/flow/drag-context';
import { AgentSettings } from '@/components/agents/flow/agent-settings';

const nodeTypes: NodeTypes = {
  speakNode: SpeakNode,
  greetingNode: GreetingNode,
  endNode: EndNode,
  triggerNode: TriggerNode,
  transferNode: TransferNode
};

function Flow() {
  const { id: agentId } = useParams<{ id: string; }>();
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<NodeData, string>>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge<any>>([]);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();
  const [draggedNodeType, setDraggedNodeType] = useDrag();
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [isToolbarVisible, setIsToolbarVisible] = useState(false);
  const [hoverTime, setHoverTime] = useState(0);
  const [animationTime, setAnimationTime] = useState(0);
  const toolbarTimeout = useRef<number>();
  const hoverIntervalRef = useRef<number>();

  const handleButtonMouseEnter = () => {
    clearTimeout(toolbarTimeout.current);
    setIsToolbarVisible(true);
  };

  const handleButtonMouseLeave = (e: React.MouseEvent) => {
    const toolbarArea = document.querySelector('.toolbar-nodes');
    const relatedTarget = e.relatedTarget as Element;
    if (toolbarArea && !toolbarArea.contains(relatedTarget)) {
      toolbarTimeout.current = window.setTimeout(() => {
        setIsToolbarVisible(false);
      }, 300);
    }
  };

  const handleToolbarMouseEnter = () => {
    clearTimeout(toolbarTimeout.current);
  };

  const handleToolbarMouseLeave = (e: React.MouseEvent) => {
    const button = document.querySelector('.toolbar-button');
    const relatedTarget = e.relatedTarget as Element;
    if (button && !button.contains(relatedTarget)) {
      toolbarTimeout.current = window.setTimeout(() => {
        setIsToolbarVisible(false);
      }, 300);
    }
  };

  const onConnect = useCallback((connection: Connection) => {
    setEdges(eds => addEdge(connection, eds));
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragStart = (event: React.DragEvent, type: 'greetingNode' | 'speakNode' | 'endNode' | 'triggerNode' | 'transferNode') => {
    event.dataTransfer.setData('application/reactflow', type);
    event.dataTransfer.effectAllowed = 'move';
    setDraggedNodeType(type);
    setDragPosition({ x: event.clientX, y: event.clientY });
    
    const dragImg = new Image();
    dragImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    event.dataTransfer.setDragImage(dragImg, 0, 0);
  };

  const handleDrag = (event: React.DragEvent) => {
    setDragPosition({
      x: event.clientX,
      y: event.clientY
    });
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

      let nodeData: NodeData = {};
      
      switch (draggedNodeType) {
        case 'speakNode':
          nodeData = { message: 'Enter your message here' };
          break;
        case 'greetingNode':
          nodeData = { greeting: 'Enter your greeting here', outcomes: [] };
          break;
        case 'triggerNode':
          nodeData = { platform: undefined, action: undefined };
          break;
        case 'transferNode':
          nodeData = { platform: undefined, action: undefined };
          break;
      }

      const newNode: Node<NodeData> = {
        id: `${draggedNodeType}-${Math.random()}`,
        type: draggedNodeType,
        position,
        data: nodeData
      };

      setNodes(nds => [...nds, newNode]);
    }
    
    setDraggedNodeType(null);
  }, [draggedNodeType, screenToFlowPosition, setNodes]);

  const handleUpdateSettings = async (settings: { voiceId?: string; language?: string }) => {
    const { error } = await supabase
      .from('agents')
      .update({
        voice_id: settings.voiceId,
        language: settings.language,
      })
      .eq('id', agentId);

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

  useEffect(() => {
    const loadFlow = async () => {
      const {
        data: agent
      } = await supabase.from('agents').select('flow').eq('id', agentId).single();
      if (agent?.flow) {
        const flowData = agent.flow as any as {
          nodes: FlowNode[];
          edges: FlowEdge[];
        };
        setNodes(flowData.nodes.map(node => ({
          ...node,
          type: node.type as 'greetingNode' | 'speakNode' | 'endNode' | 'triggerNode'
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
    const {
      error
    } = await supabase.from('agents').update({
      flow: flowData as unknown as Json
    }).eq('id', agentId);
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save flow changes"
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
    const handleNodeUpdate = (event: CustomEvent<{
      id: string;
      data: NodeData;
    }>) => {
      setNodes(nodes => nodes.map(node => node.id === event.detail.id ? {
        ...node,
        data: event.detail.data
      } : node));
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
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#94a3b8', strokeWidth: 1.5 },
        }}
        className="bg-white dark:bg-gray-950"
      >
        <Background className="opacity-40" />
        <MiniMap
          className="!bg-white/60 dark:!bg-gray-900/60 backdrop-blur-xl shadow-lg rounded-2xl overflow-hidden"
          nodeColor={node => {
            switch (node.type) {
              case 'speakNode':
                return '#c084fc';
              case 'triggerNode':
                return '#fbbf24';
              case 'endNode':
                return '#f87171';
              case 'transferNode':
                return '#10b981';
              default:
                return '#60a5fa';
            }
          }}
          maskColor="rgba(0, 0, 0, 0.05)"
        />
      </ReactFlow>

      <div className="fixed bottom-6 left-6 z-50 flex items-center gap-4">
        <button
          onClick={() => setIsToolbarVisible(!isToolbarVisible)}
          onMouseEnter={handleButtonMouseEnter}
          onMouseLeave={handleButtonMouseLeave}
          className="toolbar-button h-14 w-14 flex items-center justify-center rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/20 dark:border-gray-700/20 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl"
        >
          <div className="relative w-6 h-6">
            <Plus 
              className={`absolute inset-0 stroke-gray-600 dark:stroke-gray-300 transition-all duration-500 transform translate-y-0.5
                ${isToolbarVisible ? 
                  'rotate-[135deg] scale-110 hover:rotate-[145deg] opacity-0' : 
                  'hover:rotate-[15deg] hover:scale-110 opacity-100'
                }
              `}
            />
            <svg
              viewBox="0 0 24 24"
              fill="none"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`absolute inset-0 w-6 h-6 stroke-gray-600 dark:stroke-gray-300 transition-all duration-500 transform
                ${isToolbarVisible ? 
                  'rotate-0 scale-110 opacity-100' : 
                  '-rotate-180 scale-90 opacity-0'
                }
              `}
            >
              <path d="M5 12h14m-7-7l7 7-7 7" />
            </svg>
          </div>
        </button>

        <div 
          onMouseEnter={handleToolbarMouseEnter}
          onMouseLeave={handleToolbarMouseLeave}
          className={`toolbar-nodes flex items-end gap-4 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
            ${isToolbarVisible ? 
              'opacity-100 translate-y-0 scale-100' : 
              'opacity-0 translate-y-4 scale-95 pointer-events-none'
            }
          `}
        >
          <TooltipProvider>
            <div 
              draggable 
              onDragStart={e => handleDragStart(e, 'greetingNode')} 
              onDrag={handleDrag} 
              onDragEnd={() => setDraggedNodeType(null)} 
              className="flex flex-col items-center gap-2 cursor-move"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center justify-center w-12 h-12 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/20 dark:border-gray-700/20 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl">
                    <MessageCircle className="h-5 w-5 text-blue-500" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Start your conversation flow with a greeting</p>
                </TooltipContent>
              </Tooltip>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Greeting</span>
            </div>

            <div 
              draggable 
              onDragStart={e => handleDragStart(e, 'speakNode')} 
              onDrag={handleDrag} 
              onDragEnd={() => setDraggedNodeType(null)} 
              className="flex flex-col items-center gap-2 cursor-move"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center justify-center w-12 h-12 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/20 dark:border-gray-700/20 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl">
                    <MessageCircle className="h-5 w-5 text-purple-500" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add a message or response</p>
                </TooltipContent>
              </Tooltip>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Speak</span>
            </div>

            <div 
              draggable 
              onDragStart={e => handleDragStart(e, 'endNode')} 
              onDrag={handleDrag} 
              onDragEnd={() => setDraggedNodeType(null)} 
              className="flex flex-col items-center gap-2 cursor-move"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center justify-center w-12 h-12 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/20 dark:border-gray-700/20 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl">
                    <X className="h-5 w-5 text-rose-500" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>End the conversation flow</p>
                </TooltipContent>
              </Tooltip>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">End</span>
            </div>

            <div
              draggable
              onDragStart={e => handleDragStart(e, 'triggerNode')}
              onDrag={handleDrag}
              onDragEnd={() => setDraggedNodeType(null)}
              className="flex flex-col items-center gap-2 cursor-move"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center justify-center w-12 h-12 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/20 dark:border-gray-700/20 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl">
                    <Network className="h-5 w-5 text-amber-500" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add an event trigger or condition</p>
                </TooltipContent>
              </Tooltip>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Trigger</span>
            </div>

            <div
              draggable
              onDragStart={e => handleDragStart(e, 'transferNode')}
              onDrag={handleDrag}
              onDragEnd={() => setDraggedNodeType(null)}
              className="flex flex-col items-center gap-2 cursor-move"
            >
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex items-center justify-center w-12 h-12 rounded-full bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/20 dark:border-gray-700/20 shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl">
                    <PhoneForwarded className="h-5 w-5 text-emerald-500" />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Transfer the call to another agent</p>
                </TooltipContent>
              </Tooltip>
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Transfer</span>
            </div>
          </TooltipProvider>
        </div>
      </div>

      {draggedNodeType && (
        <div 
          className="fixed pointer-events-none bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200/20 dark:border-gray-700/20 rounded-xl shadow-2xl p-4"
          style={{ 
            left: dragPosition.x,
            top: dragPosition.y,
            transform: 'translate(-50%, -50%)',
            minWidth: '200px',
            zIndex: 9999,
          }}
        >
          {draggedNodeType === 'greetingNode' && (
            <div className="flex items-center gap-2">
              <span className="text-blue-500 bg-blue-50/50 dark:bg-blue-950/50 p-1.5 rounded-lg">
                <MessageCircle className="h-4 w-4" />
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">Greeting Node</span>
            </div>
          )}
          {draggedNodeType === 'speakNode' && (
            <div className="flex items-center gap-2">
              <span className="text-purple-500 bg-purple-50/50 dark:bg-purple-950/50 p-1.5 rounded-lg">
                <MessageCircle className="h-4 w-4" />
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">Speak Node</span>
            </div>
          )}
          {draggedNodeType === 'endNode' && (
            <div className="flex items-center gap-2">
              <span className="text-rose-500 bg-rose-50/50 dark:bg-rose-950/50 p-1.5 rounded-lg">
                <X className="h-4 w-4" />
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">End Node</span>
            </div>
          )}
          {draggedNodeType === 'triggerNode' && (
            <div className="flex items-center gap-2">
              <span className="text-amber-500 bg-amber-50/50 dark:bg-amber-950/50 p-1.5 rounded-lg">
                <Network className="h-4 w-4" />
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">Trigger Node</span>
            </div>
          )}
          {draggedNodeType === 'transferNode' && (
            <div className="flex items-center gap-2">
              <span className="text-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/50 p-1.5 rounded-lg">
                <PhoneForwarded className="h-4 w-4" />
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">Transfer Call Node</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

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

  return <DragProvider>
      <div className="h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
        <div className="relative h-16 border-b border-gray-200/10 dark:border-gray-700/10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl flex items-center justify-between px-8 z-50">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-50/30 via-white/30 to-gray-50/30 dark:from-gray-900/30 dark:via-gray-800/30 dark:to-gray-900/30 pointer-events-none" />
          
          <div className="flex items-center gap-6 relative">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/dashboard/agents')} 
              className="hover:bg-gray-900/5 dark:hover:bg-white/5 transition-all duration-300 rounded-full"
            >
              <ArrowLeft className="h-4 w-4 text-gray-700 dark:text-gray-300" />
            </Button>
            <div className="h-6 w-[1px] bg-gradient-to-b from-gray-200/0 via-gray-200/50 to-gray-200/0 dark:from-gray-700/0 dark:via-gray-700/50 dark:to-gray-700/0" />
            <div className="flex flex-col">
              <h1 className="font-medium text-gray-900 dark:text-white">{agent.name}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{agent.role.replace('_', ' ')}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 relative">
            <AgentSettings
              agentId={agent.id}
              currentVoice={agent.voice_id || undefined}
              currentLanguage={agent.language}
              onUpdateSettings={handleUpdateSettings}
            />
            <ThemeToggle />
            <div className="h-6 w-[1px] bg-gradient-to-b from-gray-200/0 via-gray-200/50 to-gray-200/0 dark:from-gray-700/0 dark:via-gray-700/50 dark:to-gray-700/0" />
            <Button 
              variant="ghost"
              className="bg-white/40 dark:bg-gray-800/40 hover:bg-white/80 dark:hover:bg-gray-800/80 text-gray-900 dark:text-white border border-gray-200/20 dark:border-gray-700/20 shadow-[0_2px_3px_-1px_rgba(0,0,0,0.1),0_1px_0_0_rgba(25,28,33,0.02),0_0_0_1px_rgba(25,28,33,0.08)] dark:shadow-[0_2px_3px_-1px_rgba(0,0,0,0.5),0_1px_0_0_rgba(255,255,255,0.02),0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-xl transition-all duration-300"
            >
              Save Flow
            </Button>
            <Button 
              className="bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-[0_2px_3px_-1px_rgba(0,0,0,0.1),0_1px_0_0_rgba(25,28,33,0.02),0_0_0_1px_rgba(25,28,33,0.08)] hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_3px_-1px_rgba(0,0,0,0.5),0_1px_0_0_rgba(255,255,255,0.02),0_0_0_1px_rgba(255,255,255,0.05)] transition-all duration-300"
            >
              Deploy Agent
            </Button>
          </div>
        </div>

        <div className="flex-1 relative">
          <ReactFlowProvider>
            <Flow />
          </ReactFlowProvider>
        </div>
      </div>
    </DragProvider>;
}
