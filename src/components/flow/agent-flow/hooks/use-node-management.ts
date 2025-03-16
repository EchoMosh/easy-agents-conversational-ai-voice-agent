
import { useCallback, useState } from 'react';
import { Node, Edge, useReactFlow } from '@xyflow/react';
import { toast } from 'sonner';
import { NodeData } from '@/types/agent';
import { widgets } from '../widgets/widget-definitions';

export function useNodeManagement() {
  const [processingDeletion, setProcessingDeletion] = useState(false);
  const [rightClickedNodeId, setRightClickedNodeId] = useState<string | null>(null);
  const [contextMenuPosition, setContextMenuPosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const { screenToFlowPosition, getNodes } = useReactFlow();

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
    if (reactFlowWrapperRef.current) {
      const position = screenToFlowPosition({
        x: contextMenuPosition.x,
        y: contextMenuPosition.y,
      });
      
      createNodeFromType(nodeType, position, nodes, setNodes, onNodesChange);
      toast.success(`Added ${widgets.find(w => w.type === nodeType)?.label || nodeType} node`);
    }
  }, [screenToFlowPosition, contextMenuPosition, widgets, toast, createNodeFromType]);

  const handleNodeContextMenu = useCallback((
    event: React.MouseEvent, 
    node: Node,
    reactFlowWrapperRef: React.RefObject<HTMLDivElement>
  ) => {
    event.preventDefault();
    
    console.log('[Flow] Node context menu triggered for node:', node.id);
    setRightClickedNodeId(node.id);
    
    if (reactFlowWrapperRef.current) {
      const bounds = reactFlowWrapperRef.current.getBoundingClientRect();
      setContextMenuPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top
      });
    }
  }, []);

  const handlePaneContextMenu = useCallback((
    event: React.MouseEvent,
    reactFlowWrapperRef: React.RefObject<HTMLDivElement>
  ) => {
    event.preventDefault();
    
    console.log('[Flow] Pane context menu triggered at:', event.clientX, event.clientY);
    setRightClickedNodeId(null);
    
    if (reactFlowWrapperRef.current) {
      const bounds = reactFlowWrapperRef.current.getBoundingClientRect();
      setContextMenuPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top
      });
    }
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
          
          setTimeout(() => {
            setRightClickedNodeId(null);
            setProcessingDeletion(false);
          }, 200);
        });
      } else {
        setProcessingDeletion(false);
      }
    }
  }, [rightClickedNodeId, setRightClickedNodeId, setProcessingDeletion, toast]);

  return {
    processingDeletion,
    rightClickedNodeId,
    contextMenuPosition,
    createNodeFromType,
    handleContextMenuAddNode,
    handleNodeContextMenu,
    handlePaneContextMenu,
    handleDeleteSelectedNode,
    setRightClickedNodeId
  };
}
