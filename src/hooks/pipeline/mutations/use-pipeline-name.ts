
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Pipeline } from "@/types/pipeline";

export function usePipelineName() {
  const { toast } = useToast();
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
    handleEditPipelineName,
    isUpdatingPipelineName,
  };
}
