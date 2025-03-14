
import { useCallback } from 'react';
import { useReactFlow } from '@xyflow/react';

export function useDragAndDrop() {
  const { screenToFlowPosition } = useReactFlow();
  
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = useCallback((
    event: React.DragEvent,
    reactFlowWrapperRef: React.RefObject<HTMLDivElement>,
    createNodeCallback: (nodeType: string, position: { x: number, y: number }) => void
  ) => {
    event.preventDefault();

    if (reactFlowWrapperRef.current) {
      const bounds = reactFlowWrapperRef.current.getBoundingClientRect();
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

      createNodeCallback(nodeType, position);
    }
  }, [screenToFlowPosition]);

  return {
    onDragOver,
    onDragStart,
    onDrop
  };
}
