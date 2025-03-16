
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { useState } from "react";
import { Pipeline, PipelineColumn } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SortableStage } from "./components/sortable-stage";
import { DeleteStageDialog } from "./components/delete-stage-dialog";
import { PipelineName } from "./components/pipeline-name";
import { PipelineStage } from "./components/pipeline-stage";
import { AddStageButton } from "./components/add-stage-button";

interface PipelineStagesProps {
  selectedPipeline: Pipeline;
  leads: Lead[];
  onDragEnd: (event: DragEndEvent) => void;
  onEditColumnTitle: (columnId: string, newTitle: string) => void;
  onLeadClick: (lead: Lead) => void;
  onAddStage: (stage: PipelineColumn) => void;
  onDeletePipeline: () => void;
  onEditPipelineName: (name: string) => void;
  onReorderColumns: (newOrder: PipelineColumn[]) => void;
  allPipelines?: Pipeline[];
}

export function PipelineStages({
  selectedPipeline,
  leads,
  onDragEnd,
  onEditColumnTitle,
  onLeadClick,
  onAddStage,
  onDeletePipeline,
  onEditPipelineName,
  onReorderColumns,
  allPipelines = [],
}: PipelineStagesProps) {
  const { toast } = useToast();
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnTitle, setEditingColumnTitle] = useState("");
  const [collapsedColumns, setCollapsedColumns] = useState<Map<string, Set<string>>>(new Map());
  const [stageToDelete, setStageToDelete] = useState<PipelineColumn | null>(null);

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

  const isColumnCollapsed = (columnId: string) => {
    const pipelineCollapsed = collapsedColumns.get(selectedPipeline.id);
    return pipelineCollapsed?.has(columnId) ?? false;
  };

  const toggleColumnCollapse = (columnId: string) => {
    setCollapsedColumns(prev => {
      const newMap = new Map(prev);
      const pipelineCollapsed = new Set<string>(newMap.get(selectedPipeline.id) || new Set());
      
      if (pipelineCollapsed.has(columnId)) {
        pipelineCollapsed.delete(columnId);
      } else {
        pipelineCollapsed.add(columnId);
      }
      
      newMap.set(selectedPipeline.id, pipelineCollapsed);
      return newMap;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && editingColumnId && editingColumnTitle.trim()) {
      onEditColumnTitle(editingColumnId, editingColumnTitle);
      setEditingColumnId(null);
    } else if (e.key === 'Escape') {
      setEditingColumnId(null);
    }
  };

  const handleColorChange = async (columnId: string, newColor: string) => {
    try {
      const newColumns = selectedPipeline.columns.map(col => 
        col.id === columnId ? { ...col, color: newColor } : col
      );
      
      const columnsForDb = newColumns.map(col => ({
        id: col.id,
        title: col.title,
        color: col.color
      }));
      
      const { error } = await supabase
        .from("pipelines")
        .update({
          columns: columnsForDb
        })
        .eq("id", selectedPipeline.id);

      if (error) throw error;

      onReorderColumns(newColumns);

      toast({
        title: "Color updated",
        description: "Column color has been updated successfully"
      });
    } catch (error) {
      console.error("Error updating column color:", error);
      toast({
        title: "Error",
        description: "Failed to update column color",
        variant: "destructive"
      });
    }
  };

  const handleAddNewStage = () => {
    const newStage: PipelineColumn = {
      id: crypto.randomUUID(),
      title: "New Stage",
      color: "bg-gray-500",
    };
    
    const newColumns = [...selectedPipeline.columns, newStage];
    onAddStage(newStage);
    onReorderColumns(newColumns);
    
    setEditingColumnId(newStage.id);
    setEditingColumnTitle("New Stage");
  };

  const handleDeleteStage = async (column: PipelineColumn) => {
    try {
      const newColumns = selectedPipeline.columns.filter(col => col.id !== column.id);
      const columnsForDb = newColumns.map(col => ({
        id: col.id,
        title: col.title,
        color: col.color
      }));
      
      const { error } = await supabase
        .from("pipelines")
        .update({
          columns: columnsForDb
        })
        .eq("id", selectedPipeline.id);

      if (error) throw error;

      onReorderColumns(newColumns);
      setStageToDelete(null);

      toast({
        title: "Stage deleted",
        description: `${column.title} stage has been deleted successfully`
      });
    } catch (error) {
      console.error("Error deleting stage:", error);
      toast({
        title: "Error",
        description: "Failed to delete stage",
        variant: "destructive"
      });
      setStageToDelete(null);
    }
  };

  // Fix for handling stage reordering
  const handleStageReorder = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    // Find indices of the columns being reordered
    const oldIndex = selectedPipeline.columns.findIndex(col => col.id === active.id);
    const newIndex = selectedPipeline.columns.findIndex(col => col.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
    // Create a new array with the columns in the new order
    const newColumns = [...selectedPipeline.columns];
    const [movedColumn] = newColumns.splice(oldIndex, 1);
    newColumns.splice(newIndex, 0, movedColumn);
    
    // Update the pipeline with the new column order
    const columnsForDb = newColumns.map(col => ({
      id: col.id,
      title: col.title,
      color: col.color
    }));
    
    try {
      const { error } = await supabase
        .from("pipelines")
        .update({
          columns: columnsForDb
        })
        .eq("id", selectedPipeline.id);
        
      if (error) throw error;
      
      // Update the UI
      onReorderColumns(newColumns);
      
      toast({
        title: "Stages reordered",
        description: "Pipeline stages have been reordered successfully"
      });
    } catch (error) {
      console.error("Error reordering stages:", error);
      toast({
        title: "Error",
        description: "Failed to reorder stages",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <PipelineName
        name={selectedPipeline.name}
        onEditPipelineName={onEditPipelineName}
        onDeletePipeline={onDeletePipeline}
      />

      <DndContext 
        sensors={sensors} 
        onDragEnd={(event) => {
          // Determine if this is a stage reordering or a lead movement
          if (selectedPipeline.columns.some(col => col.id === event.active.id)) {
            handleStageReorder(event);
          } else {
            onDragEnd(event);
          }
        }}
      >
        <div className="flex flex-wrap gap-6">
          <SortableContext items={selectedPipeline.columns.map(col => col.id)} strategy={horizontalListSortingStrategy}>
            {selectedPipeline.columns.map((column) => {
              const columnLeads = leads.filter((lead) => 
                lead.status.toLowerCase() === column.title.toLowerCase()
              );
              
              return (
                <SortableStage key={column.id} column={column}>
                  <PipelineStage
                    column={column}
                    columnLeads={columnLeads}
                    isCollapsed={isColumnCollapsed(column.id)}
                    editingColumnId={editingColumnId}
                    editingColumnTitle={editingColumnTitle}
                    onEditColumnTitle={handleKeyDown}
                    setEditingColumnTitle={setEditingColumnTitle}
                    handleColorChange={handleColorChange}
                    setStageToDelete={setStageToDelete}
                    toggleColumnCollapse={toggleColumnCollapse}
                    setEditingColumnId={setEditingColumnId}
                    onLeadClick={onLeadClick}
                    allPipelines={allPipelines}
                    currentPipelineId={selectedPipeline.id}
                  />
                </SortableStage>
              );
            })}
          </SortableContext>
          
          <AddStageButton onAddStage={handleAddNewStage} />
        </div>
      </DndContext>

      <DeleteStageDialog
        stageToDelete={stageToDelete}
        onClose={(open) => !open && setStageToDelete(null)}
        onConfirm={handleDeleteStage}
      />
    </>
  );
}
