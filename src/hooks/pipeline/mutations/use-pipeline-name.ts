
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Pipeline } from "@/types/pipeline";
import { toast } from "sonner";

export function usePipelineName() {
  const [isUpdatingPipelineName, setIsUpdatingPipelineName] = useState(false);
  const queryClient = useQueryClient();

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

      toast.success("Pipeline name has been updated successfully");
    } catch (error) {
      console.error("Error updating pipeline name:", error);
      toast.error("Failed to update pipeline name");
    } finally {
      setIsUpdatingPipelineName(false);
    }
  };

  return {
    handleEditPipelineName,
    isUpdatingPipelineName,
  };
}
