
import { useMemo } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  pointerWithin,
  rectIntersection,
  closestCenter,
} from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { Lead } from "@/pages/dashboard/leads";
import { Pipeline, PipelineColumn } from "@/types/pipeline";
import { BoardColumn, BoardContainer } from "./BoardColumn";
import { ColumnPreview } from "./column-preview";
import { AddStageButton } from "../add-stage-button";
import { useBoardSensors } from "./hooks/use-board-sensors";
import { useBoardAnnouncements } from "./hooks/use-board-announcements";
import { useBoardColumns } from "./hooks/use-board-columns";
import { useDragState } from "./hooks/use-drag-state";
import { BoardDragOverlay } from "./board-drag-overlay";
import { hasDraggableData } from "./utils";

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
  previewIndex,
  onEditColumnTitle,
  onLeadClick,
  onAddStage,
  onReorderColumns,
  isAddingStage = false,
}: KanbanBoardProps) {
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnTitle, setEditingColumnTitle] = useState("");

  // Get all leads for this pipeline
  const pipelineLeads = useMemo(() => {
    return leads.filter(lead => lead.pipeline_id === pipeline.id);
  }, [leads, pipeline.id]);

  // Use custom hooks
  const sensors = useBoardSensors();
  const { columnsId, getColumnLeads } = useBoardColumns(pipeline, pipelineLeads);
  const {
    activeColumn,
    activeLead,
    currentOver,
    pickedUpLeadColumn,
    handleDragStart,
    handleDragMove,
    resetDragState,
    setCurrentOver
  } = useDragState();

  // Create accessibility announcements
  const announcements = useBoardAnnouncements({
    columnsId,
    pipeline,
    pickedUpLeadColumn,
    getColumnLeads
  });

  // Handle editing column title
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // If Enter or Escape is pressed, save or cancel the edit
    if (e.key === "Enter" || e.key === "Escape") {
      e.preventDefault();
      if (e.key === "Enter" && editingColumnTitle.trim() !== "" && editingColumnId) {
        onEditColumnTitle(editingColumnId, editingColumnTitle);
      }
      setEditingColumnId(null);
    }
  };

  // Handle color change
  const handleColorChange = (columnId: string, color: string) => {
    // Find the column and update its color
    const updatedColumns = pipeline.columns.map(col => 
      col.id === columnId ? { ...col, color } : col
    );
    
    // Update the pipeline with the new columns
    onReorderColumns(updatedColumns);
  };

  // Handle drag over
  const handleDragOver = (event: DragOverEvent) => {
    // Call the external drag over handler if provided
    if (onExternalDragOver) {
      onExternalDragOver(event);
    }
    
    const { active, over } = event;
    
    if (!over || !hasDraggableData(active)) return;
    
    setCurrentOver(over.id);
    
    const activeId = active.id;
    const overId = over.id;
    
    if (activeId === overId) return;
    
    const activeData = active.data.current;
    
    // Only handle column reordering here
    if (activeData?.type === "Column" && hasDraggableData(over) && over.data.current?.type === "Column") {
      const activeColumnIndex = pipeline.columns.findIndex(col => col.id === activeId);
      const overColumnIndex = pipeline.columns.findIndex(col => col.id === overId);
      
      if (activeColumnIndex !== -1 && overColumnIndex !== -1) {
        const newColumns = arrayMove(
          pipeline.columns,
          activeColumnIndex,
          overColumnIndex
        );
        
        onReorderColumns(newColumns);
      }
    }
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    resetDragState();
    
    // Use the external handler for task drops
    onExternalDragEnd(event);
  };

  // Find preview lead if there's a preview column
  const previewLead = activeLead && previewColumnId ? {
    ...activeLead,
    status: pipeline.columns.find(col => col.id === previewColumnId)?.title || activeLead.status,
    pipeline_id: pipeline.id
  } : null;

  return (
    <DndContext
      accessibility={{
        announcements,
      }}
      sensors={sensors}
      onDragStart={(event) => handleDragStart(event, leads)}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      collisionDetection={(args) => {
        // First try pointer within for better targeting of columns
        const pointerCollisions = pointerWithin(args);
        if (pointerCollisions.length) return pointerCollisions;
        
        // Then try rectangle intersection
        const rectCollisions = rectIntersection(args);
        if (rectCollisions.length) return rectCollisions;
        
        // Finally fall back to closest center
        return closestCenter(args);
      }}
    >
      <BoardContainer>
        <SortableContext items={columnsId}>
          {pipeline.columns.map((column) => (
            <BoardColumn
              key={column.id}
              column={column}
              columnLeads={getColumnLeads(column.id)}
              isEditing={editingColumnId === column.id}
              editingColumnTitle={editingColumnTitle}
              onEditColumnTitle={handleKeyDown}
              setEditingColumnTitle={setEditingColumnTitle}
              handleColorChange={handleColorChange}
              setEditingColumnId={setEditingColumnId}
              onLeadClick={onLeadClick}
              isPreviewTarget={previewColumnId === column.id || currentOver === column.id}
              previewLead={column.id === previewColumnId ? previewLead : null}
              previewIndex={column.id === previewColumnId ? previewIndex : null}
            />
          ))}
        </SortableContext>
        
        <AddStageButton
          onAddStage={() => {
            const newStage: PipelineColumn = {
              id: crypto.randomUUID(),
              title: "New Stage",
              color: "bg-gray-500",
            };
            onAddStage(newStage);
          }}
          isLoading={isAddingStage}
        />
      </BoardContainer>

      <BoardDragOverlay
        activeColumn={activeColumn}
        activeLead={activeLead}
        pickedUpLeadColumn={pickedUpLeadColumn.current}
        getColumnLeads={getColumnLeads}
      />
    </DndContext>
  );
}

import { useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
