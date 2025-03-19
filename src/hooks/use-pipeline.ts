
import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase, withWorkspace } from "@/integrations/supabase/client";
import { useWorkspace } from "@/context/workspace-context";
import { Pipeline } from "@/types/pipeline";
import { usePipelineQueries } from "./pipeline/use-pipeline-queries";
import { usePipelineMutations } from "./pipeline/use-pipeline-mutations";

export const defaultColumns = [
  { id: "1", title: "New", items: [] },
  { id: "2", title: "Contacted", items: [] },
  { id: "3", title: "Qualified", items: [] },
  { id: "4", title: "Proposal", items: [] },
  { id: "5", title: "Negotiation", items: [] },
  { id: "6", title: "Won", items: [] },
  { id: "7", title: "Lost", items: [] },
];

export const usePipeline = () => {
  const { currentWorkspace } = useWorkspace();
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [showNewPipelineDialog, setShowNewPipelineDialog] = useState(false);
  const queryClient = useQueryClient();

  const {
    pipelines,
    leads,
    isLoading,
    refetchPipelines,
    refetchLeads,
    invalidateAndRefetch,
  } = usePipelineQueries(selectedPipeline?.id);

  const {
    updatePipelineName,
    updateColumnTitle,
    deletePipeline: deletePipelineMutation,
    createPipeline: createPipelineMutation,
  } = usePipelineMutations();

  const handleEditPipelineName = useCallback(
    async (name: string) => {
      if (!selectedPipeline) return;

      try {
        await updatePipelineName(selectedPipeline.id, name);
        setSelectedPipeline({ ...selectedPipeline, name });
        toast.success("Pipeline name updated");
      } catch (error) {
        console.error("Error updating pipeline name:", error);
        toast.error("Failed to update pipeline name");
      }
    },
    [selectedPipeline, updatePipelineName]
  );

  const handleEditColumnTitle = useCallback(
    async (columnId: string, title: string) => {
      if (!selectedPipeline) return;

      try {
        const updatedPipeline = await updateColumnTitle(
          selectedPipeline,
          columnId,
          title
        );
        if (updatedPipeline) {
          setSelectedPipeline(updatedPipeline);
          toast.success("Column name updated");
        }
      } catch (error) {
        console.error("Error updating column title:", error);
        toast.error("Failed to update column title");
      }
    },
    [selectedPipeline, updateColumnTitle]
  );

  const handleDeletePipeline = useCallback(
    async (id: string, targetPipelineId?: string) => {
      try {
        await deletePipelineMutation(id, targetPipelineId);
        toast.success("Pipeline deleted");
        await invalidateAndRefetch();
      } catch (error) {
        console.error("Error deleting pipeline:", error);
        toast.error("Failed to delete pipeline");
      }
    },
    [deletePipelineMutation, invalidateAndRefetch]
  );

  const createNewPipeline = useCallback(
    async (name: string) => {
      if (!currentWorkspace?.id) {
        toast.error("No workspace selected");
        return;
      }

      try {
        const newPipeline = await createPipelineMutation(name, currentWorkspace.id);
        if (newPipeline) {
          toast.success("Pipeline created");
          await invalidateAndRefetch();
          return newPipeline;
        }
      } catch (error) {
        console.error("Error creating pipeline:", error);
        toast.error("Failed to create pipeline");
      }
      return null;
    },
    [createPipelineMutation, invalidateAndRefetch, currentWorkspace]
  );

  return {
    pipelines,
    leads,
    selectedPipeline,
    isLoading,
    showNewPipelineDialog,
    setSelectedPipeline,
    setShowNewPipelineDialog,
    handleEditColumnTitle,
    handleEditPipelineName,
    handleDeletePipeline,
    createNewPipeline,
    refetchPipelines,
    refetchLeads,
    invalidateAndRefetch,
  };
};
