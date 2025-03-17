
import { useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Lead } from "@/pages/dashboard/leads";
import { Pipeline, PipelineColumn } from "@/types/pipeline";
import { KanbanColumn } from "./column";
import { DeleteStageDialog } from "../delete-stage-dialog";
import { AddStageButton } from "../add-stage-button";
import { useKanbanDrag } from "./hooks/use-kanban-drag";
import { useColumnEditor } from "./hooks/use-column-editor";
import { DragOverlayContainer } from "./drag-overlay";
import { useBoardAccessibility } from "./board-accessibility";

export interface KanbanBoardProps {
  pipeline: Pipeline;
  leads: Lead[];
  onDragEnd: (event: DragEndEvent) => void;
  onDragOver?: (event: DragOverEvent) => void;
  previewColumnId?: string | null;
  onEditColumnTitle: (columnId: string, newTitle: string) => void;
  onLeadClick: (lead: Lead) => void;
  onAddStage: (stage: PipelineColumn) => void;
  onDeleteStage: (column: PipelineColumn) => Promise<void>;
  onReorderColumns: (columns: PipelineColumn[]) => void;
  isAddingStage?: boolean;
}

export function KanbanBoard({
  pipeline,
  leads,
  onDragEnd: onExternalDragEnd,
  onDragOver: onExternalDragOver,
  previewColumnId,
  onEditColumnTitle,
  onLeadClick,
  onAddStage,
  onDeleteStage,
  onReorderColumns,
  isAddingStage = false,
}: KanbanBoardProps) {
  // Setup drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // 3px - lower value means easier to start dragging
      },
    })
  );

  // Get all column IDs for SortableContext
  const columnsId = useMemo(() => 
    pipeline.columns.map((col) => col.id), 
  [pipeline.columns]);

  // Get map of column titles for accessibility
  const columnTitles = useMemo(() => {
    const titles: Record<string, string> = {};
    pipeline.columns.forEach(col => {
      titles[col.id] = col.title || "Unnamed Column";
    });
    return titles;
  }, [pipeline.columns]);

  // Setup drag and drop hooks
  const {
    activeItem,
    previewLead,
    pickedUpLeadColumn,
    getColumnLeads,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    getDraggingLeadData
  } = useKanbanDrag({
    pipeline,
    leads,
    onDragEnd: onExternalDragEnd,
    onDragOver: onExternalDragOver,
    onReorderColumns
  });

  // Setup column editing hooks
  const {
    editingColumnId,
    setEditingColumnId,
    editingColumnTitle,
    setEditingColumnTitle,
    stageToDelete,
    setStageToDelete,
    isDeleting,
    handleKeyDown,
    handleDeleteStage,
    toggleColumnCollapse,
    isColumnCollapsed,
    handleConfirmDeleteStage,
    handleAddNewStage
  } = useColumnEditor({
    onEditColumnTitle,
    onAddStage,
    onDeleteStage,
    getColumnLeads
  });

  // Setup accessibility announcements
  const announcements = useBoardAccessibility({
    columnsId,
    columnTitles,
    getDraggingLeadData,
    pickedUpLeadColumn
  });

  // Find active column and lead based on the active item
  const activeColumn = activeItem?.type === "Column" 
    ? pipeline.columns.find(col => col.id === activeItem.id)
    : null;

  const activeLead = activeItem?.type === "Task"
    ? leads.find(lead => lead.id === activeItem.id)
    : null;

  return (
    <div className="h-full">
      <DndContext
        accessibility={{ announcements }}
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 h-full overflow-x-auto pb-4 pt-2 px-2">
          <SortableContext
            items={columnsId}
            strategy={horizontalListSortingStrategy}
          >
            {pipeline.columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                columnLeads={getColumnLeads(column.id)}
                isEditing={editingColumnId === column.id}
                isCollapsed={isColumnCollapsed(column.id)}
                editingColumnTitle={editingColumnTitle}
                onEditColumnTitle={handleKeyDown}
                setEditingColumnTitle={setEditingColumnTitle}
                handleColorChange={(colId, color) => {
                  // Update color in pipeline columns
                  const newColumns = pipeline.columns.map(col => 
                    col.id === colId ? { ...col, color } : col
                  );
                  onReorderColumns(newColumns);
                }}
                onDeleteStage={handleDeleteStage}
                toggleColumnCollapse={() => toggleColumnCollapse(column.id)}
                setEditingColumnId={setEditingColumnId}
                onLeadClick={onLeadClick}
                currentPipelineId={pipeline.id}
                isPreviewTarget={previewColumnId === column.id}
                previewLead={column.id === previewColumnId ? previewLead : null}
              />
            ))}
          </SortableContext>
          
          <AddStageButton
            onAddStage={handleAddNewStage}
            isLoading={isAddingStage}
          />
        </div>
        
        <DragOverlayContainer 
          activeItem={activeItem}
          activeLead={activeLead}
          activeColumn={activeColumn}
          getColumnLeads={getColumnLeads}
        />
      </DndContext>
      
      <DeleteStageDialog
        stageToDelete={stageToDelete}
        onClose={() => setStageToDelete(null)}
        onConfirm={handleConfirmDeleteStage}
        isDeleting={isDeleting}
      />
    </div>
  );
}
