
import { UniqueIdentifier, Announcements } from "@dnd-kit/core";
import { hasDraggableData } from "./utils";

export interface BoardAccessibilityProps {
  columnsId: string[];
  columnTitles: Record<string, string>;
  getDraggingLeadData: (leadId: UniqueIdentifier, columnId: string) => {
    leadsInColumn: any[];
    leadPosition: number;
    column: any;
  };
  pickedUpLeadColumn: string | null;
}

export function useBoardAccessibility({
  columnsId,
  columnTitles,
  getDraggingLeadData,
  pickedUpLeadColumn
}: BoardAccessibilityProps): Announcements {
  // Accessibility announcements
  return {
    onDragStart({ active }) {
      if (!hasDraggableData(active)) return "";
      
      if (active.data.current?.type === "Column") {
        const startColumnIdx = columnsId.findIndex((id) => id === active.id);
        const columnTitle = columnTitles[active.id as string] || "Unknown column";
        return `Picked up Column ${columnTitle} at position: ${startColumnIdx + 1} of ${columnsId.length}`;
      } 
      else if (active.data.current?.type === "Task") {
        const task = active.data.current.task;
        
        if (!task.columnId) return "";
        
        const { leadsInColumn, leadPosition, column } = getDraggingLeadData(
          active.id,
          task.columnId
        );
        
        const columnTitle = column?.title || "Unknown column";
        
        return `Picked up Lead at position: ${leadPosition + 1} of ${leadsInColumn.length} in column ${columnTitle}`;
      }
      return "";
    },
    
    onDragOver({ active, over }) {
      if (!hasDraggableData(active) || !hasDraggableData(over)) return "";
      
      if (active.data.current?.type === "Column" && over.data.current?.type === "Column") {
        const overColumnIdx = columnsId.findIndex((id) => id === over.id);
        const activeColumnTitle = columnTitles[active.id as string] || "Unknown column";
        const overColumnTitle = columnTitles[over.id as string] || "Unknown column";
        
        return `Column ${activeColumnTitle} was moved over ${overColumnTitle} at position ${overColumnIdx + 1} of ${columnsId.length}`;
      } 
      else if (active.data.current?.type === "Task" && over.data.current?.type === "Task") {
        const task = over.data.current.task;
        const { leadsInColumn, leadPosition, column } = getDraggingLeadData(
          over.id,
          task.columnId
        );
        
        const columnTitle = column?.title || "Unknown column";
        
        if (task.columnId !== pickedUpLeadColumn) {
          return `Lead was moved over column ${columnTitle} in position ${leadPosition + 1} of ${leadsInColumn.length}`;
        }
        
        return `Lead was moved over position ${leadPosition + 1} of ${leadsInColumn.length} in column ${columnTitle}`;
      }
      
      return "";
    },
    
    onDragEnd({ active, over }) {
      if (!hasDraggableData(active) || !over || !hasDraggableData(over)) {
        return "";
      }
      
      if (active.data.current?.type === "Column" && over.data.current?.type === "Column") {
        const overColumnPosition = columnsId.findIndex((id) => id === over.id);
        const activeColumnTitle = columnTitles[active.id as string] || "Unknown column";
        
        return `Column ${activeColumnTitle} was dropped into position ${overColumnPosition + 1} of ${columnsId.length}`;
      } 
      else if (active.data.current?.type === "Task" && over.data.current?.type === "Task") {
        const task = over.data.current.task;
        const { leadsInColumn, leadPosition, column } = getDraggingLeadData(
          over.id,
          task.columnId
        );
        
        const columnTitle = column?.title || "Unknown column";
        
        if (task.columnId !== pickedUpLeadColumn) {
          return `Lead was dropped into column ${columnTitle} in position ${leadPosition + 1} of ${leadsInColumn.length}`;
        }
        
        return `Lead was dropped into position ${leadPosition + 1} of ${leadsInColumn.length} in column ${columnTitle}`;
      }
      
      return "";
    },
    
    onDragCancel({ active }) {
      if (!hasDraggableData(active)) return "";
      
      return `Dragging ${active.data.current?.type} cancelled.`;
    },
  };
}
