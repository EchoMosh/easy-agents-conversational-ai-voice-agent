
import { useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  UniqueIdentifier,
  Announcements,
  pointerWithin,
  rectIntersection,
  closestCenter,
  DragMoveEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { Lead } from "@/pages/dashboard/leads";
import { Pipeline, PipelineColumn } from "@/types/pipeline";
import { BoardColumn, BoardContainer } from "./BoardColumn";
import { TaskCard } from "./TaskCard";
import { hasDraggableData, coordinateGetter } from "./utils";
import { AddStageButton } from "../add-stage-button";

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
  onReorderColumns,
  isAddingStage = false,
}: KanbanBoardProps) {
  const [activeColumn, setActiveColumn] = useState<PipelineColumn | null>(null);
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnTitle, setEditingColumnTitle] = useState("");
  const pickedUpLeadColumn = useRef<string | null>(null);
  const [currentOver, setCurrentOver] = useState<UniqueIdentifier | null>(null);

  // Get all leads for this pipeline
  const pipelineLeads = useMemo(() => {
    return leads.filter(lead => lead.pipeline_id === pipeline.id);
  }, [leads, pipeline.id]);

  const columnsId = useMemo(() => 
    pipeline.columns.map((col) => col.id), 
  [pipeline.columns]);

  // Use more sensitive sensors for easier drag/drop
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 3, // Reduced for more sensitive dragging
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100, // Small delay to prevent accidental touches
        tolerance: 5, // Allow some movement during press before canceling
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter,
    })
  );

  // Get leads for each column
  const getColumnLeads = (columnId: string) => {
    const column = pipeline.columns.find(col => col.id === columnId);
    if (!column?.title) return [];
    
    return pipelineLeads.filter(
      lead => lead.status && 
             column.title && 
             lead.status.toLowerCase() === column.title.toLowerCase()
    );
  };

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

  // Accessibility announcements
  const announcements: Announcements = {
    onDragStart({ active }) {
      if (!hasDraggableData(active)) return "";
      
      if (active.data.current?.type === "Column") {
        const startColumnIdx = columnsId.findIndex((id) => id === active.id);
        const startColumn = pipeline.columns[startColumnIdx];
        return `Picked up Column ${startColumn?.title} at position: ${startColumnIdx + 1} of ${columnsId.length}`;
      } 
      else if (active.data.current?.type === "Task") {
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
      if (!hasDraggableData(active) || !hasDraggableData(over)) return "";
      
      setCurrentOver(over.id);
      
      if (active.data.current?.type === "Column" && over.data.current?.type === "Column") {
        const overColumnIdx = columnsId.findIndex((id) => id === over.id);
        return `Column ${active.data.current.column.title} was moved over ${over.data.current.column.title} at position ${overColumnIdx + 1} of ${columnsId.length}`;
      } 
      else if (active.data.current?.type === "Task") {
        const columnId = over.data.current?.type === "Column" 
          ? String(over.id)
          : over.data.current?.columnId || over.data.current?.task?.columnId;
          
        if (!columnId) return "";
        
        const column = pipeline.columns.find(col => col.id === columnId);
        if (!column) return "";
        
        return `Lead was moved over column ${column.title}`;
      }
      
      return "";
    },
    onDragEnd({ active, over }) {
      pickedUpLeadColumn.current = null;
      setCurrentOver(null);
      
      if (!hasDraggableData(active) || !over || !hasDraggableData(over)) {
        return "Drag cancelled.";
      }
      
      if (active.data.current?.type === "Column" && over.data.current?.type === "Column") {
        const overColumnPosition = columnsId.findIndex((id) => id === over.id);
        return `Column ${active.data.current.column.title} was dropped into position ${overColumnPosition + 1} of ${columnsId.length}`;
      } 
      else if (active.data.current?.type === "Task") {
        const columnId = over.data.current?.type === "Column" 
          ? String(over.id)
          : over.data.current?.columnId || over.data.current?.task?.columnId;
          
        if (!columnId) return "Lead was dropped.";
        
        const column = pipeline.columns.find(col => col.id === columnId);
        if (!column) return "Lead was dropped.";
        
        return `Lead was dropped into column ${column.title}`;
      }
      
      return "Drop completed.";
    },
    onDragCancel({ active }) {
      pickedUpLeadColumn.current = null;
      setCurrentOver(null);
      
      if (!hasDraggableData(active)) return "";
      
      return `Dragging ${active.data.current?.type} cancelled.`;
    },
  };

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    if (!hasDraggableData(event.active)) return;
    
    const { active } = event;
    const data = active.data.current;
    
    if (data?.type === "Column") {
      setActiveColumn(data.column);
    } 
    else if (data?.type === "Task") {
      const taskId = String(active.id);
      const lead = leads.find(l => l.id === taskId);
      if (lead) {
        setActiveLead(lead);
        // Store the column ID for this lead
        pickedUpLeadColumn.current = data.columnId || data.task?.columnId;
        console.log("Started dragging lead from column:", pickedUpLeadColumn.current);
      }
    }
  };

  // Handle drag move for additional feedback
  const handleDragMove = (event: DragMoveEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    // Update current over element for visual feedback
    setCurrentOver(over.id);
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
    setActiveColumn(null);
    setActiveLead(null);
    setCurrentOver(null);
    
    console.log("Drag ended:", {
      activeId: event.active.id,
      activeData: event.active.data.current,
      overId: event.over?.id,
      overData: event.over?.data.current
    });
    
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
      onDragStart={handleDragStart}
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

      {typeof document !== 'undefined' &&
        createPortal(
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
                columnId={pickedUpLeadColumn.current || ""}
                isOverlay
              />
            )}
          </DragOverlay>,
          document.body
        )}
    </DndContext>
  );
}
