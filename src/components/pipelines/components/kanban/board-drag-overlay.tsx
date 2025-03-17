
import { createPortal } from "react-dom";
import { DragOverlay } from "@dnd-kit/core";
import { Lead } from "@/pages/dashboard/leads";
import { PipelineColumn } from "@/types/pipeline";
import { BoardColumn } from "./BoardColumn";
import { TaskCard } from "./TaskCard";

interface BoardDragOverlayProps {
  activeColumn: PipelineColumn | null;
  activeLead: Lead | null;
  pickedUpLeadColumn: string | null;
  getColumnLeads: (columnId: string) => Lead[];
}

export function BoardDragOverlay({ 
  activeColumn, 
  activeLead, 
  pickedUpLeadColumn,
  getColumnLeads 
}: BoardDragOverlayProps) {
  if (!activeColumn && !activeLead) return null;

  return createPortal(
    <DragOverlay>
      {activeColumn && (
        <BoardColumn
          column={activeColumn}
          columnLeads={getColumnLeads(activeColumn.id)}
          isOverlay
        />
      )}
      {activeLead && (
        <TaskCard
          lead={activeLead}
          columnId={pickedUpLeadColumn || ""}
          isOverlay
        />
      )}
    </DragOverlay>,
    document.body
  );
}
