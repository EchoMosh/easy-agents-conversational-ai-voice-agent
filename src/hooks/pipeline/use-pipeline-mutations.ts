
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Pipeline, PipelineColumn } from "@/types/pipeline";
import { defaultColumns } from "./default-columns";
import { useQueryClient } from "@tanstack/react-query";

export function usePipelineMutations(refetchPipelines: () => void, refetchLeads: () => void) {
  const { toast } = useToast();
  const [isUpdatingPipelineName, setIsUpdatingPipelineName] = useState(false);
  const queryClient = useQueryClient();

  const handleEditColumnTitle = async (pipeline: Pipeline, columnId: string, newTitle: string) => {
    console.log("Updating column title...", { columnId, newTitle });
    const newColumns = [...pipeline.columns];
    const index = newColumns.findIndex(c => c.id === columnId);
    const oldTitle = newColumns[index].title;
    newColumns[index] = { ...newColumns[index], title: newTitle };

    try {
      setIsUpdatingPipelineName(true);
      const columnsJson = newColumns.map(col => ({
        id: col.id,
        title: col.title,
        color: col.color,
      }));

      // First update pipeline columns
      const { error } = await supabase
        .from("pipelines")
        .update({
          columns: columnsJson
        })
        .eq("id", pipeline.id);

      if (error) throw error;

      // Then update lead statuses
      const { error: leadsError } = await supabase
        .from("leads")
        .update({ status: newTitle })
        .eq("status", oldTitle)
        .eq('pipeline_id', pipeline.id);

      if (leadsError) throw leadsError;

      // Create a completely new pipeline object to force a re-render
      const updatedPipeline = {
        ...pipeline,
        columns: newColumns,
      };

      // Update the pipeline in the cache with the new object
      queryClient.setQueryData(["pipelines"], (old: Pipeline[] | undefined) => {
        if (!old) return old;
        return old.map(p => 
          p.id === pipeline.id ? updatedPipeline : p
        );
      });

      // Also update the leads cache
      queryClient.setQueryData(["leads", pipeline.id], (oldLeads: any[] | undefined) => {
        if (!oldLeads) return oldLeads;
        return oldLeads.map(lead => 
          lead.status === oldTitle ? { ...lead, status: newTitle } : lead
        );
      });

      console.log("Column title updated successfully");
      toast({
        title: "Stage updated",
        description: "Pipeline stage has been updated successfully"
      });
    } catch (error) {
      console.error("Error updating pipeline stage:", error);
      toast({
        title: "Error",
        description: "Failed to update pipeline stage",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingPipelineName(false);
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

      const { error, data } = await supabase
        .from("pipelines")
        .insert({
          name,
          columns: columnsJson,
          user_id: userId,
        })
        .select()
        .single();

      if (error) throw error;

      // Immediately update the cache with the new pipeline
      queryClient.setQueryData(["pipelines"], (old: Pipeline[] | undefined) => {
        if (!old) return [data];
        return [...old, data];
      });

      toast({
        title: "Pipeline created",
        description: "New pipeline has been created successfully",
      });
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
      // Delete pipeline (leads and activities will cascade delete)
      const { error } = await supabase
        .from("pipelines")
        .delete()
        .eq("id", pipelineId);

      if (error) throw error;

      // Remove the pipeline from the cache immediately
      queryClient.setQueryData(["pipelines"], (old: Pipeline[] | undefined) => {
        if (!old) return old;
        return old.filter(p => p.id !== pipelineId);
      });

      // Remove the leads data for this pipeline from the cache
      queryClient.removeQueries({
        queryKey: ["leads", pipelineId],
      });

      toast({
        title: "Pipeline deleted",
        description: "Pipeline and associated leads have been deleted successfully",
      });

      // Refresh data to ensure everything is in sync
      await Promise.all([
        refetchPipelines(),
        refetchLeads()
      ]);
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
    setIsUpdatingPipelineName(true);
    
    try {
      const { error } = await supabase
        .from("pipelines")
        .update({ name })
        .eq("id", pipelineId);

      if (error) throw error;

      // Immediately update the pipeline name in the cache
      queryClient.setQueryData(["pipelines"], (old: Pipeline[] | undefined) => {
        if (!old) return old;
        return old.map(p => 
          p.id === pipelineId ? { ...p, name } : p
        );
      });

      toast({
        title: "Pipeline updated",
        description: "Pipeline name has been updated successfully"
      });
    } catch (error) {
      console.error("Error updating pipeline name:", error);
      toast({
        title: "Error",
        description: "Failed to update pipeline name",
        variant: "destructive"
      });
    } finally {
      setIsUpdatingPipelineName(false);
    }
  };

  return {
    handleEditColumnTitle,
    createNewPipeline,
    handleDeletePipeline,
    handleEditPipelineName,
    isUpdatingPipelineName,
  };
}
