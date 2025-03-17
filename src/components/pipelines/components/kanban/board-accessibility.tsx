
import { type Announcements, UniqueIdentifier } from "@dnd-kit/core";
import { Lead } from "@/pages/dashboard/leads";
import { PipelineColumn } from "@/types/pipeline";

interface BoardAccessibilityProps {
  columnsId: string[];
  columnTitles: Record<string, string>;
  pickedUpLeadColumn: string | null;
  getDraggingLeadData: (leadId: UniqueIdentifier, columnId: string) => {
    leadsInColumn: Lead[];
    leadPosition: number;
    column: PipelineColumn | undefined;
  };
}

export function useBoardAccessibility({
  columnsId,
  columnTitles,
  pickedUpLeadColumn,
  getDraggingLeadData,
}: BoardAccessibilityProps): Announcements {
  return {
    onDragStart({ active }) {
      if (!active.data.current) return "";
      
      if (active.data.current.type === "Column") {
        const startColumnIdx = columnsId.findIndex((id) => id === active.id);
        return `Picked up column ${columnTitles[active.id as string]} at position: ${startColumnIdx + 1} of ${columnsId.length}`;
      } 
      else if (active.data.current.type === "Task") {
        const task = active.data.current.task;
        const columnId = active.data.current.columnId || task.columnId;
        
        if (!columnId) return "";
        
        const { leadsInColumn, leadPosition, column } = getDraggingLeadData(
          active.id,
          columnId
        );
        
        return `Picked up Lead at position: ${leadPosition + 1} of ${leadsInColumn.length} in column ${column?.title || "Unknown"}`;
      }
      return "";
    },
    onDragOver({ active, over }) {
      if (!active.data.current || !over?.data.current) return "";
      
      if (active.data.current.type === "Column" && over.data.current.type === "Column") {
        const overColumnIdx = columnsId.findIndex((id) => id === over.id);
        return `Column ${columnTitles[active.id as string]} was moved over ${columnTitles[over.id as string]} at position ${overColumnIdx + 1} of ${columnsId.length}`;
      } 
      else if (active.data.current.type === "Task" && over.data.current.type === "Task") {
        const overColumnId = over.data.current.columnId || over.data.current.task.columnId;
        
        if (!overColumnId) return "";
        
        const { leadsInColumn, leadPosition, column } = getDraggingLeadData(
          over.id,
          overColumnId
        );
        
        const activeColumnId = active.data.current.columnId || active.data.current.task.columnId;
        
        if (overColumnId !== activeColumnId && pickedUpLeadColumn !== overColumnId) {
          return `Lead was moved over column ${column?.title || "Unknown"} in position ${leadPosition + 1} of ${leadsInColumn.length}`;
        }
        
        return `Lead was moved over position ${leadPosition + 1} of ${leadsInColumn.length} in column ${column?.title || "Unknown"}`;
      }
      
      return "";
    },
    onDragEnd({ active, over }) {
      if (!active.data.current || !over?.data.current) {
        return "";
      }
      
      if (active.data.current.type === "Column" && over.data.current.type === "Column") {
        const overColumnPosition = columnsId.findIndex((id) => id === over.id);
        return `Column ${columnTitles[active.id as string]} was dropped into position ${overColumnPosition + 1} of ${columnsId.length}`;
      } 
      else if (active.data.current.type === "Task" && over.data.current.type === "Task") {
        const overColumnId = over.data.current.columnId || over.data.current.task.columnId;
        
        if (!overColumnId) return "";
        
        const { leadsInColumn, leadPosition, column } = getDraggingLeadData(
          over.id,
          overColumnId
        );
        
        const activeColumnId = active.data.current.columnId || active.data.current.task.columnId;
        
        if (overColumnId !== activeColumnId && pickedUpLeadColumn !== overColumnId) {
          return `Lead was dropped into column ${column?.title || "Unknown"} in position ${leadPosition + 1} of ${leadsInColumn.length}`;
        }
        
        return `Lead was dropped into position ${leadPosition + 1} of ${leadsInColumn.length} in column ${column?.title || "Unknown"}`;
      }
      
      return "";
    },
    onDragCancel({ active }) {
      if (!active.data.current) return "";
      
      return `Dragging ${active.data.current.type} cancelled.`;
    },
  };
}
