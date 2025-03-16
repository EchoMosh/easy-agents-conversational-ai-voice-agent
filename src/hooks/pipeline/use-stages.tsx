
import { useState } from "react";
import { PipelineColumn } from "@/types/pipeline";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export function useStages(onReorderColumns: (newOrder: PipelineColumn[]) => void) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnTitle, setEditingColumnTitle] = useState("");
  const [collapsedColumns, setCollapsedColumns] = useState<Map<string, Set<string>>>(new Map());
  const [stageToDelete, setStageToDelete] = useState<PipelineColumn | null>(null);

  const isColumnCollapsed = (pipelineId: string, columnId: string) => {
    const pipelineCollapsed = collapsedColumns.get(pipelineId);
    return pipelineCollapsed?.has(columnId) ?? false;
  };

  const toggleColumnCollapse = (pipelineId: string, columnId: string) => {
    setCollapsedColumns(prev => {
      const newMap = new Map(prev);
      const pipelineCollapsed = new Set<string>(newMap.get(pipelineId) || new Set());
      
      if (pipelineCollapsed.has(columnId)) {
        pipelineCollapsed.delete(columnId);
      } else {
        pipelineCollapsed.add(columnId);
      }
      
      newMap.set(pipelineId, pipelineCollapsed);
      return newMap;
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, onEditColumnTitle: (columnId: string, newTitle: string) => void) => {
    if (e.key === 'Enter' && editingColumnId && editingColumnTitle.trim()) {
      onEditColumnTitle(editingColumnId, editingColumnTitle);
      setEditingColumnId(null);
    } else if (e.key === 'Escape') {
      setEditingColumnId(null);
    }
  };

  const handleColorChange = async (
    pipelineId: string, 
    columnId: string, 
    newColor: string, 
    columns: PipelineColumn[]
  ) => {
    try {
      const newColumns = columns.map(col => 
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
        .eq("id", pipelineId);

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

  const handleAddNewStage = (pipelineId: string, columns: PipelineColumn[], onAddStage: (stage: PipelineColumn) => void) => {
    const newStage: PipelineColumn = {
      id: crypto.randomUUID(),
      title: "New Stage",
      color: "bg-gray-500",
    };
    
    const newColumns = [...columns, newStage];
    onAddStage(newStage);
    onReorderColumns(newColumns);
    
    setEditingColumnId(newStage.id);
    setEditingColumnTitle("New Stage");
  };

  const handleDeleteStage = async (
    pipelineId: string, 
    column: PipelineColumn, 
    columns: PipelineColumn[]
  ) => {
    try {
      console.log("Deleting stage:", column.title, "from pipeline:", pipelineId);
      // Optimistically update the UI
      const newColumns = columns.filter(col => col.id !== column.id);
      
      // Immediately update application state
      onReorderColumns(newColumns);
      
      // Update the React Query cache
      queryClient.setQueryData(["pipelines"], (oldData: any) => {
        if (!oldData) return oldData;
        
        return oldData.map((pipeline: any) => {
          if (pipeline.id === pipelineId) {
            return {
              ...pipeline,
              columns: newColumns
            };
          }
          return pipeline;
        });
      });
      
      // Format columns for database update
      const columnsForDb = newColumns.map(col => ({
        id: col.id,
        title: col.title,
        color: col.color
      }));
      
      // Update the database
      const { error } = await supabase
        .from("pipelines")
        .update({
          columns: columnsForDb
        })
        .eq("id", pipelineId);

      if (error) {
        console.error("Database error when deleting stage:", error);
        throw error;
      }

      // Reset the stage to delete
      setStageToDelete(null);

      toast({
        title: "Stage deleted",
        description: `${column.title} stage has been deleted successfully`
      });
    } catch (error) {
      console.error("Error deleting stage:", error);
      
      // Revert changes in case of error
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
      
      toast({
        title: "Error",
        description: "Failed to delete stage",
        variant: "destructive"
      });
      setStageToDelete(null);
    }
  };

  return {
    editingColumnId,
    setEditingColumnId,
    editingColumnTitle,
    setEditingColumnTitle,
    stageToDelete,
    setStageToDelete,
    isColumnCollapsed,
    toggleColumnCollapse,
    handleKeyDown,
    handleColorChange,
    handleAddNewStage,
    handleDeleteStage
  };
}
