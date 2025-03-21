import { DragOverlay } from "@dnd-kit/core";
import { createPortal } from "react-dom";
import { BoardColumn } from "./BoardColumn";
import { TaskCard } from "./TaskCard";
import { Lead } from "@/pages/dashboard/leads";
import { Column } from "./BoardColumn";
import "./kanban-styles.css";

interface BoardDragOverlayProps {
  activeColumn: Column | null;
  activeLead: Lead | null;
  pickedUpLeadColumn: string | null;
  getColumnLeads: (columnId: string) => Lead[];
}

export function BoardDragOverlay({
  activeColumn,
  activeLead,
  pickedUpLeadColumn,
  getColumnLeads,
}: BoardDragOverlayProps) {
  if (!activeColumn && !activeLead) return null;

  return createPortal(
    <DragOverlay className="dnd-overlay">
      {activeColumn && (
        <BoardColumn
          isOverlay
          column={activeColumn}
          tasks={getColumnLeads(activeColumn.id.toString())}
        />
      )}
      {activeLead && (
        <TaskCard
          lead={activeLead}
          isOverlay
          columnId={pickedUpLeadColumn || ""}
        />
      )}
    </DragOverlay>,
    document.body
  );
}
