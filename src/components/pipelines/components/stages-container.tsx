import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors, DragStartEvent } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { Pipeline, PipelineColumn } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";
import { SortableStage } from "./sortable-stage";
import { PipelineStage } from "./pipeline-stage";
import { AddStageButton } from "./add-stage-button";
import { useStageReordering } from "@/hooks/pipeline/use-stage-reordering";
import { useStages } from "@/hooks/pipeline/use-stages";
import { useState } from "react";

interface StagesContainerProps {
  selectedPipeline: Pipeline;
  leads: Lead[];
  onDragEnd: (event: DragEndEvent) => void;
  onEditColumnTitle: (columnId: string, newTitle: string) => void;
  onLeadClick: (lead: Lead) => void;
  onAddStage: (stage: PipelineColumn) => void;
  onReorderColumns: (newOrder: PipelineColumn[]) => void;
  allPipelines?: Pipeline[];
  onDeleteStage: (column: PipelineColumn) => void;
}

export function StagesContainer({
  selectedPipeline,
  leads,
  onDragEnd,
  onEditColumnTitle,
  onLeadClick,
  onAddStage,
  onReorderColumns,
  allPipelines = [],
  onDeleteStage,
}: StagesContainerProps) {
  const {
    editingColumnId,
    setEditingColumnId,
    editingColumnTitle,
    setEditingColumnTitle,
    isColumnCollapsed,
    toggleColumnCollapse,
    handleKeyDown,
    handleColorChange,
    handleAddNewStage
  } = useStages(onReorderColumns);

  const { handleStageReorder, isReordering } = useStageReordering(onReorderColumns);
  const [isDraggingStage, setIsDraggingStage] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5, // Adjust as needed for your use case
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    // Check if the dragged item is a stage
    if (selectedPipeline.columns.some(col => col.id === event.active.id)) {
      setIsDraggingStage(true);
    }
  };

  const handleDragEndWrapper = (event: DragEndEvent) => {
    // Reset the dragging stage state
    setIsDraggingStage(false);
    
    // Determine if this is a stage reordering or a lead movement
    if (selectedPipeline.columns.some(col => col.id === event.active.id)) {
      handleStageReorder(event, selectedPipeline.id, selectedPipeline.columns);
    } else {
      onDragEnd(event);
    }
  };

  return (
    <DndContext 
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEndWrapper}
    >
      <div className="flex flex-wrap gap-6">
        <SortableContext items={selectedPipeline.columns.map(col => col.id)} strategy={horizontalListSortingStrategy}>
          {selectedPipeline.columns.map((column) => {
            const columnLeads = leads.filter((lead) => 
              lead.status.toLowerCase() === column.title.toLowerCase()
            );
            
            return (
              <SortableStage 
                key={column.id} 
                column={column}
                disabled={isReordering}
              >
                <PipelineStage
                  column={column}
                  columnLeads={columnLeads}
                  isCollapsed={isColumnCollapsed(selectedPipeline.id, column.id)}
                  editingColumnId={editingColumnId}
                  editingColumnTitle={editingColumnTitle}
                  onEditColumnTitle={(e) => handleKeyDown(e, onEditColumnTitle)}
                  setEditingColumnTitle={setEditingColumnTitle}
                  handleColorChange={(columnId, color) => 
                    handleColorChange(selectedPipeline.id, columnId, color, selectedPipeline.columns)
                  }
                  onDeleteStage={onDeleteStage}
                  toggleColumnCollapse={(columnId) => toggleColumnCollapse(selectedPipeline.id, columnId)}
                  setEditingColumnId={setEditingColumnId}
                  onLeadClick={onLeadClick}
                  allPipelines={allPipelines}
                  currentPipelineId={selectedPipeline.id}
                />
              </SortableStage>
            );
          })}
        </SortableContext>
        
        <AddStageButton 
          onAddStage={() => handleAddNewStage(selectedPipeline.id, selectedPipeline.columns, onAddStage)} 
        />
      </div>
    </DndContext>
  );
}
