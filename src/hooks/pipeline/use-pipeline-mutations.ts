
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Pipeline, PipelineColumn } from "@/types/pipeline";
import { defaultColumns } from "./default-columns";

export function usePipelineMutations(refetchPipelines: () => void, refetchLeads: () => void) {
  const { toast } = useToast();

  const handleEditColumnTitle = async (pipeline: Pipeline, columnId: string, newTitle: string) => {
    const newColumns = [...pipeline.columns];
    const index = newColumns.findIndex(c => c.id === columnId);
    const oldTitle = newColumns[index].title;
    newColumns[index] = { ...newColumns[index], title: newTitle };

    try {
      const columnsJson = newColumns.map(col => ({
        id: col.id,
        title: col.title,
        color: col.color,
      }));

      const { error } = await supabase
        .from("pipelines")
        .update({
          columns: columnsJson
        })
        .eq("id", pipeline.id);

      if (error) throw error;

      // Update lead statuses
      const { error: leadsError } = await supabase
        .from("leads")
        .update({ status: newTitle })
        .eq("status", oldTitle);

      if (leadsError) throw leadsError;

      toast({
        title: "Stage updated",
        description: "Pipeline stage has been updated successfully"
      });

      refetchLeads();
    } catch (error) {
      console.error("Error updating pipeline stage:", error);
      toast({
        title: "Error",
        description: "Failed to update pipeline stage",
        variant: "destructive"
      });
    }
  };

  const createNewPipeline = async (name: string) => {
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;

    if (!userId) {
      toast({
        title: "Error",
        description: "You must be logged in to create a pipeline",
        variant: "destructive",
      });
      return;
    }

    try {
      const columnsJson = defaultColumns.map(col => ({
        id: col.id,
        title: col.title,
        color: col.color,
      }));

      const { error } = await supabase
        .from("pipelines")
        .insert({
          name,
          columns: columnsJson,
          user_id: userId,
        });

      if (error) throw error;

      toast({
        title: "Pipeline created",
        description: "New pipeline has been created successfully",
      });

      refetchPipelines();
    } catch (error) {
      console.error("Error creating pipeline:", error);
      toast({
        title: "Error",
        description: "Failed to create pipeline",
        variant: "destructive",
      });
    }
  };

  const handleDeletePipeline = async (pipelineId: string) => {
    try {
      const { error } = await supabase
        .from("pipelines")
        .delete()
        .eq("id", pipelineId);

      if (error) throw error;

      toast({
        title: "Pipeline deleted",
        description: "Pipeline has been deleted successfully",
      });

      refetchPipelines();
    } catch (error) {
      console.error("Error deleting pipeline:", error);
      toast({
        title: "Error",
        description: "Failed to delete pipeline",
        variant: "destructive",
      });
    }
  };

  const handleEditPipelineName = async (pipelineId: string, name: string) => {
    try {
      const { error } = await supabase
        .from("pipelines")
        .update({ name })
        .eq("id", pipelineId);

      if (error) throw error;

      toast({
        title: "Pipeline updated",
        description: "Pipeline name has been updated successfully"
      });

      refetchPipelines();
    } catch (error) {
      console.error("Error updating pipeline name:", error);
      toast({
        title: "Error",
        description: "Failed to update pipeline name",
        variant: "destructive"
      });
    }
  };

  return {
    handleEditColumnTitle,
    createNewPipeline,
    handleDeletePipeline,
    handleEditPipelineName,
  };
}
