
import { useState } from "react";
import { PipelineColumn } from "@/types/pipeline";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Lead } from "@/pages/dashboard/leads";

export function useStages(onReorderColumns: (newOrder: PipelineColumn[]) => void) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnTitle, setEditingColumnTitle] = useState("");
  const [collapsedColumns, setCollapsedColumns] = useState<Map<string, Set<string>>>(new Map());

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

  const handleAddNewStage = async (pipelineId: string, columns: PipelineColumn[], onAddStage: (stage: PipelineColumn) => void) => {
    // Generate a truly unique ID
    const newId = crypto.randomUUID();
    
    const newStage: PipelineColumn = {
      id: newId,
      title: "New Stage",
      color: "bg-gray-500",
    };
    
    try {
      // Add the new stage to the local state immediately
      onAddStage(newStage);
      
      // Also update the columns in the database
      const columnsForDb = [...columns, newStage].map(col => ({
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
        console.error("Error saving new stage:", error);
        throw error;
      }
      
      // Set the new stage for editing
      setEditingColumnId(newId);
      setEditingColumnTitle("New Stage");
      
      toast({
        title: "Stage added",
        description: "New pipeline stage has been added successfully"
      });
      
    } catch (error) {
      console.error("Error adding new stage:", error);
      toast({
        title: "Error",
        description: "Failed to add new stage",
        variant: "destructive"
      });
    }
  };

  const handleDeleteStage = async (
    pipelineId: string, 
    column: PipelineColumn, 
    columns: PipelineColumn[],
    leads: Lead[]
  ) => {
    if (!column || !pipelineId) {
      console.error("Invalid stage deletion attempt:", { column, pipelineId });
      throw new Error("Cannot delete: invalid stage or pipeline");
    }
    
    // Check if this is the last stage in the pipeline
    if (columns.length <= 1) {
      toast({
        title: "Cannot delete stage",
        description: "A pipeline must have at least one stage. Create a new stage before deleting this one.",
        variant: "destructive"
      });
      
      throw new Error("Cannot delete the last stage in a pipeline");
    }
    
    // Check if any leads are in this stage - add null check for lead.status
    const leadsInStage = leads.filter(lead => 
      lead.status && column.title &&
      lead.status.toLowerCase() === column.title.toLowerCase()
    );
    
    if (leadsInStage.length > 0) {
      toast({
        title: "Cannot delete stage",
        description: `This stage contains ${leadsInStage.length} lead${leadsInStage.length > 1 ? 's' : ''}. Please move or delete them first.`,
        variant: "destructive"
      });
      
      throw new Error("Cannot delete stage with leads");
    }
    
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
    } catch (error) {
      if ((error as Error).message === "Cannot delete stage with leads" || 
          (error as Error).message === "Cannot delete the last stage in a pipeline") {
        // These errors were already handled with a toast, no need to invalidate
        return;
      }
      
      console.error("Error deleting stage:", error);
      
      // Revert changes in case of error
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
      
      // Re-throw the error so the component can handle it
      throw error;
    }
  };

  return {
    editingColumnId,
    setEditingColumnId,
    editingColumnTitle,
    setEditingColumnTitle,
    isColumnCollapsed,
    toggleColumnCollapse,
    handleKeyDown,
    handleColorChange,
    handleAddNewStage,
    handleDeleteStage
  };
}
