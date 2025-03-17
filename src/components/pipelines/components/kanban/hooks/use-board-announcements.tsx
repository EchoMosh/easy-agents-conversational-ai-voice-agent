
import { Announcements, UniqueIdentifier } from "@dnd-kit/core";
import { Lead } from "@/pages/dashboard/leads";
import { PipelineColumn } from "@/types/pipeline";

interface UseBoardAnnouncementsProps {
  columnsId: string[];
  pipeline: { columns: PipelineColumn[] };
  pickedUpLeadColumn: React.MutableRefObject<string | null>;
  getColumnLeads: (columnId: string) => Lead[];
}

export function useBoardAnnouncements({
  columnsId,
  pipeline,
  pickedUpLeadColumn,
  getColumnLeads
}: UseBoardAnnouncementsProps): Announcements {
  // Helper function to get data about the dragging lead
  function getDraggingLeadData(leadId: UniqueIdentifier, columnId: string) {
    const leadsInColumn = getColumnLeads(columnId);
    const leadPosition = leadsInColumn.findIndex((lead) => lead.id === leadId);
    const column = pipeline.columns.find((col) => col.id === columnId);
    return {
      leadsInColumn,
      leadPosition,
      column,
    };
  }

  return {
    onDragStart({ active }) {
      if (!active.data.current) return "";
      
      if (active.data.current.type === "Column") {
        const startColumnIdx = columnsId.findIndex((id) => id === active.id);
        const startColumn = pipeline.columns[startColumnIdx];
        return `Picked up Column ${startColumn?.title} at position: ${startColumnIdx + 1} of ${columnsId.length}`;
      } 
      else if (active.data.current.type === "Task") {
        const task = active.data.current.task;
        pickedUpLeadColumn.current = task.columnId;
        
        if (!pickedUpLeadColumn.current) return "";
        
        const { leadsInColumn, leadPosition, column } = getDraggingLeadData(
          active.id,
          pickedUpLeadColumn.current
        );
        
        return `Picked up Lead at position: ${leadPosition + 1} of ${leadsInColumn.length} in column ${column?.title}`;
      }
      return "";
    },
    onDragOver({ active, over }) {
      if (!active.data.current || !over?.data.current) return "";
      
      if (active.data.current.type === "Column" && over.data.current.type === "Column") {
        const overColumnIdx = columnsId.findIndex((id) => id === over.id);
        return `Column ${active.data.current.column.title} was moved over ${over.data.current.column.title} at position ${overColumnIdx + 1} of ${columnsId.length}`;
      } 
      else if (active.data.current.type === "Task") {
        const columnId = over.data.current.type === "Column" 
          ? String(over.id)
          : over.data.current.columnId || over.data.current.task?.columnId;
          
        if (!columnId) return "";
        
        const column = pipeline.columns.find(col => col.id === columnId);
        if (!column) return "";
        
        return `Lead was moved over column ${column.title}`;
      }
      
      return "";
    },
    onDragEnd({ active, over }) {
      pickedUpLeadColumn.current = null;
      
      if (!active.data.current || !over || !over.data.current) {
        return "Drag cancelled.";
      }
      
      if (active.data.current.type === "Column" && over.data.current.type === "Column") {
        const overColumnPosition = columnsId.findIndex((id) => id === over.id);
        return `Column ${active.data.current.column.title} was dropped into position ${overColumnPosition + 1} of ${columnsId.length}`;
      } 
      else if (active.data.current.type === "Task") {
        const columnId = over.data.current.type === "Column" 
          ? String(over.id)
          : over.data.current.columnId || over.data.current.task?.columnId;
          
        if (!columnId) return "Lead was dropped.";
        
        const column = pipeline.columns.find(col => col.id === columnId);
        if (!column) return "Lead was dropped.";
        
        return `Lead was dropped into column ${column.title}`;
      }
      
      return "Drop completed.";
    },
    onDragCancel({ active }) {
      pickedUpLeadColumn.current = null;
      
      if (!active.data.current) return "";
      
      return `Dragging ${active.data.current.type} cancelled.`;
    },
  };
}
