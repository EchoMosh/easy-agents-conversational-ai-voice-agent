import { useCallback, useRef, useState, useEffect, KeyboardEvent } from 'react';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, Connection, Node, Edge, NodeTypes, useReactFlow, Panel, ConnectionMode, EdgeMouseHandler, NodeChange, NodeRemoveChange } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './flow-styles.css';

import { NodeData } from '@/types/agent';
import { GreetingNode } from '@/components/flow/nodes/greeting-node';
import { EndNode } from '@/components/flow/nodes/end-node';
import { TriggerNode } from '@/components/flow/nodes/trigger-node';
import { toast } from "sonner";

import { NodeUpdateContext } from './node-update-context';
import { ButtonEdge } from './edges/button-edge';
import { WidgetPanel } from './widgets/widget-panel';
import { FlowContextMenu } from './context-menu/flow-context-menu';
import { useNodeManagement } from './hooks/use-node-management';
import { useEdgeManagement } from './hooks/use-edge-management';
import { useDragAndDrop } from './hooks/use-drag-and-drop';

// Define a function to generate unique IDs
const generateUniqueId = () => `node_${Math.random().toString(36).substr(2, 9)}`;

// Use NodeType from source location
type NodeType = 'greetingNode' | 'endNode' | 'triggerNode';

const nodeTypes: NodeTypes = {
  greetingNode: GreetingNode,
  endNode: EndNode,
  triggerNode: TriggerNode
};

const edgeTypes = {
  buttonEdge: ButtonEdge
};

interface FlowProps {
  initialNodes: Node[];
  initialEdges: Edge[];
  onNodesChange: (nodes: Node[]) => void;
  onEdgesChange: (edges: Edge[]) => void;
  onNodeDeletion?: (deletedNodes: Node[], remainingNodes: Node[], remainingEdges: Edge[]) => void;
  onAddNode?: (node: Node<NodeData>) => void;
  onConnect?: (params: Connection) => void;
}

export function Flow({ initialNodes, initialEdges, onNodesChange, onEdgesChange, onNodeDeletion, onAddNode, onConnect }: FlowProps) {
  const safeInitialNodes = Array.isArray(initialNodes) ? initialNodes : [];
  const safeInitialEdges = Array.isArray(initialEdges) ? initialEdges : [];
  
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState([]);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState([]);
  const [showWidgets, setShowWidgets] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { getNodes, screenToFlowPosition } = useReactFlow();
  const flowContainerRef = useRef<HTMLDivElement>(null);
  const [initialized, setInitialized] = useState(false);

  // Import custom hooks
  const { 
    processingDeletion, 
    rightClickedNodeId, 
    contextMenuPosition,
    createNodeFromType,
    handleContextMenuAddNode: handleContextMenuAddNodeBase,
    handleNodeContextMenu: handleNodeContextMenuBase,
    handlePaneContextMenu: handlePaneContextMenuBase,
    handleDeleteSelectedNode: handleDeleteSelectedNodeBase,
    setRightClickedNodeId,
    setContextMenuPosition,
  } = useNodeManagement();
  
  const { 
    isValidConnection, 
    defaultEdgeOptions,
    onConnect: onConnectInternal,
    onEdgeClick 
  } = useEdgeManagement();
  
  const { 
    onDragOver, 
    onDragStart, 
    onDrop: onDropBase 
  } = useDragAndDrop();

  // Get ReactFlow methods for viewport management
  const { getViewport, fitView, setViewport } = useReactFlow();
  
  // Add ref to store the current viewport position
  const viewportRef = useRef<{ x: number, y: number, zoom: number } | null>(null);
  
  // Add state to track if we're in a context menu operation
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false);

  // Update isContextMenuOpen when contextMenuPosition changes and preserve viewport
  useEffect(() => {
    const newIsOpen = contextMenuPosition !== null;
    setIsContextMenuOpen(newIsOpen);
    
    // Save the current viewport when opening the context menu
    if (newIsOpen && !isContextMenuOpen) {
      viewportRef.current = getViewport();
      console.log('[Flow] Saved viewport state:', viewportRef.current);
    }
    
    // If the context menu is open, force the viewport to stay fixed
    if (newIsOpen && viewportRef.current) {
      // Set a short timeout to allow ReactFlow to finish any internal operations
      setTimeout(() => {
        setViewport(viewportRef.current!);
        console.log('[Flow] Restored viewport state');
      }, 10);
    }
  }, [contextMenuPosition, isContextMenuOpen, getViewport, setViewport]);

  // Hook implementations with dependencies
  const handleContextMenuAddNode = useCallback((nodeType: string, position?: { x: number; y: number }) => {
    console.log(`[Flow] Adding node of type ${nodeType} at position:`, position);
    
    // Use provided position or calculate a default position
    const screenPosition = position || {
      x: 100,
      y: 100
    };
    
    // Convert screen coordinates to flow coordinates
    const flowPosition = screenToFlowPosition({
      x: screenPosition.x,
      y: screenPosition.y
    });
    
    console.log('[Flow] Converted to flow position:', flowPosition);
    
    // Create a new node
    const newNode: Node<NodeData> = {
      id: generateUniqueId(),
      type: nodeType,
      position: flowPosition,
      data: { label: `New ${nodeType}` },
    };
    
    // Add the new node to the flow
    setNodes((nds) => [...nds, newNode]);
    
    // Notify parent component
    if (onAddNode) {
      onAddNode(newNode);
    }
    
    // Close the context menu
    setContextMenuPosition(null);
    setRightClickedNodeId(null);
  }, [onAddNode, setNodes, setContextMenuPosition, setRightClickedNodeId, screenToFlowPosition]);

  const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    // Prevent default browser context menu
    event.preventDefault();
    event.stopPropagation();
    
    // Set context menu position based on mouse coordinates
    setContextMenuPosition({
      x: event.clientX,
      y: event.clientY,
    });
    
    // Set the ID of the right-clicked node
    setRightClickedNodeId(node.id);
    
    console.log(`[Flow] Node context menu opened for node: ${node.id}`);
  }, []);

  const handlePaneContextMenu = useCallback((event: React.MouseEvent) => {
    // Prevent default browser context menu
    event.preventDefault();
    event.stopPropagation();
    
    // Get the position for the context menu
    const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
    if (!reactFlowBounds) return;
    
    // Store exact client coordinates for the context menu
    setContextMenuPosition({
      x: event.clientX,
      y: event.clientY,
    });
    
    // Log the position
    console.log(`[Flow] Pane context menu opened at client coordinates: ${event.clientX}, ${event.clientY}`);
    console.log(`[Flow] This will be converted to flow coordinates when a node is added`);
    
    // Clear the right-clicked node ID since we clicked on empty space
    setRightClickedNodeId(null);
  }, [reactFlowWrapper]);

  const handleDeleteSelectedNode = useCallback(() => {
    if (rightClickedNodeId) {
      console.log(`[Flow] Deleting node: ${rightClickedNodeId}`);
      
      // Get the current nodes and filter out the deleted one
      const updatedNodes = nodes.filter((node) => node.id !== rightClickedNodeId);
      
      // Get the current edges and filter out any connected to the deleted node
      const updatedEdges = edges.filter(
        (edge) => edge.source !== rightClickedNodeId && edge.target !== rightClickedNodeId
      );
      
      // Update state
      setNodes(updatedNodes);
      setEdges(updatedEdges);
      
      // Notify parent component
      if (onNodesChange) {
        // Convert the complete node arrays to satisfy the API
        onNodesChange(updatedNodes);
      }
      
      if (onEdgesChange) {
        onEdgesChange(updatedEdges);
      }
      
      // Close the context menu
      setContextMenuPosition(null);
      setRightClickedNodeId(null);
    }
  }, [rightClickedNodeId, nodes, edges, setNodes, setEdges, onNodesChange, onEdgesChange, setContextMenuPosition, setRightClickedNodeId]);

  const onDrop = useCallback((event: React.DragEvent) => {
    const createNodeAtPosition = (nodeType: string, position: { x: number, y: number }) => {
      createNodeFromType(nodeType, position, nodes, setNodes, onNodesChange);
    };
    
    onDropBase(event, reactFlowWrapper, createNodeAtPosition);
  }, [onDropBase, reactFlowWrapper, createNodeFromType, nodes, setNodes, onNodesChange]);

  const normalizeNodes = useCallback((inputNodes: Node[]) => {
    return inputNodes.map(node => ({
      ...node,
      draggable: node.draggable !== false,
      type: node.type || 'default',
      data: node.data || {}
    }));
  }, []);

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
    
    setTimeout(() => {
      console.log('[Flow] Notifying parent after edge changes, current edges:', edges);
      const updatedEdges = edges.map(edge => ({ ...edge }));
      onEdgesChange(updatedEdges);
    }, 0);
  }, [edges, onEdgesChange, onEdgesChangeInternal]);

  // Initialize nodes and edges
  useEffect(() => {
    if (safeInitialNodes.length > 0 && !initialized) {
      console.log('[Flow] Setting initial nodes with normalization:', safeInitialNodes);
      const normalizedNodes = normalizeNodes(safeInitialNodes);
      setNodes(normalizedNodes);
      setInitialized(true);
      
      if (safeInitialEdges.length > 0) {
        setEdges(safeInitialEdges);
      }
      
      // Defer fitting view until nodes are loaded
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 500 });
      }, 200);
    }
  }, [safeInitialNodes, safeInitialEdges, setNodes, setEdges, normalizeNodes, initialized, fitView]);

  // Focus the flow container on mount
  useEffect(() => {
    if (flowContainerRef.current) {
      flowContainerRef.current.focus();
    }
  }, []);

  // Track selected node
  useEffect(() => {
    const selectedNode = nodes.find(node => node.selected);
    setSelectedNodeId(selectedNode ? selectedNode.id : null);
  }, [nodes]);

  // Close context menu when clicking anywhere
  useEffect(() => {
    const handleClick = () => {
      setContextMenuPosition(null);
      setRightClickedNodeId(null);
    };
    
    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  // Create a wrapper for onConnect to adapt to ReactFlow's expected signature
  const onConnectHandler = useCallback((params: Connection) => {
    if (onConnect) {
      // Use the prop if provided
      onConnect(params);
    } else {
      // Otherwise use our internal implementation
      onConnectInternal(params, edges, setEdges, onEdgesChange, nodes);
    }
  }, [onConnect, onConnectInternal, edges, setEdges, onEdgesChange, nodes]);

  // Add back the handleKeyDown function to delete selected nodes
  const handleKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const isEditingText = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.isContentEditable;
    
    if ((event.key === 'Delete' || event.key === 'Backspace') && !isEditingText && !processingDeletion) {
      console.log('[Flow] Delete/Backspace key pressed, checking for selected nodes');
      
      const selectedNodes = nodes.filter(node => node.selected);
      const selectedEdges = edges.filter(edge => edge.selected);
      
      if (selectedNodes.length > 0 || selectedEdges.length > 0) {
        event.preventDefault();
        
        const nodeIdsToDelete = new Set(selectedNodes.map(n => n.id));
        
        const newEdges = edges.filter(edge => 
          !nodeIdsToDelete.has(edge.source) && !nodeIdsToDelete.has(edge.target) && !edge.selected
        );
        
        const newNodes = nodes.filter(node => !nodeIdsToDelete.has(node.id));
        
        setNodes(newNodes);
        setEdges(newEdges);
        
        // Notify parent component to update the backend
        if (onNodesChange) {
          onNodesChange(newNodes);
        }
        
        if (onEdgesChange) {
          onEdgesChange(newEdges);
        }
        
        // Call the specific node deletion callback if provided
        if (onNodeDeletion && selectedNodes.length > 0) {
          onNodeDeletion(selectedNodes, newNodes, newEdges);
        }
      }
    }
  }, [nodes, edges, setNodes, setEdges, onNodesChange, onEdgesChange, onNodeDeletion, processingDeletion]);

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
          onKeyDown={handleKeyDown}
          style={{ outline: 'none' }}
        >
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
            onConnect={onConnectHandler}
            onEdgeClick={onEdgeClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            defaultEdgeOptions={defaultEdgeOptions}
            connectionMode={ConnectionMode.Loose}
            className="bg-white dark:bg-gray-950 w-full h-full"
            snapToGrid={true}
            snapGrid={[15, 15]}
            deleteKeyCode={['Delete', 'Backspace']} // Re-enable delete key functionality
            onNodeContextMenu={handleNodeContextMenu}
            onPaneContextMenu={handlePaneContextMenu}
            onInit={(reactFlowInstance) => {
              console.log('[Flow] ReactFlow initialized');
              reactFlowInstance.fitView({ padding: 0.2 });
            }}
            zoomActivationKeyCode={null} // Keep zoom activation key disabled
            panActivationKeyCode={null} // Keep pan activation key disabled
            disableKeyboardA11y={true} // Keep keyboard accessibility disabled except for delete
          >
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
                  default:
                    return '#60a5fa';
                }
              }}
              maskColor="rgba(0, 0, 0, 0.05)"
            />
            
            <WidgetPanel 
              showWidgets={showWidgets} 
              setShowWidgets={setShowWidgets}
              onDragStart={onDragStart}
            />
          </ReactFlow>
        </div>
        
        {/* Render context menu separately from the flow */}
        {contextMenuPosition && (
          <FlowContextMenu
            rightClickedNodeId={rightClickedNodeId}
            contextMenuPosition={contextMenuPosition}
            onAddNode={handleContextMenuAddNode}
            onDeleteNode={handleDeleteSelectedNode}
          >
            <></>
          </FlowContextMenu>
        )}
      </div>
    </NodeUpdateContext.Provider>
  );
}
