
import { createPortal } from "react-dom";
import { DragOverlay } from "@dnd-kit/core";
import { Lead } from "@/pages/dashboard/leads";
import { PipelineColumn } from "@/types/pipeline";
import { KanbanColumn } from "./column";
import { TaskCard } from "./TaskCard";
import { type ActiveDragItem } from "./hooks/use-kanban-drag";

interface DragOverlayContainerProps {
  activeItem: ActiveDragItem | null;
  activeLead?: Lead | null;
  activeColumn?: PipelineColumn | null;
  getColumnLeads?: (columnId: string) => Lead[];
}

export function DragOverlayContainer({ 
  activeItem, 
  activeLead, 
  activeColumn,
  getColumnLeads = () => []
}: DragOverlayContainerProps) {
  if (!activeItem) return null;
  
  // Determine what to render in the overlay based on the active item type
  return createPortal(
    <DragOverlay>
      {activeItem.type === "Column" && activeColumn && (
        <KanbanColumn
          column={activeColumn}
          columnLeads={getColumnLeads(activeColumn.id)}
          isOverlay
        />
      )}
      {activeItem.type === "Task" && activeLead && (
        <TaskCard
          lead={activeLead}
          isOverlay
        />
      )}
    </DragOverlay>,
    document.body
  );
}
