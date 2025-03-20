
import { Lead } from "@/pages/dashboard/leads";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { convertJsonToPipeline } from "@/types/pipeline";
import { useToast } from "@/components/ui/use-toast";
import { useEffect } from "react";

export function usePipelineData(selectedLead: Lead | undefined) {
  const { toast } = useToast();

  const { data: pipeline } = useQuery({
    queryKey: ["pipeline", selectedLead?.pipeline_id],
    queryFn: async () => {
      if (!selectedLead?.pipeline_id) return null;
      
      const { data, error } = await supabase
        .from("pipelines")
        .select("*")
        .eq("id", selectedLead.pipeline_id)
        .single();
        
      if (error) {
        console.error("Error fetching pipeline:", error);
        return null;
      }
      
      return data ? convertJsonToPipeline(data) : null;
    },
    enabled: !!selectedLead?.pipeline_id,
  });

  useEffect(() => {
    const updateLeadStatus = async () => {
      if (!selectedLead || !pipeline) return;

      const firstStage = pipeline.columns[0]?.title;
      if (!firstStage || selectedLead.status === firstStage) return;

      const { error } = await supabase
        .from("leads")
        .update({ status: firstStage })
        .eq("id", selectedLead.id);

      if (error) {
        console.error("Error updating lead status:", error);
        toast({
          title: "Error",
          description: "Failed to update lead status",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Lead Updated",
        description: `Lead moved to ${firstStage} stage`,
      });
    };

    updateLeadStatus();
  }, [selectedLead?.pipeline_id, pipeline, selectedLead, toast]);

  return { pipeline };
}
