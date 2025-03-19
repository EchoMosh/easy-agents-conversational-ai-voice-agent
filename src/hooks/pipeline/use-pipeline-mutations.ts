
import { supabase, withWorkspace } from "@/integrations/supabase/client";
import { useWorkspace } from "@/context/workspace-context";
import { Pipeline } from "@/types/pipeline";
import { toast } from "sonner";

export function usePipelineMutations() {
  const { currentWorkspace } = useWorkspace();

  const updatePipelineName = async (id: string, name: string) => {
    const { error } = await supabase
      .from("pipelines")
      .update({ name })
      .eq("id", id);

    if (error) {
      console.error("Error updating pipeline name:", error);
      throw error;
    }
  };

  const updateColumnTitle = async (
    pipeline: Pipeline,
    columnId: string,
    title: string
  ) => {
    try {
      // Find the column and update its title
      const updatedColumns = pipeline.columns.map((column) => {
        if (column.id === columnId) {
          return { ...column, title };
        }
        return column;
      });

      // Update the pipeline with the new columns
      const { error } = await supabase
        .from("pipelines")
        .update({ columns: updatedColumns })
        .eq("id", pipeline.id);

      if (error) throw error;

      // Return the updated pipeline
      return {
        ...pipeline,
        columns: updatedColumns,
      };
    } catch (error) {
      console.error("Error updating column title:", error);
      throw error;
    }
  };

  const deletePipeline = async (id: string, targetPipelineId?: string) => {
    try {
      // If a target pipeline is specified, move all leads to it
      if (targetPipelineId) {
        const { error: updateError } = await supabase
          .from("leads")
          .update({ pipeline_id: targetPipelineId })
          .eq("pipeline_id", id);

        if (updateError) throw updateError;
      }

      // Delete the pipeline
      const { error } = await supabase
        .from("pipelines")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting pipeline:", error);
      throw error;
    }
  };

  const createPipeline = async (name: string, workspaceId: string) => {
    try {
      if (!workspaceId) {
        throw new Error("No workspace selected");
      }

      // Create the pipeline with default columns
      const { data, error } = await supabase
        .from("pipelines")
        .insert({
          name,
          workspace_id: workspaceId,
          columns: [
            { id: "1", title: "New", items: [] },
            { id: "2", title: "Contacted", items: [] },
            { id: "3", title: "Qualified", items: [] },
            { id: "4", title: "Proposal", items: [] },
            { id: "5", title: "Negotiation", items: [] },
            { id: "6", title: "Won", items: [] },
            { id: "7", title: "Lost", items: [] },
          ],
        })
        .select()
        .single();

      if (error) throw error;

      return data as unknown as Pipeline;
    } catch (error) {
      console.error("Error creating pipeline:", error);
      throw error;
    }
  };

  return {
    updatePipelineName,
    updateColumnTitle,
    deletePipeline,
    createPipeline,
  };
}
