
import { Active, DragOverlay } from "@dnd-kit/core";
import { Lead } from "@/pages/dashboard/leads";
import { KanbanTask } from "./task";
import { KanbanColumn } from "./column";
import { PipelineColumn } from "@/types/pipeline";

interface DragOverlayProps {
  active: Active | null;
  activeId: string | null;
  activeData: any;
  column: PipelineColumn | null;
  columnLeads: Lead[];
}

export function BoardDragOverlay({
  active,
  activeId,
  activeData,
  column,
  columnLeads,
}: DragOverlayProps) {
  if (!active || !activeId) {
    return null;
  }

  // If no data, just render a basic overlay
  if (!activeData) {
    return (
      <DragOverlay className="dnd-overlay">
        <div className="bg-card p-4 rounded-md shadow-lg">
          {activeId}
        </div>
      </DragOverlay>
    );
  }

  // If it's a column being dragged
  if (activeData.type === "Column" && column) {
    return (
      <DragOverlay className="dnd-overlay">
        <KanbanColumn
          column={column}
          columnLeads={columnLeads}
          isOverlay={true}
        />
      </DragOverlay>
    );
  }
  
  // If it's a task being dragged
  if (activeData.type === "Task") {
    return (
      <DragOverlay className="dnd-overlay">
        <KanbanTask
          lead={activeData.lead}
          columnId={activeData.columnId}
          onClick={() => {}}
          isPreview={true}
        />
      </DragOverlay>
    );
  }

  // Fallback overlay
  return (
    <DragOverlay className="dnd-overlay">
      <div className="bg-card p-4 rounded-md shadow-lg">
        {activeId}
      </div>
    </DragOverlay>
  );
}
