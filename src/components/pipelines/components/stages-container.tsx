import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors, DragStartEvent } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { Pipeline, PipelineColumn } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";
import { SortableStage } from "./sortable-stage";
import { PipelineStage } from "./pipeline-stage";
import { AddStageButton } from "./add-stage-button";
import { useStageReordering } from "@/hooks/pipeline/use-stage-reordering";
import { useStages } from "@/hooks/pipeline/use-stages";
import { useState, useEffect } from "react";

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
    handleAddNewStage,
    isAddingStage
  } = useStages(onReorderColumns);

  const { handleStageReorder, isReordering } = useStageReordering(onReorderColumns);
  const [isDraggingStage, setIsDraggingStage] = useState(false);

  const pipelineLeads = leads.filter(lead => lead.pipeline_id === selectedPipeline.id);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
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
    if (selectedPipeline.columns.some(col => col.id === event.active.id)) {
      setIsDraggingStage(true);
    }
  };

  const handleDragEndWrapper = (event: DragEndEvent) => {
    setIsDraggingStage(false);
    
    if (selectedPipeline.columns.some(col => col.id === event.active.id)) {
      handleStageReorder(event, selectedPipeline.id, selectedPipeline.columns);
    } else {
      onDragEnd(event);
    }
  };

  const uniqueColumns = Array.from(
    new Map(selectedPipeline.columns.map(col => [col.id, col])).values()
  );
  
  useEffect(() => {
    if (uniqueColumns.length !== selectedPipeline.columns.length) {
      console.warn(`Found duplicate columns in pipeline ${selectedPipeline.name}. Original: ${selectedPipeline.columns.length}, Unique: ${uniqueColumns.length}`);
    }
    
    console.log(`Pipeline ${selectedPipeline.name} has ${uniqueColumns.length} unique columns`);
    console.log(`Pipeline leads: ${pipelineLeads.length} (out of ${leads.length} total leads)`);
  }, [selectedPipeline, uniqueColumns, pipelineLeads, leads]);
  
  return (
    <DndContext 
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEndWrapper}
    >
      <div className="flex flex-wrap gap-6">
        <SortableContext items={uniqueColumns.map(col => col.id)} strategy={horizontalListSortingStrategy}>
          {uniqueColumns.map((column) => {
            const columnLeads = pipelineLeads.filter(lead => {
              return lead.status && 
                    column.title && 
                    lead.status.toLowerCase() === column.title.toLowerCase();
            });
            
            console.log(`Column "${column.title}" has ${columnLeads.length} leads in pipeline ${selectedPipeline.id}`);
            
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
                    handleColorChange(selectedPipeline.id, columnId, color, uniqueColumns)
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
          onAddStage={() => handleAddNewStage(selectedPipeline.id, uniqueColumns, onAddStage)} 
          isLoading={isAddingStage}
        />
      </div>
    </DndContext>
  );
}
