
import { useState } from "react";
import { PipelineColumn } from "@/types/pipeline";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Lead } from "@/pages/dashboard/leads";

// Helper functions for stage validation
const validateStageForDeletion = (
  column: PipelineColumn | null, 
  pipelineId: string | null, 
  columns: PipelineColumn[]
): { isValid: boolean; error?: string } => {
  // Check if we have valid column and pipeline
  if (!column || !pipelineId) {
    console.error("Invalid stage deletion attempt:", { column, pipelineId });
    return {
      isValid: false,
      error: "Cannot delete: invalid stage or pipeline"
    };
  }
  
  // Check if this is the last stage in the pipeline
  if (columns.length <= 1) {
    return {
      isValid: false,
      error: "Cannot delete the last stage in a pipeline"
    };
  }
  
  return { isValid: true };
};

const checkForLeadsInStage = (
  column: PipelineColumn,
  pipelineId: string,
  leads: Lead[]
): { hasLeads: boolean; leadsCount: number } => {
  console.log(`Checking for leads in stage "${column.title}" (pipeline ${pipelineId})`);
  console.log(`Total leads count: ${leads.length}`);
  
  // Log each lead's status to help debug
  leads.forEach(lead => {
    if (lead.pipeline_id === pipelineId) {
      console.log(`Lead ${lead.id}: pipeline=${lead.pipeline_id}, status="${lead.status}"`);
    }
  });
  
  // Filter leads to only include those in this pipeline and stage (case-insensitive)
  const leadsInStage = leads.filter(lead => 
    lead.pipeline_id === pipelineId && 
    lead.status && 
    column.title && 
    lead.status.toLowerCase() === column.title.toLowerCase()
  );
  
  console.log(`Found ${leadsInStage.length} leads in stage "${column.title}"`);
  
  return {
    hasLeads: leadsInStage.length > 0,
    leadsCount: leadsInStage.length
  };
};

export function useStages(onReorderColumns: (newOrder: PipelineColumn[]) => void) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnTitle, setEditingColumnTitle] = useState("");
  const [collapsedColumns, setCollapsedColumns] = useState<Map<string, Set<string>>>(new Map());
  const [isAddingStage, setIsAddingStage] = useState(false);

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
    if (isAddingStage) {
      console.log("Already adding a stage, please wait...");
      return;
    }
    
    try {
      setIsAddingStage(true);
      
      const defaultStageName = "New Stage";
      
      let newStageName = defaultStageName;
      let counter = 1;
      
      while (columns.some(col => col.title.toLowerCase() === newStageName.toLowerCase())) {
        newStageName = `${defaultStageName} ${counter}`;
        counter++;
      }
      
      const newId = crypto.randomUUID();
      
      const newStage: PipelineColumn = {
        id: newId,
        title: newStageName,
        color: "bg-gray-500",
      };
      
      onAddStage(newStage);
      
      const columnsForDb = [...columns, newStage].map(col => ({
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
        
      if (error) {
        console.error("Error saving new stage:", error);
        throw error;
      }
      
      setEditingColumnId(newId);
      setEditingColumnTitle(newStageName);
      
      toast({
        title: "Stage added",
        description: "New pipeline stage has been added successfully"
      });
      
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
      
    } catch (error) {
      console.error("Error adding new stage:", error);
      toast({
        title: "Error",
        description: "Failed to add new stage",
        variant: "destructive"
      });
    } finally {
      setIsAddingStage(false);
    }
  };

  const handleDeleteStage = async (
    pipelineId: string, 
    column: PipelineColumn, 
    columns: PipelineColumn[],
    leads: Lead[]
  ) => {
    console.log("Starting handleDeleteStage process...");
    console.log("Params:", { 
      pipelineId, 
      columnId: column?.id, 
      columnTitle: column?.title, 
      columnsCount: columns.length,
      leadsCount: leads.length
    });
    
    try {
      // First validate the deletion
      const validation = validateStageForDeletion(column, pipelineId, columns);
      if (!validation.isValid) {
        console.warn("Stage validation failed:", validation.error);
        toast({
          title: "Cannot delete stage",
          description: validation.error,
          variant: "destructive"
        });
        
        throw new Error(validation.error);
      }
      
      // Check for leads in this stage
      const { hasLeads, leadsCount } = checkForLeadsInStage(column, pipelineId, leads);
      
      if (hasLeads) {
        const errorMessage = `This stage contains ${leadsCount} lead${leadsCount > 1 ? 's' : ''}. Please move or delete them first.`;
        console.warn(errorMessage);
        
        toast({
          title: "Cannot delete stage",
          description: errorMessage,
          variant: "destructive"
        });
        
        throw new Error("Cannot delete stage with leads");
      }
      
      // Proceed with stage deletion since validation passed
      console.log("Validation passed, deleting stage:", column.title, "from pipeline:", pipelineId);
      
      // Create a new array of columns without the one being deleted
      const newColumns = columns.filter(col => col.id !== column.id);
      
      // Update local state immediately for better UX
      onReorderColumns(newColumns);
      
      // Update the query cache to reflect changes
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
      
      // Success - we don't need a toast here as the component will show its own
      console.log("Stage deleted successfully:", column.title);
      
      // Return void to indicate success
      return;
    } catch (error) {
      console.error("Error in handleDeleteStage:", error);
      
      // Don't throw again if it's one of our expected validation errors
      if ((error as Error).message === "Cannot delete stage with leads" || 
          (error as Error).message === "Cannot delete the last stage in a pipeline") {
        return;
      }
      
      // If it's another error, refresh the state and throw
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
      
      // Re-throw for the component to handle
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
    handleDeleteStage,
    isAddingStage
  };
}
