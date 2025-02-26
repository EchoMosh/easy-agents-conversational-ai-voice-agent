
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
}: PipelineStagesProps) {
  const { toast } = useToast();
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnTitle, setEditingColumnTitle] = useState("");
  const [collapsedColumns, setCollapsedColumns] = useState<Map<string, Set<string>>>(new Map());
  const [stageToDelete, setStageToDelete] = useState<PipelineColumn | null>(null);
  const [localColumns, setLocalColumns] = useState<PipelineColumn[]>(selectedPipeline.columns);

  // Update local columns when selectedPipeline changes
  if (JSON.stringify(localColumns) !== JSON.stringify(selectedPipeline.columns)) {
    setLocalColumns(selectedPipeline.columns);
  }

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

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && editingColumnId && editingColumnTitle.trim()) {
      const newColumns = localColumns.map(col => 
        col.id === editingColumnId ? { ...col, title: editingColumnTitle.trim() } : col
      );
      
      // Update local state immediately for optimistic UI update
      setLocalColumns(newColumns);
      onEditColumnTitle(editingColumnId, editingColumnTitle.trim());
      setEditingColumnId(null);
    } else if (e.key === 'Escape') {
      setEditingColumnId(null);
    }
  };

  const handleColorChange = async (columnId: string, newColor: string) => {
    try {
      const newColumns = localColumns.map(col => 
        col.id === columnId ? { ...col, color: newColor } : col
      );
      
      // Update local state immediately
      setLocalColumns(newColumns);
      
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
      // Revert local state on error
      setLocalColumns(selectedPipeline.columns);
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
    
    const newColumns = [...localColumns, newStage];
    setLocalColumns(newColumns);
    onAddStage(newStage);
    onReorderColumns(newColumns);
    
    setEditingColumnId(newStage.id);
    setEditingColumnTitle("New Stage");
  };

  const handleDeleteStage = async (column: PipelineColumn) => {
    try {
      const newColumns = localColumns.filter(col => col.id !== column.id);
      
      // Update local state immediately
      setLocalColumns(newColumns);
      
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
      // Revert local state on error
      setLocalColumns(selectedPipeline.columns);
      console.error("Error deleting stage:", error);
      toast({
        title: "Error",
        description: "Failed to delete stage",
        variant: "destructive"
      });
      setStageToDelete(null);
    }
  };

  return (
    <>
      <PipelineName
        name={selectedPipeline.name}
        onEditPipelineName={onEditPipelineName}
        onDeletePipeline={onDeletePipeline}
      />

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="flex flex-wrap gap-6">
          <SortableContext items={localColumns.map(col => col.id)} strategy={horizontalListSortingStrategy}>
            {localColumns.map((column) => {
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
