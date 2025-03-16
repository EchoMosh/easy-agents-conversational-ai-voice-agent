
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableStageProps {
  children: React.ReactNode;
  id: string; // Add the id prop to fix the TypeScript error
  disabled?: boolean;
}

export function SortableStage({ id, children, disabled = false }: SortableStageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id,
    disabled
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    // Apply a smoother transition, but only when not actively dragging
    transition: isDragging 
      ? undefined 
      : transition || "transform 200ms cubic-bezier(0.2, 0, 0, 1)",
    zIndex: isDragging ? 50 : 1, // Ensure dragged item stays on top
    position: "relative" as const,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      {...attributes} 
      {...listeners}
      className={`sortable-stage ${isDragging ? 'is-dragging' : ''}`}
    >
      {children}
    </div>
  );
}
