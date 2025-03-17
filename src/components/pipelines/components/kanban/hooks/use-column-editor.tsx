
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { PipelineColumn } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";

interface UseColumnEditorProps {
  onEditColumnTitle: (columnId: string, newTitle: string) => void;
  onAddStage: (stage: PipelineColumn) => void;
  onDeleteStage: (column: PipelineColumn) => Promise<void>;
  getColumnLeads?: (columnId: string) => Lead[];
}

export function useColumnEditor({
  onEditColumnTitle,
  onAddStage,
  onDeleteStage,
  getColumnLeads = () => []
}: UseColumnEditorProps) {
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnTitle, setEditingColumnTitle] = useState("");
  const [stageToDelete, setStageToDelete] = useState<PipelineColumn | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingStage, setIsAddingStage] = useState(false);
  const [collapsedColumns, setCollapsedColumns] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

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
    // We'll pass this up to parent
    // Implementation stays in the main component
  };
  
  // Handle deleting a stage
  const handleDeleteStage = (column: PipelineColumn) => {
    // Check if there are leads in this stage
    const leadsInColumn = getColumnLeads(column.id);
    
    if (leadsInColumn.length > 0) {
      toast({
        title: "Cannot delete stage",
        description: `Stage "${column.title}" has ${leadsInColumn.length} leads. Please move them first.`,
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

  // Handle adding a new stage
  const handleAddNewStage = () => {
    if (isAddingStage) {
      console.log("Already adding a stage, please wait...");
      return;
    }
    
    setIsAddingStage(true);
    
    try {
      const newStage: PipelineColumn = {
        id: crypto.randomUUID(),
        title: "New Stage",
        color: "bg-gray-500",
      };
      
      onAddStage(newStage);
      
      // Set editing mode for the new stage
      setEditingColumnId(newStage.id);
      setEditingColumnTitle(newStage.title);
    } catch (error) {
      console.error("Error adding new stage:", error);
      toast({
        title: "Error",
        description: "Failed to add new stage",
        variant: "destructive",
      });
    } finally {
      setIsAddingStage(false);
    }
  };

  return {
    editingColumnId,
    setEditingColumnId,
    editingColumnTitle,
    setEditingColumnTitle,
    stageToDelete,
    setStageToDelete,
    isDeleting,
    isAddingStage,
    collapsedColumns,
    handleKeyDown,
    handleColorChange,
    handleDeleteStage,
    toggleColumnCollapse,
    isColumnCollapsed,
    handleConfirmDeleteStage,
    handleAddNewStage
  };
}
