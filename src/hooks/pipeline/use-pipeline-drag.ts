
import { DragEndEvent } from "@dnd-kit/core";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Pipeline } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";

export function usePipelineDrag(selectedPipeline: Pipeline | null, leads: Lead[], refetchLeads: () => void) {
  const { toast } = useToast();

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !selectedPipeline) return;

    const leadId = String(active.id);
    const newColumnId = String(over.id);

    const targetColumn = selectedPipeline.columns.find(col => col.id === newColumnId);
    if (!targetColumn) return;

    const newStatus = targetColumn.title;
    const lead = leads.find(l => l.id === leadId);
    
    if (lead?.status === newStatus) return;

    try {
      const { error } = await supabase
        .from("leads")
        .update({ 
          status: newStatus,
          pipeline_id: selectedPipeline.id
        })
        .eq("id", leadId);

      if (error) throw error;

      toast({
        title: "Lead status updated",
        description: `Lead moved to ${newStatus}`,
      });
      
      refetchLeads();
    } catch (error) {
      console.error("Error updating lead status:", error);
      toast({
        title: "Error",
        description: "Failed to update lead status",
        variant: "destructive",
      });
    }
  };

  return { handleDragEnd };
}
