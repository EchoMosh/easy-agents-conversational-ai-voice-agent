
import { DragEndEvent } from "@dnd-kit/core";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Pipeline } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";

export function usePipelineDrag(selectedPipeline: Pipeline | null, leads: Lead[], refetchLeads: () => void) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || !selectedPipeline || isUpdating) return;

    // Get IDs as strings
    const leadId = String(active.id);
    const newColumnId = String(over.id);
    
    // Check if this is a drag operation between stages (for reordering)
    const allColumnIds = selectedPipeline.columns.map(col => col.id);
    const isStageReordering = allColumnIds.includes(leadId) && allColumnIds.includes(newColumnId);

    if (isStageReordering) {
      console.log(`Stage reordering detected: ${leadId} -> ${newColumnId}`);
      return; // Let the stage reordering handler take care of this
    }
    
    // At this point, we expect a valid lead ID (UUID format)
    if (!leadId.match(/^[0-9a-f-]+$/i)) {
      console.log(`Invalid lead ID format: ${leadId}, skipping drag operation`);
      return;
    }

    // Find the lead being dragged
    const lead = leads.find(l => l.id === leadId);
    if (!lead) {
      console.error("Lead not found:", leadId);
      return;
    }

    // Find the target column in the selected pipeline
    const targetColumn = selectedPipeline.columns.find(col => col.id === newColumnId);
    if (!targetColumn) {
      console.error("Target column not found:", newColumnId);
      return;
    }

    const newStatus = targetColumn.title;
    
    // Check if the lead is already in the target status and pipeline
    if (lead.status === newStatus && lead.pipeline_id === selectedPipeline.id) {
      console.log("Lead already in the target status and pipeline");
      return;
    }

    // Set updating state to prevent multiple simultaneous updates
    setIsUpdating(true);

    try {
      console.log(`Moving lead ${leadId} to pipeline ${selectedPipeline.id}, status ${newStatus}`);
      
      // Update the database
      const { error } = await supabase
        .from("leads")
        .update({ 
          status: newStatus,
          pipeline_id: selectedPipeline.id,
          updated_at: new Date().toISOString() // Add timestamp to ensure trigger fires
        })
        .eq("id", leadId);

      if (error) throw error;

      // Show success toast after the update succeeds
      toast({
        title: "Lead status updated",
        description: `Lead moved to ${newStatus}`,
      });
      
      // Refetch leads to ensure UI is in sync with server state
      refetchLeads();
    } catch (error) {
      console.error("Error updating lead status:", error);
      toast({
        title: "Error",
        description: "Failed to update lead status",
        variant: "destructive",
      });
      // Force refetch to revert to correct state in case of error
      refetchLeads();
    } finally {
      // Delay resetting isUpdating to prevent quick double-updates
      setTimeout(() => {
        setIsUpdating(false);
      }, 500);
    }
  };

  return { handleDragEnd, isUpdating };
}
