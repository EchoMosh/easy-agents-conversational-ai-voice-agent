
import { createContext, useContext, useState } from "react";

type NodeType = 'greetingNode' | 'speakNode' | 'endNode' | 'triggerNode';

const DragContext = createContext<{
  draggedNodeType: NodeType | null;
  setDraggedNodeType: (type: NodeType | null) => void;
} | null>(null);

export function DragProvider({ children }: { children: React.ReactNode }) {
  const [draggedNodeType, setDraggedNodeType] = useState<NodeType | null>(null);

  return (
    <DragContext.Provider value={{ draggedNodeType, setDraggedNodeType }}>
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
