import { Announcements, UniqueIdentifier } from "@dnd-kit/core";
import { Pipeline } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";
import { hasDraggableData } from "../utils";

interface UseBoardAnnouncementsProps {
  columnsId: UniqueIdentifier[];
  pipeline: Pipeline;
  pickedUpLeadColumn: { current: string | null };
  getColumnLeads: (columnId: string) => Lead[];
}

export function useBoardAnnouncements({
  columnsId,
  pipeline,
  pickedUpLeadColumn,
  getColumnLeads,
}: UseBoardAnnouncementsProps): Announcements {
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
      if (!hasDraggableData(active)) return;
      if (active.data.current?.type === "Column") {
        const startColumnIdx = columnsId.findIndex((id) => id === active.id);
        const startColumn = pipeline.columns[startColumnIdx];
        return `Picked up Column ${startColumn?.title} at position: ${
          startColumnIdx + 1
        } of ${columnsId.length}`;
      } else if (active.data.current?.type === "Task") {
        const columnId = active.data.current.columnId;
        pickedUpLeadColumn.current = columnId;
        const { leadsInColumn, leadPosition, column } = getDraggingLeadData(
          active.id,
          columnId
        );
        return `Picked up Lead ${
          active.data.current.task.content
        } at position: ${leadPosition + 1} of ${
          leadsInColumn.length
        } in column ${column?.title}`;
      }
    },
    onDragOver({ active, over }) {
      if (!hasDraggableData(active) || !hasDraggableData(over)) return;

      if (
        active.data.current?.type === "Column" &&
        over.data.current?.type === "Column"
      ) {
        const overColumnIdx = columnsId.findIndex((id) => id === over.id);
        return `Column ${active.data.current.column.title} was moved over ${
          over.data.current.column.title
        } at position ${overColumnIdx + 1} of ${columnsId.length}`;
      } else if (
        active.data.current?.type === "Task" &&
        over.data.current?.type === "Task"
      ) {
        const columnId = over.data.current.columnId;
        const { leadsInColumn, leadPosition, column } = getDraggingLeadData(
          over.id,
          columnId
        );
        if (columnId !== pickedUpLeadColumn.current) {
          return `Lead ${
            active.data.current.task.content
          } was moved over column ${column?.title} in position ${
            leadPosition + 1
          } of ${leadsInColumn.length}`;
        }
        return `Lead was moved over position ${leadPosition + 1} of ${
          leadsInColumn.length
        } in column ${column?.title}`;
      }
    },
    onDragEnd({ active, over }) {
      if (!hasDraggableData(active) || !hasDraggableData(over)) {
        pickedUpLeadColumn.current = null;
        return;
      }
      if (
        active.data.current?.type === "Column" &&
        over.data.current?.type === "Column"
      ) {
        const overColumnPosition = columnsId.findIndex((id) => id === over.id);

        return `Column ${
          active.data.current.column.title
        } was dropped into position ${overColumnPosition + 1} of ${
          columnsId.length
        }`;
      } else if (
        active.data.current?.type === "Task" &&
        over.data.current?.type === "Task"
      ) {
        const columnId = over.data.current.columnId;
        const { leadsInColumn, leadPosition, column } = getDraggingLeadData(
          over.id,
          columnId
        );
        if (columnId !== pickedUpLeadColumn.current) {
          return `Lead was dropped into column ${column?.title} in position ${
            leadPosition + 1
          } of ${leadsInColumn.length}`;
        }
        return `Lead was dropped into position ${leadPosition + 1} of ${
          leadsInColumn.length
        } in column ${column?.title}`;
      }
      pickedUpLeadColumn.current = null;
    },
    onDragCancel({ active }) {
      pickedUpLeadColumn.current = null;
      if (!hasDraggableData(active)) return;
      return `Dragging ${active.data.current?.type} cancelled.`;
    },
  };
}
