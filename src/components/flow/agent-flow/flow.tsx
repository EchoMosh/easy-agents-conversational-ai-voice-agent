
import { useCallback, useRef, useState } from 'react';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, Connection, NodeTypes, useReactFlow, Panel, ConnectionMode } from '@xyflow/react';
import { Plus, MessageCircle, Smile, XCircle, Zap, PhoneForwarded } from 'lucide-react';
import '@xyflow/react/dist/style.css';
import { NodeData, FlowNode, FlowEdge, FlowData, NodeType } from '@/types/agent';
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
    type: 'speakNode' as NodeType, 
    label: 'Speak', 
    icon: MessageCircle, 
    color: '#c084fc',
    description: 'Add a message response with multiple outcome paths'
  },
  { 
    type: 'greetingNode' as NodeType, 
    label: 'Greeting', 
    icon: Smile, 
    color: '#60a5fa',
    description: 'Start a conversation with customizable responses'
  },
  { 
    type: 'endNode' as NodeType, 
    label: 'End', 
    icon: XCircle, 
    color: '#f87171',
    description: 'End the conversation flow'
  },
  { 
    type: 'triggerNode' as NodeType, 
    label: 'Trigger', 
    icon: Zap, 
    color: '#fbbf24',
    description: 'Define when this flow should start'
  },
  { 
    type: 'transferNode' as NodeType, 
    label: 'Transfer', 
    icon: PhoneForwarded, 
    color: '#10b981',
    description: 'Transfer the conversation to a live agent'
  }
];

interface FlowProps {
  initialNodes: FlowNode[];
  initialEdges: FlowEdge[];
  onFlowChange?: (flowData: FlowData) => void;
}

export function Flow({ initialNodes, initialEdges, onFlowChange }: FlowProps) {
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges);
  const [showWidgets, setShowWidgets] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const isValidConnection = (connection: Connection) => {
    const sourceNode = nodes.find(node => node.id === connection.source);
    const targetNode = nodes.find(node => node.id === connection.target);

    if (connection.source === connection.target) {
      return false;
    }

    const existingConnection = edges.find(edge => 
      edge.target === connection.target && edge.source === connection.source
    );
    
    if (existingConnection) {
      return false;
    }

    return !!(sourceNode && targetNode);
  };

  const defaultEdgeOptions = {
    type: 'default' as const,
    animated: true,
    style: {
      strokeWidth: 2,
      stroke: '#94a3b8',
    }
  };

  const onConnect = useCallback((params: Connection) => {
    if (isValidConnection(params)) {
      const newEdge: FlowEdge = {
        id: `e${params.source}-${params.target}`,
        source: params.source || '',
        target: params.target || '',
        sourceHandle: params.sourceHandle,
        targetHandle: params.targetHandle,
        type: 'default',
        animated: true,
        style: {
          strokeWidth: 2,
          stroke: '#94a3b8',
        }
      };
      
      const newEdges = addEdge(newEdge, edges as any) as FlowEdge[];
      setEdges(newEdges);
      
      if (onFlowChange) {
        onFlowChange({
          nodes: nodes as FlowNode[],
          edges: newEdges,
        });
      }
    }
  }, [edges, nodes, onFlowChange, setEdges]);

  const handleNodesChange = useCallback((changes: any) => {
    onNodesChangeInternal(changes);
    
    if (onFlowChange) {
      onFlowChange({
        nodes: nodes as FlowNode[],
        edges: edges as FlowEdge[],
      });
    }
  }, [nodes, edges, onFlowChange, onNodesChangeInternal]);

  const handleEdgesChange = useCallback((changes: any) => {
    onEdgesChangeInternal(changes);
    
    if (onFlowChange) {
      onFlowChange({
        nodes: nodes as FlowNode[],
        edges: edges as FlowEdge[],
      });
    }
  }, [nodes, edges, onFlowChange, onEdgesChangeInternal]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    if (reactFlowWrapper.current) {
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const nodeType = event.dataTransfer.getData('application/reactflow') as NodeType;
      if (!nodeType) return;

      let newNodeData: NodeData = {};
      
      switch (nodeType) {
        case 'speakNode':
          newNodeData = { message: 'Enter your message here' };
          break;
        case 'greetingNode':
          newNodeData = { greeting: 'Enter your greeting here', outcomes: [] };
          break;
        case 'triggerNode':
          newNodeData = { platform: undefined, action: undefined };
          break;
        case 'transferNode':
          newNodeData = { message: 'Transfer to agent', outcomes: [] };
          break;
      }

      const newNode: FlowNode = {
        id: `${nodeType}-${Math.random()}`,
        type: nodeType,
        position,
        data: newNodeData
      };

      const updatedNodes = [...nodes, newNode] as FlowNode[];
      setNodes(updatedNodes);
      
      if (onFlowChange) {
        onFlowChange({
          nodes: updatedNodes,
          edges: edges as FlowEdge[],
        });
      }
    }
  }, [screenToFlowPosition, setNodes, nodes, edges, onFlowChange]);

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
        connectionMode={ConnectionMode.Loose}
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
