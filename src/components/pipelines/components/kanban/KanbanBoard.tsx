
import { useRef, useMemo } from "react";
import { BoardColumn, BoardContainer } from "./BoardColumn";
import { BoardDragOverlay } from "./board-drag-overlay";
import {
  DndContext,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { hasDraggableData } from "./utils";
import { useBoardSensors } from "./hooks/use-board-sensors";
import { useBoardColumns } from "./hooks/use-board-columns";
import { useBoardAnnouncements } from "./hooks/use-board-announcements";
import { useDragState } from "./hooks/use-drag-state";
import { Lead } from "@/pages/dashboard/leads";
import { PipelineColumn } from "@/types/pipeline";
import { Pipeline } from "@/types/pipeline";

export type ColumnId = string;

export interface KanbanBoardProps {
  pipeline: Pipeline;
  leads: Lead[];
  onDragEnd: (event: DragEndEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  previewColumnId?: string | null;
  previewIndex?: number | null;
  onEditColumnTitle: (columnId: string, newTitle: string) => void;
  onLeadClick: (lead: Lead) => void;
  onAddStage: (stage: PipelineColumn) => void;
  onDeleteStage?: (column: PipelineColumn) => Promise<void>;
  onReorderColumns: (columns: PipelineColumn[]) => void;
  isAddingStage?: boolean;
}

export function KanbanBoard({
  pipeline,
  leads,
  onDragEnd: onExternalDragEnd,
  onDragOver: onExternalDragOver,
  previewColumnId,
  previewIndex,
  onEditColumnTitle,
  onLeadClick,
  onAddStage,
  onDeleteStage,
  onReorderColumns,
  isAddingStage = false,
}: KanbanBoardProps) {
  const pickedUpLeadColumn = useRef<ColumnId | null>(null);

  // Filter leads for this pipeline
  const pipelineLeads = leads.filter(
    (lead) => lead.pipeline_id === pipeline.id
  );

  // Use custom hooks
  const sensors = useBoardSensors();
  const { columnsId, getColumnLeads } = useBoardColumns(
    pipeline,
    pipelineLeads
  );
  const {
    activeColumn,
    activeLead,
    currentOver,
    pickedUpLeadColumn: dragStatePickedUpLeadColumn,
    handleDragStart,
    handleDragMove,
    resetDragState,
    setCurrentOver,
  } = useDragState();

  // Create accessibility announcements
  const announcements = useBoardAnnouncements({
    columnsId,
    pipeline,
    pickedUpLeadColumn,
    getColumnLeads,
  });

  return (
    <DndContext
      accessibility={{
        announcements,
      }}
      sensors={sensors}
      onDragStart={(event) => handleDragStart(event, leads)}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      className="h-full"
    >
      <BoardContainer>
        <SortableContext
          items={columnsId}
          strategy={horizontalListSortingStrategy}
        >
          {pipeline.columns.map((col) => (
            <BoardColumn
              key={col.id}
              column={col}
              tasks={getColumnLeads(col.id)}
              onLeadClick={onLeadClick}
              isPreviewTarget={
                previewColumnId === col.id || currentOver === col.id
              }
              previewLead={col.id === previewColumnId ? activeLead : null}
              previewIndex={col.id === previewColumnId ? previewIndex : null}
            />
          ))}
        </SortableContext>
      </BoardContainer>

      <BoardDragOverlay
        activeColumn={activeColumn}
        activeLead={activeLead}
        pickedUpLeadColumn={pickedUpLeadColumn.current}
        getColumnLeads={getColumnLeads}
      />
    </DndContext>
  );

  function handleDragOver(event: DragOverEvent) {
    // Call the external drag over handler if provided
    if (onExternalDragOver) {
      onExternalDragOver(event);
    }

    handleDragMove(event);

    const { active, over } = event;

    if (!over || !hasDraggableData(active)) return;

    setCurrentOver(over.id);

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activeData = active.data.current;

    // Handle column reordering
    if (
      activeData?.type === "Column" &&
      hasDraggableData(over) &&
      over.data.current?.type === "Column"
    ) {
      const activeColumnIndex = pipeline.columns.findIndex(
        (col) => col.id === activeId
      );
      const overColumnIndex = pipeline.columns.findIndex(
        (col) => col.id === overId
      );

      if (activeColumnIndex !== -1 && overColumnIndex !== -1) {
        const newColumns = arrayMove(
          pipeline.columns,
          activeColumnIndex,
          overColumnIndex
        );

        onReorderColumns(newColumns);
      }
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    resetDragState();

    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (!hasDraggableData(active)) return;

    const activeData = active.data.current;

    if (activeId === overId) return;

    const isActiveAColumn = activeData?.type === "Column";
    if (
      isActiveAColumn &&
      hasDraggableData(over) &&
      over.data.current?.type === "Column"
    ) {
      const activeColumnIndex = pipeline.columns.findIndex(
        (col) => col.id === activeId
      );
      const overColumnIndex = pipeline.columns.findIndex(
        (col) => col.id === overId
      );

      if (activeColumnIndex !== -1 && overColumnIndex !== -1) {
        const newColumns = arrayMove(
          pipeline.columns,
          activeColumnIndex,
          overColumnIndex
        );

        onReorderColumns(newColumns);
      }
    }

    // Use the external handler for task drops
    onExternalDragEnd(event);
  }
}
