import { useCallback, useState } from 'react';
import { Node, Edge, useReactFlow } from '@xyflow/react';
import { toast } from 'sonner';
import { NodeData } from '@/types/agent';
import { widgets } from '../widgets/widget-definitions';

export function useNodeManagement() {
  const [processingDeletion, setProcessingDeletion] = useState(false);
  const [rightClickedNodeId, setRightClickedNodeId] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number, y: number } | null>(null);
  const { screenToFlowPosition } = useReactFlow();

  const createNodeFromType = useCallback((
    nodeType: string, 
    position: { x: number, y: number },
    nodes: Node[],
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
    onNodesChange: (nodes: Node[]) => void
  ) => {
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
  }, []);

  const handleContextMenuAddNode = useCallback((
    nodeType: string,
    nodes: Node[],
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
    onNodesChange: (nodes: Node[]) => void,
    reactFlowWrapperRef: React.RefObject<HTMLDivElement>
  ) => {
    if (reactFlowWrapperRef.current && contextMenuPosition) {
      console.log('[Flow] Adding node from context menu at position:', contextMenuPosition);
      
      const position = screenToFlowPosition({
        x: contextMenuPosition.x,
        y: contextMenuPosition.y,
      });
      
      console.log('[Flow] Converted to flow position:', position);
      
      const newNode = createNodeFromType(nodeType, position, nodes, setNodes, onNodesChange);
      console.log('[Flow] Created new node:', newNode);
      
      // Clear the context menu after adding a node
      setContextMenuPosition(null);
      setRightClickedNodeId(null);
      
      toast.success(`Added ${widgets.find(w => w.type === nodeType)?.label || nodeType} node`);
    } else {
      console.error('[Flow] reactFlowWrapperRef is not available or contextMenuPosition is null');
    }
  }, [screenToFlowPosition, contextMenuPosition, widgets, toast, createNodeFromType]);

  const handleNodeContextMenu = useCallback((
    event: React.MouseEvent, 
    node: Node,
    reactFlowWrapperRef: React.RefObject<HTMLDivElement>
  ) => {
    // Prevent default browser context menu
    event.preventDefault();
    event.stopPropagation();
    
    console.log('[Flow] Node context menu triggered for node:', node.id);
    setRightClickedNodeId(node.id);
    
    // Set the context menu position at the mouse coordinates
    setContextMenuPosition({
      x: event.clientX,
      y: event.clientY
    });
  }, []);

  const handlePaneContextMenu = useCallback((
    event: React.MouseEvent,
    reactFlowWrapperRef: React.RefObject<HTMLDivElement>
  ) => {
    // Prevent default browser context menu
    event.preventDefault();
    event.stopPropagation();
    
    console.log('[Flow] Pane context menu triggered at:', event.clientX, event.clientY);
    setRightClickedNodeId(null);
    
    // Set the context menu position at the mouse coordinates
    setContextMenuPosition({
      x: event.clientX,
      y: event.clientY
    });
  }, []);

  const handleDeleteSelectedNode = useCallback((
    selectedNodeId: string | null,
    nodes: Node[],
    edges: Edge[],
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>,
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>,
    onNodesChange: (nodes: Node[]) => void,
    onEdgesChange: (edges: Edge[]) => void,
    onNodeDeletion?: (deletedNodes: Node[], remainingNodes: Node[], remainingEdges: Edge[]) => void
  ) => {
    const nodeIdToDelete = rightClickedNodeId || selectedNodeId;
    
    if (nodeIdToDelete) {
      console.log('[Flow] Deleting node:', nodeIdToDelete);
      setProcessingDeletion(true);
      
      const nodeToDelete = nodes.find(node => node.id === nodeIdToDelete);
      
      if (nodeToDelete) {
        const nodeIdsToDelete = new Set([nodeIdToDelete]);
        
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
          console.log('[Flow] Notifying parent about deleted node and related edges');
          onNodesChange(newNodes);
          onEdgesChange(newEdges);
          
          if (onNodeDeletion) {
            onNodeDeletion([nodeToDelete], newNodes, newEdges);
          }
          
          toast.success(`Node deleted`);
          
          // Clear context menu after deletion
          setContextMenuPosition(null);
          setRightClickedNodeId(null);
          setProcessingDeletion(false);
        });
      } else {
        setProcessingDeletion(false);
        // Clear context menu if node not found
        setContextMenuPosition(null);
        setRightClickedNodeId(null);
      }
    }
  }, [rightClickedNodeId, setRightClickedNodeId, setProcessingDeletion, toast, setContextMenuPosition]);

  return {
    processingDeletion,
    rightClickedNodeId,
    contextMenuPosition,
    createNodeFromType,
    handleContextMenuAddNode,
    handleNodeContextMenu,
    handlePaneContextMenu,
    handleDeleteSelectedNode,
    setRightClickedNodeId,
    setContextMenuPosition
  };
}
