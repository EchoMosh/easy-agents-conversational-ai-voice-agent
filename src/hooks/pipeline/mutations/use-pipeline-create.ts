
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { defaultColumns } from "../default-columns";
import { Pipeline } from "@/types/pipeline";

export function usePipelineCreate() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  return { createNewPipeline };
}
