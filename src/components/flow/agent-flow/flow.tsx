import { useCallback, useRef, useState, useEffect, KeyboardEvent } from 'react';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, Connection, Node, Edge, NodeTypes, useReactFlow, Panel, ConnectionMode, EdgeMouseHandler } from '@xyflow/react';
import { Plus, MessageCircle, Smile, XCircle, Zap, PhoneForwarded, Webhook, X } from 'lucide-react';
import '@xyflow/react/dist/style.css';
import { NodeData } from '@/types/agent';
import { GreetingNode } from '@/components/flow/nodes/greeting-node';
import { EndNode } from '@/components/flow/nodes/end-node';
import { TriggerNode } from '@/components/flow/nodes/trigger-node';
import { TransferNode } from '@/components/flow/nodes/transfer-node';
import { WebhookNode } from '@/components/flow/nodes/webhook-node';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import React from 'react';

export const NodeUpdateContext = React.createContext<{
  updateNodeData: (nodeId: string, data: any) => void;
}>({
  updateNodeData: () => {},
});

const nodeTypes: NodeTypes = {
  greetingNode: GreetingNode,
  endNode: EndNode,
  triggerNode: TriggerNode,
  transferNode: TransferNode,
  webhookNode: WebhookNode
};

// Custom edge with animated line
const ButtonEdge = ({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd }: any) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const edgePathStyle = {
    ...style,
    strokeWidth: isHovered ? 4 : 3,
    stroke: isHovered ? '#64748b' : '#94a3b8',
    strokeDasharray: '8 4',
    animation: 'dashdraw 0.8s linear infinite',
    transition: 'all 0.2s ease',
  };

  const dx = Math.abs(targetX - sourceX) * 0.5;
  const edgePath = `M ${sourceX} ${sourceY} C ${sourceX + dx} ${sourceY}, ${targetX - dx} ${targetY}, ${targetX} ${targetY}`;
  
  return (
    <>
      <path
        d={edgePath}
        style={{
          strokeWidth: 25,
          stroke: 'transparent',
          fill: 'none',
          cursor: 'pointer',
        }}
        className="edge-hit-area"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={edgePathStyle}
        markerEnd={markerEnd}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
    </>
  );
};

// Define edge types
const edgeTypes = {
  buttonEdge: ButtonEdge
};

const widgets = [
  { 
    type: 'greetingNode', 
    label: 'Speak', 
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
  },
  { 
    type: 'webhookNode', 
    label: 'Webhook', 
    icon: Webhook, 
    color: '#d946ef',
    description: 'Make HTTP requests to external services'
  }
];

interface FlowProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  onNodeDeletion?: (deletedNodes: Node[], remainingNodes: Node[], remainingEdges: Edge[]) => void;
}

export function Flow({ initialNodes, initialEdges, onNodesChange, onEdgesChange, onNodeDeletion }: FlowProps) {
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges);
  const [showWidgets, setShowWidgets] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, getNodes } = useReactFlow();
  const widgetButtonRef = useRef<HTMLButtonElement>(null);
  const flowContainerRef = useRef<HTMLDivElement>(null);

  const updateNodeData = useCallback((nodeId: string, newData: any) => {
    console.log(`[Flow] updateNodeData called for node ${nodeId} with data:`, newData);
    
    setNodes((nds) => {
      const updatedNodes = nds.map((node) => {
        if (node.id === nodeId) {
          const updatedNode = {
            ...node,
            data: { ...newData }
          };
          console.log(`[Flow] Updated node ${nodeId} from:`, node.data, 'to:', updatedNode.data);
          return updatedNode;
        }
        return node;
      });
      return updatedNodes;
    });
    
    setTimeout(() => {
      console.log(`[Flow] Notifying parent component about node ${nodeId} update`);
      const updatedNodes = nodes.map(node => 
        node.id === nodeId 
          ? { ...node, data: { ...newData } } 
          : node
      );
      
      onNodesChange(updatedNodes);
    }, 0);
  }, [nodes, setNodes, onNodesChange]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const isEditingText = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.isContentEditable;
    
    if ((event.key === 'Delete' || event.key === 'Backspace') && !isEditingText) {
      console.log('[Flow] Delete/Backspace key pressed, checking for selected nodes');
      
      const selectedNodes = nodes.filter(node => node.selected);
      const selectedEdges = edges.filter(edge => edge.selected);
      
      let nodesChanged = false;
      let edgesChanged = false;
      
      // Process selected nodes deletion
      if (selectedNodes.length > 0) {
        console.log('[Flow] Selected nodes to delete:', selectedNodes);
        
        const nodeIdsToDelete = new Set(selectedNodes.map(n => n.id));
        
        const newEdges = edges.filter(edge => 
          !nodeIdsToDelete.has(edge.source) && !nodeIdsToDelete.has(edge.target)
        );
        
        const newNodes = nodes.filter(node => !nodeIdsToDelete.has(node.id));
        
        setNodes(newNodes);
        setEdges(newEdges);
        
        console.log('[Flow] Notifying parent about deleted nodes and related edges');
        onNodesChange(newNodes);
        onEdgesChange(newEdges);
        
        // Call onNodeDeletion if provided
        if (onNodeDeletion) {
          onNodeDeletion(selectedNodes, newNodes, newEdges);
        }
        
        nodesChanged = true;
        edgesChanged = true;
      }
      
      // Process selected edges deletion
      if (selectedEdges.length > 0 && !nodesChanged) {
        console.log('[Flow] Selected edges to delete:', selectedEdges);
        
        const newEdges = edges.filter(edge => !edge.selected);
        
        setEdges(newEdges);
        
        console.log('[Flow] Notifying parent about deleted edges');
        onEdgesChange(newEdges);
        
        edgesChanged = true;
      }
      
      if (nodesChanged || edgesChanged) {
        event.preventDefault();
      }
    }
  }, [nodes, edges, setNodes, setEdges, onNodesChange, onEdgesChange, onNodeDeletion]);

  useEffect(() => {
    if (JSON.stringify(initialNodes) !== JSON.stringify(nodes)) {
      setNodes(initialNodes);
    }
  }, [initialNodes, setNodes]);

  useEffect(() => {
    if (JSON.stringify(initialEdges) !== JSON.stringify(edges)) {
      setEdges(initialEdges);
    }
  }, [initialEdges, setEdges]);

  useEffect(() => {
    if (flowContainerRef.current) {
      flowContainerRef.current.focus();
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showWidgets && 
          widgetButtonRef.current && 
          !widgetButtonRef.current.contains(event.target as Element) &&
          !document.querySelector('.widget-panel')?.contains(event.target as Element)) {
        setShowWidgets(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showWidgets]);

  const isValidConnection = useCallback((connection: Connection) => {
    const sourceNode = nodes.find(node => node.id === connection.source);
    const targetNode = nodes.find(node => node.id === connection.target);
    
    if (!sourceNode || !targetNode) {
      console.log('Connection invalid: Source or target node not found', { source: connection.source, target: connection.target });
      return false;
    }

    if (connection.source === connection.target) {
      console.log('Connection invalid: Self-connection not allowed');
      return false;
    }

    const existingConnection = edges.find(edge => 
      edge.target === connection.target && 
      edge.source === connection.source
    );
    
    if (existingConnection) {
      console.log('Connection invalid: Duplicate connection');
      return false;
    }

    return true;
  }, [nodes, edges]);

  const defaultEdgeOptions = {
    type: 'buttonEdge' as const,
    animated: true,
    style: {
      strokeWidth: 3,
      stroke: '#94a3b8',
    }
  };

  const onConnect = useCallback((params: Connection) => {
    console.log('Connection attempt:', params);
    
    if (isValidConnection(params)) {
      console.log('Connection valid, creating edge');
      
      const newEdges = addEdge(params, edges);
      console.log('New edges:', newEdges);
      setEdges(newEdges);
      onEdgesChange(newEdges);
    } else {
      console.log('Connection invalid');
    }
  }, [edges, onEdgesChange, setEdges, nodes, isValidConnection]);

  const handleNodesChange = useCallback((changes: any) => {
    console.log('[Flow] handleNodesChange called with changes:', changes);
    onNodesChangeInternal(changes);
    
    setTimeout(() => {
      console.log('[Flow] Notifying parent after node changes, current nodes:', getNodes());
      const currentNodes = getNodes();
      onNodesChange(currentNodes);
    }, 0);
  }, [onNodesChange, onNodesChangeInternal, getNodes]);

  const handleEdgesChange = useCallback((changes: any) => {
    console.log('[Flow] handleEdgesChange called with changes:', changes);
    onEdgesChangeInternal(changes);
    
    // Check if there are any remove changes (which indicate edge deletion)
    const hasRemoveChanges = changes.some((change: any) => change.type === 'remove');
    
    setTimeout(() => {
      console.log('[Flow] Notifying parent after edge changes, current edges:', edges);
      // Make sure we're sending the most current state
      const updatedEdges = edges.map(edge => ({ ...edge }));
      onEdgesChange(updatedEdges);
    }, 0);
  }, [edges, onEdgesChange, onEdgesChangeInternal]);

  // Update the onEdgeClick handler to avoid deleting edges on click
  const onEdgeClick: EdgeMouseHandler = useCallback((event, edge) => {
    // Do nothing or add custom selection logic here if needed
    console.log('[Flow] Edge clicked:', edge);
    // Not deleting the edge anymore, just logging it was clicked
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
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

      const nodeType = event.dataTransfer.getData('application/reactflow');
      if (!nodeType) return;

      let newNodeData: NodeData = {};
      
      switch (nodeType) {
        case 'greetingNode':
          newNodeData = { greeting: '', outcomes: [], actions: [] };
          break;
        case 'endNode':
          newNodeData = { message: 'Enter your message here' };
          break;
        case 'triggerNode':
          newNodeData = { platform: undefined, action: undefined };
          break;
        case 'transferNode':
          newNodeData = { message: 'Transfer to agent', outcomes: [] };
          break;
        case 'webhookNode':
          newNodeData = { url: '', method: 'GET' };
          break;
      }

      const newNode: Node = {
        id: `${nodeType}-${Date.now()}`,
        type: nodeType,
        position,
        data: newNodeData
      };

      console.log('[Flow] Adding new node:', newNode);
      const updatedNodes = [...nodes, newNode];
      setNodes(updatedNodes);
      onNodesChange(updatedNodes);
    }
  }, [screenToFlowPosition, setNodes, nodes, onNodesChange]);

  const toggleWidgetPanel = () => {
    setShowWidgets(prev => !prev);
  };

  return (
    <NodeUpdateContext.Provider value={{ updateNodeData }}>
      <div 
        ref={reactFlowWrapper} 
        className="w-full h-full"
      >
        <div 
          ref={flowContainerRef}
          className="w-full h-full" 
          tabIndex={0} 
          onKeyDown={handleKeyDown}
          style={{ outline: 'none' }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnect}
            onEdgeClick={onEdgeClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView
            defaultEdgeOptions={defaultEdgeOptions}
            connectionMode={ConnectionMode.Loose}
            className="bg-white dark:bg-gray-950"
            snapToGrid={true}
            snapGrid={[15, 15]}
            deleteKeyCode={['Delete', 'Backspace']}
          >
            <style>
              {`
                @keyframes dashdraw {
                  from {
                    stroke-dashoffset: 24;
                  }
                  to {
                    stroke-dashoffset: 0;
                  }
                }
                
                @keyframes pulse {
                  0%, 100% {
                    opacity: 1;
                    transform: scale(1);
                  }
                  50% {
                    opacity: 0.8;
                    transform: scale(1.05);
                  }
                }
                
                .edge-delete-button {
                  cursor: pointer;
                  z-index: 10;
                }
                
                .edge-delete-button .animate-pulse {
                  animation: pulse 1.5s infinite ease-in-out;
                }
                
                .edge-hit-area {
                  pointer-events: all;
                  fill: none;
                }
                
                .react-flow__edge {
                  pointer-events: all;
                  cursor: pointer;
                  transition: all 0.2s ease;
                }
                
                .react-flow__edge:hover .react-flow__edge-path {
                  stroke-width: 4px;
                  stroke: #64748b;
                  transition: all 0.2s ease;
                }
                
                .react-flow__edge-path {
                  stroke-dasharray: 8 4;
                  animation: dashdraw 0.8s linear infinite;
                  fill: none;
                }
              `}
            </style>
            
            <Background className="opacity-40" />
            <MiniMap
              className="!bg-white/60 dark:!bg-gray-900/60 backdrop-blur-xl shadow-lg rounded-2xl overflow-hidden"
              nodeColor={node => {
                switch (node.type) {
                  case 'greetingNode':
                    return '#60a5fa';
                  case 'triggerNode':
                    return '#fbbf24';
                  case 'endNode':
                    return '#f87171';
                  case 'transferNode':
                    return '#10b981';
                  case 'webhookNode':
                    return '#d946ef';
                  default:
                    return '#60a5fa';
                }
              }}
              maskColor="rgba(0, 0, 0, 0.05)"
            />
            <Panel position="bottom-left" className="space-y-2">
              <div className="relative">
                <button
                  ref={widgetButtonRef}
                  onClick={toggleWidgetPanel}
                  className="p-2 rounded-full bg-primary text-primary-foreground shadow-lg transform transition-transform hover:scale-105 backdrop-blur-xl hover:bg-primary/90"
                >
                  <Plus className={`h-5 w-5 transition-transform ${showWidgets ? 'rotate-45' : ''}`} />
                </button>
                {showWidgets && (
                  <div 
                    className="widget-panel absolute bottom-14 left-0 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 p-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] space-y-3 min-w-[180px] border border-white/20"
                  >
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
              </div>
            </Panel>
          </ReactFlow>
        </div>
      </div>
    </NodeUpdateContext.Provider>
  );
}
