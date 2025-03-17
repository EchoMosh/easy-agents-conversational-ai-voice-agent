
import { useState, useRef, useEffect } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { createPortal } from "react-dom";
import { Lead } from "@/pages/dashboard/leads";
import { Pipeline, PipelineColumn } from "@/types/pipeline";
import { KanbanColumn } from "./column";
import { KanbanTask } from "./task";
import { DeleteStageDialog } from "../delete-stage-dialog";
import { AddStageButton } from "../add-stage-button";
import { useToast } from "@/hooks/use-toast";

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

type ActiveDragItem = {
  id: string;
  type: "Column" | "Task";
  data: any;
};

export function KanbanBoard({
  pipeline,
  leads,
  onDragEnd,
  onEditColumnTitle,
  onLeadClick,
  onAddStage,
  onDeleteStage,
  onReorderColumns,
  isAddingStage = false,
}: KanbanBoardProps) {
  const [activeItem, setActiveItem] = useState<ActiveDragItem | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnTitle, setEditingColumnTitle] = useState("");
  const [stageToDelete, setStageToDelete] = useState<PipelineColumn | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [collapsedColumns, setCollapsedColumns] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // 3px
      },
    })
  );

  // Get all leads for this pipeline
  const pipelineLeads = leads.filter(
    lead => lead.pipeline_id === pipeline.id
  );
  
  // Get leads for each column
  const getColumnLeads = (column: PipelineColumn) => {
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
  
  // Handle deleting a stage
  const handleDeleteStage = (column: PipelineColumn) => {
    // Check if there are leads in this stage
    const leadsInColumn = getColumnLeads(column);
    
    if (leadsInColumn.length > 0) {
      toast({
        title: "Cannot delete stage",
        description: `Stage "${column.title}" has ${leadsInColumn.length} leads. Please move them first.`,
        variant: "destructive",
      });
      return;
    }
    
    // If this is the last stage, don't allow deletion
    if (pipeline.columns.length <= 1) {
      toast({
        title: "Cannot delete stage",
        description: "You must have at least one stage in your pipeline.",
        variant: "destructive",
      });
      return;
    }
    
    setStageToDelete(column);
  };
  
  // Handle column collapse
  const toggleColumnCollapse = (columnId: string) => {
    setCollapsedColumns(prev => ({
      ...prev,
      [columnId]: !prev[columnId],
    }));
  };
  
  // Check if a column is collapsed
  const isColumnCollapsed = (columnId: string) => {
    return !!collapsedColumns[columnId];
  };
  
  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { id, data } = event.active;
    
    if (data?.current?.type) {
      setActiveItem({
        id: id.toString(),
        type: data.current.type,
        data: data.current,
      });
    }
  };
  
  // Handle drag over
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    if (activeId === overId) return;
    
    const activeType = active.data?.current?.type;
    const overType = over.data?.current?.type;
    
    if (activeType === "Task" && overType === "Column") {
      // Task is being dragged over a column
      // We'll let the original onDragEnd handler deal with this
    } else if (activeType === "Column" && overType === "Column") {
      // Column is being dragged over another column
      const activeColumnIndex = pipeline.columns.findIndex(
        (col) => col.id === activeId
      );
      
      const overColumnIndex = pipeline.columns.findIndex(
        (col) => col.id === overId
      );
      
      if (activeColumnIndex !== -1 && overColumnIndex !== -1) {
        // Reorder columns
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
    setActiveItem(null);
    
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    if (activeId === overId) return;
    
    const activeType = active.data?.current?.type;
    
    if (activeType === "Task") {
      // Pass the event to the original handler
      onDragEnd(event);
    } else if (activeType === "Column") {
      // We already handled column reordering in dragOver
      // This is just to clean up
    }
  };
  
  // Handle delete stage confirmation
  const handleConfirmDeleteStage = async () => {
    if (!stageToDelete) return;
    
    setIsDeleting(true);
    try {
      await onDeleteStage(stageToDelete);
      setStageToDelete(null);
    } catch (error) {
      console.error("Error deleting stage:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="h-full">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 h-full overflow-x-auto pb-4 pt-2 px-2">
          <SortableContext
            items={pipeline.columns.map((col) => col.id)}
            strategy={horizontalListSortingStrategy}
          >
            {pipeline.columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                columnLeads={getColumnLeads(column)}
                isEditing={editingColumnId === column.id}
                isCollapsed={isColumnCollapsed(column.id)}
                editingColumnTitle={editingColumnTitle}
                onEditColumnTitle={handleKeyDown}
                setEditingColumnTitle={setEditingColumnTitle}
                handleColorChange={handleColorChange}
                onDeleteStage={handleDeleteStage}
                toggleColumnCollapse={() => toggleColumnCollapse(column.id)}
                setEditingColumnId={setEditingColumnId}
                onLeadClick={onLeadClick}
                currentPipelineId={pipeline.id}
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
        </div>
        
        {createPortal(
          <DragOverlay>
            {activeItem?.type === "Column" && activeItem.data.column && (
              <KanbanColumn
                column={activeItem.data.column}
                columnLeads={getColumnLeads(activeItem.data.column)}
                isEditing={false}
                isCollapsed={isColumnCollapsed(activeItem.data.column.id)}
                editingColumnTitle=""
                onEditColumnTitle={() => {}}
                setEditingColumnTitle={() => {}}
                handleColorChange={() => {}}
                onDeleteStage={() => {}}
                toggleColumnCollapse={() => {}}
                setEditingColumnId={() => {}}
                onLeadClick={() => {}}
              />
            )}
            {activeItem?.type === "Task" && activeItem.data.lead && (
              <KanbanTask
                lead={activeItem.data.lead}
                columnId={activeItem.data.columnId}
                onClick={() => {}}
              />
            )}
          </DragOverlay>,
          document.body
        )}
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
