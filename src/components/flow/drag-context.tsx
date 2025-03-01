
import { createContext, useContext, useState } from "react";

// Make sure to export the DragContext
export type NodeType = 'greetingNode' | 'speakNode' | 'endNode' | 'triggerNode' | 'transferNode';

export const DragContext = createContext<{
  isDragging: boolean;
  draggedNodeType: NodeType | null;
  setDraggedNodeType: (type: NodeType | null) => void;
}>({
  isDragging: false,
  draggedNodeType: null,
  setDraggedNodeType: () => {},
});

export function DragProvider({ children }: { children: React.ReactNode }) {
  const [draggedNodeType, setDraggedNodeType] = useState<NodeType | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <DragContext.Provider value={{ isDragging, draggedNodeType, setDraggedNodeType }}>
      {children}
    </DragContext.Provider>
  );
}

export function useDrag() {
  const context = useContext(DragContext);
  if (!context) {
    throw new Error("useDrag must be used within a DragProvider");
  }
  return [context.draggedNodeType, context.setDraggedNodeType] as const;
}
