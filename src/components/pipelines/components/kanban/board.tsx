
import { FC, useEffect, useMemo, useState } from "react";
import { 
  DndContext, 
  DragStartEvent, 
  DragOverEvent, 
  DragEndEvent, 
  useSensor, 
  useSensors,
  DragOverlay,
  UniqueIdentifier,
  TouchSensor,
  MouseSensor,
  KeyboardSensor,
  closestCorners
} from "@dnd-kit/core";
import { arrayMove, horizontalListSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { restrictToParentElement, restrictToHorizontalAxis, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { useKanbanDrag } from "./hooks/use-kanban-drag";
import { BoardDragOverlay } from "./drag-overlay";
import { useBoardColumns } from "./hooks/use-board-columns";
import { KanbanColumn } from "./column";
import { Pipeline, PipelineColumn } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";

interface BoardProps {
  pipelines: Pipeline[];
  selectedPipeline: Pipeline | null;
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onEditColumnTitle: (columnId: string, title: string) => void;
  onAddStage: () => void;
  onDeleteStage: (column: PipelineColumn) => void;
  onReorderColumns: (columns: PipelineColumn[]) => void;
  previewColumnId?: string | null;
  previewIndex?: number | null;
  previewLead?: Lead | null;
}

const Board: FC<BoardProps> = ({
  pipelines,
  selectedPipeline,
  leads,
  onLeadClick,
  onEditColumnTitle,
  onAddStage,
  onDeleteStage,
  onReorderColumns,
  previewColumnId = null,
  previewIndex = null,
  previewLead = null,
}) => {
  if (!selectedPipeline) return null;
  
  const {
    activeItem,
    pickedUpLeadColumn,
    getColumnLeads,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    getDraggingLeadData,
  } = useKanbanDrag(selectedPipeline, leads);

  const {
    editingColumnId,
    editingColumnTitle,
    collapsedColumns,
    handleEditColumnTitleChange,
    handleEditColumnTitle,
    handleFinishEditColumnTitle,
    handleToggleColumnCollapse,
    handleDeleteColumn,
    handleColorChange,
  } = useBoardColumns(onEditColumnTitle, onDeleteStage);

  // Prepare columns for sortable context
  const columnIds = useMemo(() => {
    return selectedPipeline.columns.map(column => column.id);
  }, [selectedPipeline]);

  // Define sensors for drag operations
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 10,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: e => {
        return [0, 0];  // Provide default coordinates
      },
    })
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToParentElement]}
    >
      <div className="h-full w-full">
        <SortableContext
          items={columnIds}
          strategy={horizontalListSortingStrategy}
        >
          <div className={`column-container ${activeItem ? 'column-container-dragging' : ''}`}>
            {selectedPipeline.columns.map((column) => {
              const columnLeads = getColumnLeads(column.id);
              const isCollapsed = collapsedColumns.includes(column.id);
              const isPreviewTarget = previewColumnId === column.id;
              
              return (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  columnLeads={columnLeads}
                  isEditing={editingColumnId === column.id}
                  isCollapsed={isCollapsed}
                  editingColumnTitle={editingColumnTitle}
                  onEditColumnTitle={handleFinishEditColumnTitle}
                  setEditingColumnTitle={handleEditColumnTitleChange}
                  handleColorChange={handleColorChange}
                  onDeleteStage={(col) => handleDeleteColumn(col)}
                  toggleColumnCollapse={() => handleToggleColumnCollapse(column.id)}
                  setEditingColumnId={handleEditColumnTitle}
                  onLeadClick={onLeadClick}
                  currentPipelineId={selectedPipeline.id}
                  isPreviewTarget={isPreviewTarget}
                  previewLead={isPreviewTarget ? previewLead : null}
                  allPipelines={pipelines}
                />
              );
            })}
          </div>
        </SortableContext>
      </div>

      <BoardDragOverlay
        active={activeItem}
        activeId={activeItem?.id as string}
        activeData={activeItem?.data?.current}
        column={activeItem?.data?.current?.type === "Column" ? activeItem.data.current.column : null}
        columnLeads={
          activeItem?.data?.current?.type === "Column" && activeItem?.data?.current?.column
            ? getColumnLeads(activeItem.data.current.column.id)
            : []
        }
      />
    </DndContext>
  );
};

export default Board;
