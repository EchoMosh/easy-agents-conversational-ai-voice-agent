
import { useCallback, useRef, useState, useEffect, KeyboardEvent } from 'react';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, Connection, Node, Edge, NodeTypes, useReactFlow, Panel, ConnectionMode } from '@xyflow/react';
import { Plus, MessageCircle, Smile, XCircle, Zap, PhoneForwarded, Webhook } from 'lucide-react';
import '@xyflow/react/dist/style.css';
import { NodeData } from '@/types/agent';
import { SpeakNode } from '@/components/flow/nodes/speak-node';
import { GreetingNode } from '@/components/flow/nodes/greeting-node';
import { EndNode } from '@/components/flow/nodes/end-node';
import { TriggerNode } from '@/components/flow/nodes/trigger-node';
import { TransferNode } from '@/components/flow/nodes/transfer-node';
import { WebhookNode } from '@/components/flow/nodes/webhook-node';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Create a context to provide the updateNodeData function to all nodes
import React from 'react';

// Create a context for the node update function
export const NodeUpdateContext = React.createContext<{
  updateNodeData: (nodeId: string, data: any) => void;
}>({
  updateNodeData: () => {},
});

const nodeTypes: NodeTypes = {
  speakNode: SpeakNode,
  greetingNode: GreetingNode,
  endNode: EndNode,
  triggerNode: TriggerNode,
  transferNode: TransferNode,
  webhookNode: WebhookNode
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
}

export function Flow({ initialNodes, initialEdges, onNodesChange, onEdgesChange }: FlowProps) {
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState(initialEdges);
  const [showWidgets, setShowWidgets] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, getNodes } = useReactFlow();
  const widgetButtonRef = useRef<HTMLButtonElement>(null);
  const flowContainerRef = useRef<HTMLDivElement>(null);
  
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Function to update node data - will be provided through context
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
    
    // After updating the local state, notify the parent component
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

  // Handle keyboard events - specifically Delete key
  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    // Check if the target is an input or textarea to avoid deleting nodes when editing text
    const target = event.target as HTMLElement;
    const isEditingText = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.isContentEditable;
    
    // Only handle Delete or Backspace when not editing text
    if ((event.key === 'Delete' || event.key === 'Backspace') && !isEditingText) {
      console.log('[Flow] Delete/Backspace key pressed, checking for selected nodes');
      
      const selectedNodes = nodes.filter(node => node.selected);
      if (selectedNodes.length > 0) {
        console.log('[Flow] Selected nodes to delete:', selectedNodes);
        
        // First, remove edges connected to these nodes
        const nodeIdsToDelete = new Set(selectedNodes.map(n => n.id));
        
        // Filter out edges connected to nodes that will be deleted
        const newEdges = edges.filter(edge => 
          !nodeIdsToDelete.has(edge.source) && !nodeIdsToDelete.has(edge.target)
        );
        
        // Filter out the nodes to be deleted
        const newNodes = nodes.filter(node => !nodeIdsToDelete.has(node.id));
        
        // Update the internal state
        setNodes(newNodes);
        setEdges(newEdges);
        
        // Notify parent components of changes - immediately call both functions without setTimeout
        console.log('[Flow] Notifying parent about deleted nodes and related edges');
        onNodesChange(newNodes);
        onEdgesChange(newEdges);
        
        // Prevent default behavior to avoid navigating back in the browser
        event.preventDefault();
      }
    }
  }, [nodes, edges, setNodes, setEdges, onNodesChange, onEdgesChange]);

  // Update nodes in parent component when initialNodes prop changes
  useEffect(() => {
    if (JSON.stringify(initialNodes) !== JSON.stringify(nodes)) {
      setNodes(initialNodes);
    }
  }, [initialNodes, setNodes]);

  // Update edges in parent component when initialEdges prop changes
  useEffect(() => {
    if (JSON.stringify(initialEdges) !== JSON.stringify(edges)) {
      setEdges(initialEdges);
    }
  }, [initialEdges, setEdges]);

  useEffect(() => {
    // Focus the container when it's mounted to ensure keyboard events are captured
    if (flowContainerRef.current) {
      flowContainerRef.current.focus();
    }
  }, []);

  const isValidConnection = (connection: Connection) => {
    // Check if source and target nodes exist
    const sourceNode = nodes.find(node => node.id === connection.source);
    const targetNode = nodes.find(node => node.id === connection.target);
    
    if (!sourceNode || !targetNode) {
      console.log('Connection invalid: Source or target node not found', { source: connection.source, target: connection.target });
      return false;
    }

    // Prevent self-connections
    if (connection.source === connection.target) {
      console.log('Connection invalid: Self-connection not allowed');
      return false;
    }

    // Simple duplicate check - just check source and target
    const existingConnection = edges.find(edge => 
      edge.target === connection.target && 
      edge.source === connection.source
    );
    
    if (existingConnection) {
      console.log('Connection invalid: Duplicate connection');
      return false;
    }

    return true;
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
    console.log('Connection attempt:', params);
    
    if (isValidConnection(params)) {
      console.log('Connection valid, creating edge');
      
      // Use React Flow's built-in addEdge function with the connection params
      const newEdges = addEdge(params, edges);
      console.log('New edges:', newEdges);
      setEdges(newEdges);
      onEdgesChange(newEdges);
    } else {
      console.log('Connection invalid');
    }
  }, [edges, onEdgesChange, setEdges, nodes]);

  const handleNodesChange = useCallback((changes: any) => {
    console.log('[Flow] handleNodesChange called with changes:', changes);
    onNodesChangeInternal(changes);
    
    // Get the current nodes after changes
    setTimeout(() => {
      console.log('[Flow] Notifying parent after node changes, current nodes:', getNodes());
      // Use getNodes() to get the latest nodes from React Flow
      const currentNodes = getNodes();
      onNodesChange(currentNodes);
    }, 0);
  }, [onNodesChange, onNodesChangeInternal, getNodes]);

  const handleEdgesChange = useCallback((changes: any) => {
    console.log('[Flow] handleEdgesChange called with changes:', changes);
    onEdgesChangeInternal(changes);
    
    // Use setTimeout to ensure we're getting the latest state
    setTimeout(() => {
      console.log('[Flow] Notifying parent after edge changes, current edges:', edges);
      const updatedEdges = edges.map(edge => ({ ...edge }));
      onEdgesChange(updatedEdges);
    }, 0);
  }, [edges, onEdgesChange, onEdgesChangeInternal]);

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

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setShowWidgets(true);
    }, 150);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setShowWidgets(false);
    }, 300);
  };

  return (
    <NodeUpdateContext.Provider value={{ updateNodeData }}>
      <div 
        ref={reactFlowWrapper} 
        className="w-full h-full"
      >
        {/* We add tabIndex to make the div focusable for keyboard events */}
        <div 
          ref={flowContainerRef}
          className="w-full h-full" 
          tabIndex={0} 
          onKeyDown={handleKeyDown}
          style={{ outline: 'none' }} // Remove focus outline
        >
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
            snapToGrid={true}
            snapGrid={[15, 15]}
            deleteKeyCode={['Delete', 'Backspace']} // Enable built-in delete with Delete or Backspace keys
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
                  case 'webhookNode':
                    return '#d946ef';
                  default:
                    return '#60a5fa';
                }
              }}
              maskColor="rgba(0, 0, 0, 0.05)"
            />
            <Panel position="bottom-left" className="space-y-2">
              <div 
                className="relative"
                onMouseLeave={handleMouseLeave}
              >
                <button
                  ref={widgetButtonRef}
                  onClick={() => setShowWidgets(!showWidgets)}
                  onMouseEnter={handleMouseEnter}
                  className="p-2 rounded-full bg-primary text-primary-foreground shadow-lg transform transition-transform hover:scale-105 backdrop-blur-xl hover:bg-primary/90"
                >
                  <Plus className={`h-5 w-5 transition-transform ${showWidgets ? 'rotate-45' : ''}`} />
                </button>
                {showWidgets && (
                  <div 
                    className="absolute bottom-14 left-0 bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 p-4 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] space-y-3 min-w-[180px] border border-white/20"
                    onMouseEnter={() => {
                      if (hoverTimeoutRef.current) {
                        clearTimeout(hoverTimeoutRef.current);
                      }
                    }}
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
