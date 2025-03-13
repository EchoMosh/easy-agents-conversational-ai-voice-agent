
import { useCallback, useRef, useState, useEffect, KeyboardEvent } from 'react';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, Connection, Node, Edge, NodeTypes, useReactFlow, Panel, ConnectionMode, EdgeMouseHandler } from '@xyflow/react';
import { Plus, MessageCircle, Smile, XCircle, Zap, PhoneForwarded, Webhook, X, Keyboard } from 'lucide-react';
import '@xyflow/react/dist/style.css';
import { NodeData } from '@/types/agent';
import { GreetingNode } from '@/components/flow/nodes/greeting-node';
import { EndNode } from '@/components/flow/nodes/end-node';
import { TriggerNode } from '@/components/flow/nodes/trigger-node';
import { TransferNode } from '@/components/flow/nodes/transfer-node';
import { WebhookNode } from '@/components/flow/nodes/webhook-node';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { toast } from "sonner";

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

const edgeTypes = {
  buttonEdge: ButtonEdge
};

const widgets = [
  { 
    type: 'greetingNode', 
    label: 'Speak', 
    icon: Smile, 
    color: '#60a5fa',
    description: 'Start a conversation with customizable responses',
    shortcut: 'S'
  },
  { 
    type: 'endNode', 
    label: 'End', 
    icon: XCircle, 
    color: '#f87171',
    description: 'End the conversation flow',
    shortcut: 'E'
  },
  { 
    type: 'triggerNode', 
    label: 'Trigger', 
    icon: Zap, 
    color: '#fbbf24',
    description: 'Define when this flow should start',
    shortcut: 'T'
  },
  { 
    type: 'transferNode', 
    label: 'Transfer', 
    icon: PhoneForwarded, 
    color: '#10b981',
    description: 'Transfer the conversation to a live agent',
    shortcut: 'X'
  },
  { 
    type: 'webhookNode', 
    label: 'Webhook', 
    icon: Webhook, 
    color: '#d946ef',
    description: 'Make HTTP requests to external services',
    shortcut: 'W'
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
  const safeInitialNodes = Array.isArray(initialNodes) ? initialNodes : [];
  const safeInitialEdges = Array.isArray(initialEdges) ? initialEdges : [];
  
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState([]);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState([]);
  const [showWidgets, setShowWidgets] = useState(false);
  const [processingDeletion, setProcessingDeletion] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, getNodes } = useReactFlow();
  const widgetButtonRef = useRef<HTMLButtonElement>(null);
  const flowContainerRef = useRef<HTMLDivElement>(null);
  const [initialized, setInitialized] = useState(false);

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

  const createNodeFromType = useCallback((nodeType: string, position: { x: number, y: number }) => {
    let newNodeData: NodeData = {};
    
    switch (nodeType) {
      case 'greetingNode':
        newNodeData = { greeting: 'Hello, this is your agent. How can I help you?', outcomes: [], actions: [] };
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
      data: newNodeData,
      draggable: true
    };

    console.log('[Flow] Adding new node:', newNode);
    const updatedNodes = [...nodes, newNode];
    setNodes(updatedNodes);
    
    setTimeout(() => {
      onNodesChange(updatedNodes);
    }, 0);
    
    return newNode;
  }, [nodes, setNodes, onNodesChange]);

  const handleContextMenuAddNode = useCallback((nodeType: string, event: React.MouseEvent) => {
    if (reactFlowWrapper.current) {
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });
      
      createNodeFromType(nodeType, position);
      toast.success(`Added ${widgets.find(w => w.type === nodeType)?.label || nodeType} node`);
    }
  }, [screenToFlowPosition, createNodeFromType, widgets]);

  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const isEditingText = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.isContentEditable;
    
    if ((event.key === 'Delete' || event.key === 'Backspace') && !isEditingText && !processingDeletion) {
      console.log('[Flow] Delete/Backspace key pressed, checking for selected nodes');
      
      setProcessingDeletion(true);
      
      const selectedNodes = nodes.filter(node => node.selected);
      const selectedEdges = edges.filter(edge => edge.selected);
      
      let nodesChanged = false;
      let edgesChanged = false;
      
      if (selectedNodes.length > 0) {
        console.log('[Flow] Selected nodes to delete:', selectedNodes);
        
        const nodeIdsToDelete = new Set(selectedNodes.map(n => n.id));
        
        const newEdges = edges.filter(edge => 
          !nodeIdsToDelete.has(edge.source) && !nodeIdsToDelete.has(edge.target)
        );
        
        const newNodes = nodes.filter(node => !nodeIdsToDelete.has(node.id));
        
        Promise.all([
          new Promise<void>(resolve => {
            setNodes(newNodes);
            resolve();
          }),
          new Promise<void>(resolve => {
            setEdges(newEdges);
            resolve();
          })
        ]).then(() => {
          console.log('[Flow] Notifying parent about deleted nodes and related edges');
          onNodesChange(newNodes);
          onEdgesChange(newEdges);
          
          if (onNodeDeletion) {
            onNodeDeletion(selectedNodes, newNodes, newEdges);
          }
          
          setTimeout(() => {
            setProcessingDeletion(false);
          }, 200);
        });
        
        nodesChanged = true;
        edgesChanged = true;
      } else if (selectedEdges.length > 0 && !nodesChanged) {
        console.log('[Flow] Selected edges to delete:', selectedEdges);
        
        const newEdges = edges.filter(edge => !edge.selected);
        
        setEdges(newEdges);
        
        console.log('[Flow] Notifying parent about deleted edges');
        onEdgesChange(newEdges);
        
        edgesChanged = true;
        
        setTimeout(() => {
          setProcessingDeletion(false);
        }, 200);
      } else {
        setProcessingDeletion(false);
      }
      
      if (nodesChanged || edgesChanged) {
        event.preventDefault();
      }
    }
  }, [nodes, edges, setNodes, setEdges, onNodesChange, onEdgesChange, onNodeDeletion, processingDeletion]);

  const normalizeNodes = useCallback((inputNodes: Node[]) => {
    return inputNodes.map(node => ({
      ...node,
      draggable: node.draggable !== false,
      type: node.type || 'default',
      data: node.data || {}
    }));
  }, []);

  const handleFlowKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const isEditingText = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.isContentEditable;
    
    if (isEditingText) return;
    
    const keyPressed = event.key.toUpperCase();
    const widget = widgets.find(w => w.shortcut === keyPressed);
    
    if (widget && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      
      if (reactFlowWrapper.current) {
        const bounds = reactFlowWrapper.current.getBoundingClientRect();
        const position = screenToFlowPosition({
          x: bounds.width / 2,
          y: bounds.height / 2,
        });
        
        const newNode = createNodeFromType(widget.type, position);
        
        toast.success(`Added ${widget.label} node with keyboard shortcut '${widget.shortcut}'`);
      }
    }
    
    handleKeyDown(event);
  }, [widgets, createNodeFromType, handleKeyDown, screenToFlowPosition]);

  useEffect(() => {
    if (safeInitialNodes.length > 0 && !initialized) {
      console.log('[Flow] Setting initial nodes with normalization:', safeInitialNodes);
      const normalizedNodes = normalizeNodes(safeInitialNodes);
      setNodes(normalizedNodes);
      setInitialized(true);
      
      if (safeInitialEdges.length > 0) {
        setEdges(safeInitialEdges);
      }
    }
  }, [safeInitialNodes, safeInitialEdges, setNodes, setEdges, normalizeNodes, initialized]);

  useEffect(() => {
    if (flowContainerRef.current) {
      flowContainerRef.current.focus();
    }
  }, []);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (showWidgets && 
        widgetButtonRef.current && 
        !widgetButtonRef.current.contains(event.target as Element) &&
        !document.querySelector('.widget-panel')?.contains(event.target as Element)) {
      setShowWidgets(false);
    }
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
    
    const removeChanges = changes.filter(change => change.type === 'remove');
    if (removeChanges.length > 0) {
      console.log('[Flow] Remove changes detected:', removeChanges);
      if (processingDeletion) {
        console.log('[Flow] Skipping additional remove processing as deletion already in progress');
        onNodesChangeInternal(changes);
        return;
      }
    }
    
    onNodesChangeInternal(changes);
    
    if (removeChanges.length === 0) {
      setTimeout(() => {
        console.log('[Flow] Notifying parent after node changes, current nodes:', getNodes());
        const currentNodes = getNodes();
        onNodesChange(currentNodes);
      }, 0);
    }
  }, [onNodesChange, onNodesChangeInternal, getNodes, processingDeletion]);

  const handleEdgesChange = useCallback((changes: any) => {
    console.log('[Flow] handleEdgesChange called with changes:', changes);
    onEdgesChangeInternal(changes);
    
    const hasRemoveChanges = changes.some((change: any) => change.type === 'remove');
    
    setTimeout(() => {
      console.log('[Flow] Notifying parent after edge changes, current edges:', edges);
      const updatedEdges = edges.map(edge => ({ ...edge }));
      onEdgesChange(updatedEdges);
    }, 0);
  }, [edges, onEdgesChange, onEdgesChangeInternal]);

  const onEdgeClick: EdgeMouseHandler = useCallback((event, edge) => {
    console.log('[Flow] Edge clicked:', edge);
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
      
      console.log('[Flow] onDrop called with nodeType:', nodeType);
      
      if (!nodeType) {
        console.log('[Flow] No nodeType found in drag data');
        return;
      }

      createNodeFromType(nodeType, position);
    }
  }, [screenToFlowPosition, createNodeFromType]);

  const toggleWidgetPanel = () => {
    setShowWidgets(prev => !prev);
  };
  
  const selectedNode = nodes.find(node => node.selected);

  useEffect(() => {
    const selectedNode = nodes.find(node => node.selected);
    setSelectedNodeId(selectedNode ? selectedNode.id : null);
  }, [nodes]);

  return (
    <NodeUpdateContext.Provider value={{ updateNodeData }}>
      <div 
        ref={reactFlowWrapper} 
        className="w-full h-full relative"
      >
        <div 
          ref={flowContainerRef}
          className="w-full h-full" 
          tabIndex={0} 
          onKeyDown={handleFlowKeyDown}
          style={{ outline: 'none' }}
        >
          <ContextMenu>
            <ContextMenuTrigger className="w-full h-full">
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
                onInit={(reactFlowInstance) => {
                  console.log('[Flow] ReactFlow initialized');
                  setTimeout(() => {
                    reactFlowInstance.fitView({ padding: 0.2 });
                    
                    const currentNodes = reactFlowInstance.getNodes();
                    console.log('[Flow] Current nodes after init:', currentNodes);
                    
                    if (currentNodes.length === 0 && safeInitialNodes.length > 0) {
                      console.log('[Flow] Forcing node initialization after init');
                      setNodes(normalizeNodes(safeInitialNodes));
                    }
                  }, 100);
                }}
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
                    
                    .shortcut-key {
                      display: inline-flex;
                      align-items: center;
                      justify-content: center;
                      min-width: 1.5rem;
                      height: 1.5rem;
                      padding: 0 0.25rem;
                      font-size: 0.75rem;
                      font-weight: 600;
                      border-radius: 0.25rem;
                      border: 1px solid rgba(0, 0, 0, 0.1);
                      background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
                      color: #495057;
                      box-shadow: 
                        inset 0 0.5px 0 0 #fff, 
                        0 1px 2px rgba(0, 0, 0, 0.1),
                        0 2px 0 rgba(0, 0, 0, 0.08);
                      text-shadow: 0 1px 0 #fff;
                    }
                    
                    .dark .shortcut-key {
                      background: linear-gradient(to bottom, #2d3748, #1a202c);
                      color: #e2e8f0;
                      border-color: rgba(255, 255, 255, 0.1);
                      box-shadow: 
                        inset 0 0.5px 0 0 rgba(255, 255, 255, 0.1), 
                        0 1px 2px rgba(0, 0, 0, 0.3),
                        0 2px 0 rgba(0, 0, 0, 0.2);
                      text-shadow: 0 1px 0 #000;
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
                
                <Panel position="bottom-center" className="p-0">
                  <div 
                    className={`shortcuts-bar py-1.5 px-3 rounded-t-lg bg-white/80 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 shadow-sm`}
                  >
                    <div className="flex items-center justify-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      {widgets.map(widget => (
                        <div key={widget.type} className="flex items-center gap-1.5">
                          <span className="shortcut-key">{widget.shortcut}</span>
                          <span>{widget.label}</span>
                        </div>
                      ))}
                      <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                      <div className="flex items-center gap-1.5">
                        <span className="shortcut-key">Del</span>
                        <span>Delete</span>
                      </div>
                    </div>
                  </div>
                </Panel>
                
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
                                  <kbd className="ml-auto px-1.5 py-0.5 bg-muted/50 rounded text-[10px] font-semibold text-muted-foreground">{widget.shortcut}</kbd>
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
            </ContextMenuTrigger>
            
            <ContextMenuContent className="w-64">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground mb-1">Add Node</div>
              {widgets.map((widget) => (
                <ContextMenuItem
                  key={widget.type}
                  onClick={(e) => handleContextMenuAddNode(widget.type, e)}
                  className="flex items-center gap-2"
                >
                  <span 
                    className="p-1 rounded-md"
                    style={{ color: widget.color }}
                  >
                    <widget.icon className="h-3.5 w-3.5" />
                  </span>
                  <span>{widget.label}</span>
                  <kbd className="ml-auto px-1.5 py-0.5 bg-muted/50 rounded text-[10px] font-semibold">{widget.shortcut}</kbd>
                </ContextMenuItem>
              ))}
            </ContextMenuContent>
          </ContextMenu>
        </div>
      </div>
    </NodeUpdateContext.Provider>
  );
}
