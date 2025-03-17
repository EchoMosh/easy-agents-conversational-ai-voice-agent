
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Pipeline, PipelineColumn } from "@/types/pipeline";
import { defaultColumns } from "./default-columns";
import { Json } from "@/integrations/supabase/types";

// Helper to ensure no column has an empty title
const ensureValidTitles = (columns: PipelineColumn[]): PipelineColumn[] => {
  return columns.map(col => ({
    ...col,
    title: col.title || "Untitled Stage" // Provide default title if empty
  }));
};

// Helper to convert PipelineColumn[] to a JSON-compatible format
const columnsToJson = (columns: PipelineColumn[]): Json => {
  return columns as unknown as Json;
};

export function usePipelineMutations(
  refetchPipelines: () => void,
  refetchLeads: () => void
) {
  // Create a new pipeline
  const createNewPipeline = async (name: string) => {
    try {
      console.log("Creating new pipeline:", name);
      
      // Generate columns with default values
      const columns = defaultColumns.map(col => ({
        ...col,
        id: crypto.randomUUID(),
      }));
      
      // Insert the new pipeline
      const { data, error } = await supabase
        .from("pipelines")
        .insert([
          {
            name,
            columns: columnsToJson(ensureValidTitles(columns)),
            user_id: (await supabase.auth.getUser()).data.user?.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      
      toast.success("Pipeline created successfully");
      refetchPipelines();
      return data;
    } catch (error) {
      console.error("Error creating pipeline:", error);
      toast.error("Failed to create pipeline");
      throw error;
    }
  };

  // Edit a column title
  const handleEditColumnTitle = async (pipeline: Pipeline, columnId: string, newTitle: string) => {
    try {
      // Exit if the title is blank
      if (!newTitle.trim()) {
        toast.error("Column title cannot be empty");
        return;
      }
      
      // Find the index of the column to update
      const columnIndex = pipeline.columns.findIndex(col => col.id === columnId);
      
      if (columnIndex === -1) {
        console.error("Column not found:", columnId);
        toast.error("Column not found");
        return;
      }
      
      // Create a new array of columns with the updated title
      const updatedColumns = [...pipeline.columns];
      updatedColumns[columnIndex] = {
        ...updatedColumns[columnIndex],
        title: newTitle.trim()
      };
      
      // Update the database with the new columns
      const { error } = await supabase
        .from("pipelines")
        .update({
          columns: columnsToJson(ensureValidTitles(updatedColumns))
        })
        .eq("id", pipeline.id);

      if (error) throw error;
      
      toast.success("Column title updated");
      refetchPipelines();
    } catch (error) {
      console.error("Error updating column title:", error);
      toast.error("Failed to update column title");
    }
  };

  // Delete a pipeline
  const handleDeletePipeline = async (pipelineId: string) => {
    try {
      // Delete the pipeline
      const { error } = await supabase
        .from("pipelines")
        .delete()
        .eq("id", pipelineId);

      if (error) throw error;
      
      toast.success("Pipeline deleted successfully");
      refetchPipelines();
    } catch (error) {
      console.error("Error deleting pipeline:", error);
      toast.error("Failed to delete pipeline");
      throw error;
    }
  };

  // Edit a pipeline name
  const handleEditPipelineName = async (pipelineId: string, name: string) => {
    try {
      // Exit if the name is blank
      if (!name.trim()) {
        toast.error("Pipeline name cannot be empty");
        return;
      }
      
      // Update the pipeline name
      const { error } = await supabase
        .from("pipelines")
        .update({ name: name.trim() })
        .eq("id", pipelineId);

      if (error) throw error;
      
      toast.success("Pipeline name updated");
      refetchPipelines();
    } catch (error) {
      console.error("Error updating pipeline name:", error);
      toast.error("Failed to update pipeline name");
    }
  };

  return {
    createNewPipeline,
    handleEditColumnTitle,
    handleDeletePipeline,
    handleEditPipelineName,
  };
}
