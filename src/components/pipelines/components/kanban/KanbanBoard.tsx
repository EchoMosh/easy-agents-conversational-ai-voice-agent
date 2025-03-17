
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
  Active,
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

  // Get all leads for this pipeline
  const pipelineLeads = useMemo(() => {
    return leads.filter(lead => lead.pipeline_id === pipeline.id);
  }, [leads, pipeline.id]);

  const columnsId = useMemo(() => 
    pipeline.columns.map((col) => col.id), 
  [pipeline.columns]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        distance: 5,
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
      if (!hasDraggableData(active)) return;
      
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
      
      if (active.data.current?.type === "Column" && over.data.current?.type === "Column") {
        const overColumnIdx = columnsId.findIndex((id) => id === over.id);
        return `Column ${active.data.current.column.title} was moved over ${over.data.current.column.title} at position ${overColumnIdx + 1} of ${columnsId.length}`;
      } 
      else if (active.data.current?.type === "Task" && over.data.current?.type === "Task") {
        const task = over.data.current.task;
        const { leadsInColumn, leadPosition, column } = getDraggingLeadData(
          over.id,
          task.columnId
        );
        
        if (task.columnId !== pickedUpLeadColumn.current) {
          return `Lead was moved over column ${column?.title} in position ${leadPosition + 1} of ${leadsInColumn.length}`;
        }
        
        return `Lead was moved over position ${leadPosition + 1} of ${leadsInColumn.length} in column ${column?.title}`;
      }
      
      return "";
    },
    onDragEnd({ active, over }) {
      pickedUpLeadColumn.current = null;
      
      if (!hasDraggableData(active) || !over || !hasDraggableData(over)) {
        return "";
      }
      
      if (active.data.current?.type === "Column" && over.data.current?.type === "Column") {
        const overColumnPosition = columnsId.findIndex((id) => id === over.id);
        return `Column ${active.data.current.column.title} was dropped into position ${overColumnPosition + 1} of ${columnsId.length}`;
      } 
      else if (active.data.current?.type === "Task" && over.data.current?.type === "Task") {
        const task = over.data.current.task;
        const { leadsInColumn, leadPosition, column } = getDraggingLeadData(
          over.id,
          task.columnId
        );
        
        if (task.columnId !== pickedUpLeadColumn.current) {
          return `Lead was dropped into column ${column?.title} in position ${leadPosition + 1} of ${leadsInColumn.length}`;
        }
        
        return `Lead was dropped into position ${leadPosition + 1} of ${leadsInColumn.length} in column ${column?.title}`;
      }
      
      return "";
    },
    onDragCancel({ active }) {
      pickedUpLeadColumn.current = null;
      
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
      }
    }
  };

  // Handle drag over
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over || !hasDraggableData(active) || !hasDraggableData(over)) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    if (activeId === overId) return;
    
    const activeData = active.data.current;
    const overData = over.data.current;
    
    // If columns are being reordered
    if (activeData?.type === "Column" && overData?.type === "Column") {
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
    
    // Use the external handler for most cases
    onExternalDragEnd(event);
  };

  return (
    <DndContext
      accessibility={{
        announcements,
      }}
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
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
                isOverlay
              />
            )}
          </DragOverlay>,
          document.body
        )}
    </DndContext>
  );
}
