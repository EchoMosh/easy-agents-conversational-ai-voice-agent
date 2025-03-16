
import { useCallback, useRef, useState, useEffect, KeyboardEvent } from 'react';
import { ReactFlow, MiniMap, Controls, Background, useNodesState, useEdgesState, Connection, Node, Edge, NodeTypes, useReactFlow, Panel, ConnectionMode, EdgeMouseHandler } from '@xyflow/react';
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
import { ShortcutsBar } from './shortcuts-bar';
import { FlowContextMenu } from './context-menu/flow-context-menu';
import { useNodeManagement } from './hooks/use-node-management';
import { useKeyboardShortcuts } from './hooks/use-keyboard-shortcuts';
import { useEdgeManagement } from './hooks/use-edge-management';
import { useDragAndDrop } from './hooks/use-drag-and-drop';

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
}

export function Flow({ initialNodes, initialEdges, onNodesChange, onEdgesChange, onNodeDeletion }: FlowProps) {
  const safeInitialNodes = Array.isArray(initialNodes) ? initialNodes : [];
  const safeInitialEdges = Array.isArray(initialEdges) ? initialEdges : [];
  
  const [nodes, setNodes, onNodesChangeInternal] = useNodesState([]);
  const [edges, setEdges, onEdgesChangeInternal] = useEdgesState([]);
  const [showWidgets, setShowWidgets] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { getNodes } = useReactFlow();
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
  } = useNodeManagement();
  
  const { 
    handleFlowKeyDown: handleFlowKeyDownBase 
  } = useKeyboardShortcuts();
  
  const { 
    isValidConnection, 
    defaultEdgeOptions,
    onConnect: onConnectBase,
    onEdgeClick 
  } = useEdgeManagement();
  
  const { 
    onDragOver, 
    onDragStart, 
    onDrop: onDropBase 
  } = useDragAndDrop();

  // Hook implementations with dependencies
  const handleContextMenuAddNode = useCallback((nodeType: string) => {
    handleContextMenuAddNodeBase(
      nodeType, 
      nodes, 
      setNodes, 
      onNodesChange, 
      reactFlowWrapper
    );
  }, [handleContextMenuAddNodeBase, nodes, setNodes, onNodesChange, reactFlowWrapper]);

  const handleNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
    handleNodeContextMenuBase(event, node, reactFlowWrapper);
  }, [handleNodeContextMenuBase, reactFlowWrapper]);

  const handlePaneContextMenu = useCallback((event: React.MouseEvent) => {
    handlePaneContextMenuBase(event, reactFlowWrapper);
  }, [handlePaneContextMenuBase, reactFlowWrapper]);

  const handleDeleteSelectedNode = useCallback(() => {
    handleDeleteSelectedNodeBase(
      selectedNodeId, 
      nodes, 
      edges, 
      setNodes, 
      setEdges, 
      onNodesChange, 
      onEdgesChange, 
      onNodeDeletion
    );
  }, [
    handleDeleteSelectedNodeBase, selectedNodeId, nodes, edges, 
    setNodes, setEdges, onNodesChange, onEdgesChange, onNodeDeletion
  ]);

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
        
        setTimeout(() => {
          onNodesChange(newNodes);
          onEdgesChange(newEdges);
          
          if (onNodeDeletion && selectedNodes.length > 0) {
            onNodeDeletion(selectedNodes, newNodes, newEdges);
          }
        }, 0);
      }
    }
  }, [nodes, edges, setNodes, setEdges, onNodesChange, onEdgesChange, onNodeDeletion, processingDeletion]);

  const handleFlowKeyDown = useCallback((event: KeyboardEvent<HTMLDivElement>) => {
    const createNodeInCenter = (nodeType: string, position: { x: number, y: number }) => {
      if (reactFlowWrapper.current) {
        const { screenToFlowPosition } = useReactFlow();
        const flowPosition = screenToFlowPosition(position);
        return createNodeFromType(nodeType, flowPosition, nodes, setNodes, onNodesChange);
      }
    };
    
    handleFlowKeyDownBase(event, createNodeInCenter, reactFlowWrapper, handleKeyDown);
  }, [handleFlowKeyDownBase, createNodeFromType, handleKeyDown, nodes, setNodes, onNodesChange, reactFlowWrapper]);

  const onConnect = useCallback((params: Connection) => {
    onConnectBase(params, edges, setEdges, onEdgesChange, nodes);
  }, [onConnectBase, edges, setEdges, onEdgesChange, nodes]);

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
    }
  }, [safeInitialNodes, safeInitialEdges, setNodes, setEdges, normalizeNodes, initialized]);

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
          <FlowContextMenu
            rightClickedNodeId={rightClickedNodeId}
            onAddNode={handleContextMenuAddNode}
            onDeleteNode={handleDeleteSelectedNode}
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
              onNodeContextMenu={handleNodeContextMenu}
              onPaneContextMenu={handlePaneContextMenu}
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
              
              <ShortcutsBar />
              
              <WidgetPanel 
                showWidgets={showWidgets} 
                setShowWidgets={setShowWidgets}
                onDragStart={onDragStart}
              />
            </ReactFlow>
          </FlowContextMenu>
        </div>
      </div>
    </NodeUpdateContext.Provider>
  );
}
