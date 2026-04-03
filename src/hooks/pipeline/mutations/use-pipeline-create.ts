import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkspace } from "@/context/workspace-context";
import { defaultColumns } from "@/hooks/use-pipeline";
import { Pipeline } from "@/types/pipeline";
import { toast } from "sonner";

export function usePipelineCreate() {
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspace();

  const createNewPipeline = async (name: string) => {
    const user = await supabase.auth.getUser();
    const userId = user.data.user?.id;

    if (!userId) {
      toast.error("You must be logged in to create a pipeline");
      return;
    }

    if (!currentWorkspace?.id) {
      toast.error("No workspace selected");
      return;
    }

    try {
      const columnsJson = defaultColumns.map((col) => ({
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
          workspace_id: currentWorkspace.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Immediately update the cache with the new pipeline
      queryClient.setQueryData(
        ["pipelines", currentWorkspace.id],
        (old: Pipeline[] | undefined) => {
          if (!old) return [data];
          return [...old, data];
        },
      );

      toast.success("New pipeline has been created successfully");
    } catch (error) {
      console.error("Error creating pipeline:", error);
      toast.error("Failed to create pipeline");
    }
  };

  return { createNewPipeline };
}
