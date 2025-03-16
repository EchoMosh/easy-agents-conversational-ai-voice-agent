
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

  const handleAddNewStage = (pipelineId: string, columns: PipelineColumn[], onAddStage: (stage: PipelineColumn) => void) => {
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
      
      // Update the database using async/await pattern instead of Promise chain
      const updateDatabase = async () => {
        try {
          const { error } = await supabase
            .from("pipelines")
            .update({
              columns: columnsForDb
            })
            .eq("id", pipelineId);
            
          if (error) throw error;
        } catch (error) {
          console.error("Error saving new stage:", error);
          toast({
            title: "Error",
            description: "Failed to save new stage. Please refresh and try again.",
            variant: "destructive"
          });
        }
      };
      
      // Execute the async function
      updateDatabase();
      
      // Set the new stage for editing
      setEditingColumnId(newId);
      setEditingColumnTitle("New Stage");
      
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
    
    // Check if any leads are in this stage
    const leadsInStage = leads.filter(lead => 
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
      if ((error as Error).message === "Cannot delete stage with leads") {
        // This error was already handled with a toast, no need to invalidate
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
