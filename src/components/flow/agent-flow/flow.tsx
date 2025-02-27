import { useCallback, useRef, useState, useEffect } from 'react';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, Connection, Node, Edge, NodeTypes, useReactFlow, Panel, ConnectionMode } from '@xyflow/react';
import { Plus, MessageCircle, Smile, XCircle, Zap, PhoneForwarded } from 'lucide-react';
import '@xyflow/react/dist/style.css';
import { NodeData } from '@/types/agent';
import { SpeakNode } from '@/components/flow/nodes/speak-node';
import { GreetingNode } from '@/components/flow/nodes/greeting-node';
import { EndNode } from '@/components/flow/nodes/end-node';
import { TriggerNode } from '@/components/flow/nodes/trigger-node';
import { TransferNode } from '@/components/flow/nodes/transfer-node';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const nodeTypes: NodeTypes = {
  speakNode: SpeakNode,
  greetingNode: GreetingNode,
  endNode: EndNode,
  triggerNode: TriggerNode,
  transferNode: TransferNode
};

const widgets = [
  { 
    type: 'speakNode', 
    label: 'Speak', 
    icon: MessageCircle, 
    color: '#c084fc',
    description: 'Add a message response with multiple outcome paths'
  },
  { 
    type: 'greetingNode', 
    label: 'Greeting', 
    icon: Smile, 
    color: '#60a5fa',
    description: 'Start a conversation with customizable responses'
  },
  { 
    type: 'endNode', 
    label: 'End', 
    icon: XCircle, 
    color: '#f87171',
    description: 'End the conversation flow'
  },
  { 
    type: 'triggerNode', 
    label: 'Trigger', 
    icon: Zap, 
    color: '#fbbf24',
    description: 'Define when this flow should start'
  },
  { 
    type: 'transferNode', 
    label: 'Transfer', 
    icon: PhoneForwarded, 
    color: '#10b981',
    description: 'Transfer the conversation to a live agent'
  }
];

interface FlowProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
}

export function Flow({ initialNodes, initialEdges, onNodesChange, onEdgesChange }: FlowProps) {
  const [nodes, setNodes] = useNodesState([]);
  const [edges, setEdges] = useEdgesState([]);
  const [showWidgets, setShowWidgets] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { viewport } = useReactFlow();

  useEffect(() => {
    if (initialNodes.length > 0) {
      setNodes(initialNodes.map(node => ({
        ...node,
        draggable: true,
        deletable: true
      })));
    }
    if (initialEdges.length > 0) {
      setEdges(initialEdges);
    }
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const defaultEdgeOptions = {
    type: 'smoothstep',
    animated: true,
    style: {
      strokeWidth: 2,
      stroke: '#94a3b8',
    }
  };

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({ ...connection, type: 'smoothstep' }, eds));
  }, [setEdges]);

  const handleNodesChange = useCallback((changes: any) => {
    setNodes((nds) => {
      const updatedNodes = changes.reduce((acc: Node[], change: any) => {
        if (change.type === 'position' || change.type === 'dimensions') {
          return acc.map(node => 
            node.id === change.id 
              ? { ...node, position: change.position || node.position }
              : node
          );
        }
        return acc;
      }, nds);
      
      onNodesChange(updatedNodes);
      return updatedNodes;
    });
  }, [onNodesChange, setNodes]);

  const handleEdgesChange = useCallback((changes: any) => {
    setEdges((eds) => {
      const updatedEdges = [...eds];
      onEdgesChange(updatedEdges);
      return updatedEdges;
    });
  }, [onEdgesChange, setEdges]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    if (!reactFlowWrapper.current) return;

    const bounds = reactFlowWrapper.current.getBoundingClientRect();
    const position = {
      x: (event.clientX - bounds.left - viewport.x) / viewport.zoom,
      y: (event.clientY - bounds.top - viewport.y) / viewport.zoom
    };

    const nodeType = event.dataTransfer.getData('application/reactflow');
    if (!nodeType) return;

    let newNodeData: NodeData = {};
    
    switch (nodeType) {
      case 'speakNode':
        newNodeData = { message: 'Enter your message here', outcomes: ["Continue"] };
        break;
      case 'greetingNode':
        newNodeData = { greeting: 'Enter your greeting here', outcomes: ["Continue"] };
        break;
      case 'triggerNode':
        newNodeData = { platform: undefined, action: undefined };
        break;
      case 'transferNode':
        newNodeData = { message: 'Transfer to agent', outcomes: ["Continue"] };
        break;
    }

    const newNode: FlowNode = {
      id: `${nodeType}-${Math.random()}`,
      type: nodeType as NodeType,
      position,
      data: newNodeData,
      draggable: true,
      deletable: true
    };

    setNodes((nds) => {
      const updatedNodes = [...nds, newNode];
      onNodesChange(updatedNodes);
      return updatedNodes;
    });
  }, [viewport, setNodes, onNodesChange]);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div ref={reactFlowWrapper} className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={nodeTypes}
        fitView
        defaultEdgeOptions={defaultEdgeOptions}
        connectionMode={ConnectionMode.Strict}
        className="bg-white dark:bg-gray-950"
      >
        <Background className="opacity-40" />
        <Controls />
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
        <Panel position="bottom-left" className="space-y-2">
          <button
            onClick={() => setShowWidgets(!showWidgets)}
            className="p-2 rounded-full bg-primary text-primary-foreground shadow-lg transform transition-transform hover:scale-105 backdrop-blur-xl"
          >
            <Plus className={`h-5 w-5 transition-transform ${showWidgets ? 'rotate-45' : ''}`} />
          </button>
          {showWidgets && (
            <div className="absolute bottom-14 left-0 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 p-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] space-y-3 min-w-[180px] border border-white/20">
              <TooltipProvider>
                {widgets.map((widget) => (
                  <Tooltip key={widget.type}>
                    <TooltipTrigger asChild>
                      <div
                        className="group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-move transition-all duration-200"
                        style={{
                          background: `color-mix(in srgb, ${widget.color} 10%, transparent)`,
                        }}
                        onDragStart={(e) => onDragStart(e, widget.type)}
                        draggable
                      >
                        <span 
                          className="p-1.5 rounded-lg"
                          style={{
                            background: `color-mix(in srgb, ${widget.color} 15%, transparent)`,
                            color: widget.color
                          }}
                        >
                          <widget.icon className="h-4 w-4" />
                        </span>
                        <span className="font-medium text-sm text-foreground/80">{widget.label}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="right"
                      className="bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-none shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)]"
                    >
                      {widget.description}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </TooltipProvider>
            </div>
          )}
        </Panel>
      </ReactFlow>
    </div>
  );
}
