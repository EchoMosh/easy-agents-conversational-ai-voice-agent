
import { useState, useCallback, useEffect } from "react";
import { Lead } from "@/pages/dashboard/leads";
import { PipelineColumn } from "@/types/pipeline";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useStages = (onReorderColumns: (newOrder: PipelineColumn[]) => void) => {
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnTitle, setEditingColumnTitle] = useState<string>("");
  const [collapsedColumns, setCollapsedColumns] = useState<Record<string, string[]>>({});
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Functions for column title edit functionality
  const handleKeyDown = useCallback((e: React.KeyboardEvent, onEditColumnTitle: (columnId: string, newTitle: string) => void) => {
    if (e.key === "Enter" && editingColumnId) {
      e.preventDefault();
      if (editingColumnTitle.trim()) {
        onEditColumnTitle(editingColumnId, editingColumnTitle);
        setEditingColumnId(null);
      }
    } else if (e.key === "Escape") {
      setEditingColumnId(null);
    }
  }, [editingColumnId, editingColumnTitle]);

  // Handle column color change
  const handleColorChange = useCallback(async (pipelineId: string, columnId: string, color: string, columns: PipelineColumn[]) => {
    try {
      const updatedColumns = columns.map(col => 
        col.id === columnId ? { ...col, color } : col
      );
      
      onReorderColumns(updatedColumns);
      
      // Update the database
      const { error } = await supabase
        .from("pipelines")
        .update({ columns: updatedColumns })
        .eq("id", pipelineId);
      
      if (error) throw error;
    } catch (error) {
      console.error("Error updating column color:", error);
      toast.error("Failed to update column color");
    }
  }, [onReorderColumns]);

  // Handle column collapse toggle
  const toggleColumnCollapse = useCallback((pipelineId: string, columnId: string) => {
    setCollapsedColumns(prev => {
      const pipelineColumns = prev[pipelineId] || [];
      const isCurrentlyCollapsed = pipelineColumns.includes(columnId);
      
      const updatedColumns = isCurrentlyCollapsed
        ? pipelineColumns.filter(id => id !== columnId)
        : [...pipelineColumns, columnId];
      
      return {
        ...prev,
        [pipelineId]: updatedColumns
      };
    });
  }, []);

  const isColumnCollapsed = useCallback((pipelineId: string, columnId: string) => {
    return (collapsedColumns[pipelineId] || []).includes(columnId);
  }, [collapsedColumns]);

  // Handle adding a new stage
  const handleAddNewStage = useCallback((pipelineId: string, columns: PipelineColumn[], onAddStage: (stage: PipelineColumn) => void) => {
    setIsAddingStage(true);
    try {
      const newStage: PipelineColumn = {
        id: crypto.randomUUID(),
        title: `New Stage ${columns.length + 1}`,
        color: "bg-gray-500"
      };
      
      onAddStage(newStage);
    } catch (error) {
      console.error("Error adding new stage:", error);
      toast.error("Failed to add new stage");
    } finally {
      setTimeout(() => setIsAddingStage(false), 500);
    }
  }, []);

  // Handle deleting a stage
  const handleDeleteStage = useCallback(async (pipelineId: string, column: PipelineColumn, columns: PipelineColumn[], pipelineLeads: Lead[]) => {
    setIsDeleting(true);
    try {
      if (columns.length <= 1) {
        throw new Error("Cannot delete the last stage in a pipeline");
      }
      
      // Check if there are leads in this stage
      const leadsInStage = pipelineLeads.filter(
        lead => lead.status && column.title && lead.status.toLowerCase() === column.title.toLowerCase()
      );
      
      if (leadsInStage.length > 0) {
        throw new Error(`Cannot delete stage with ${leadsInStage.length} leads. Move them first.`);
      }
      
      // Remove the column from the array
      const updatedColumns = columns.filter(col => col.id !== column.id);
      onReorderColumns(updatedColumns);
      
      // Update the database
      const { error } = await supabase
        .from("pipelines")
        .update({ columns: updatedColumns })
        .eq("id", pipelineId);
      
      if (error) throw error;
      
    } catch (error) {
      console.error("Error deleting stage:", error);
      throw error; // Re-throw to let the caller handle it
    } finally {
      setIsDeleting(false);
    }
  }, [onReorderColumns]);

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
    handleDeleteStage,
    isAddingStage,
    isDeleting
  };
};
