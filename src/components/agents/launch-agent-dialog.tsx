import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserRound, Users, RefreshCw, AlertTriangle } from "lucide-react";
import { Agent } from "@/types/agent";
import { supabase } from "@/integrations/supabase/client";

const LAURA_VOICE_ID = "uYXf8XasLslADfZ2MB4u";

// Placeholder for actual Supabase update function (copied from AgentVoiceCall)
const updateSupabaseAgentVoiceId = async (agentId: string, newVoiceId: string) => {
  console.log(`Attempting to update Supabase for agent ${agentId} with voice_id ${newVoiceId}`);
  const { error } = await supabase
    .from('agents')
    .update({ voice_id: newVoiceId })
    .eq('id', agentId);

  if (error) {
    console.error("Supabase update error:", error);
    throw new Error(`Supabase update failed: ${error.message}`);
  }
  console.log(`Supabase update successful for agent ${agentId}`);
};

interface LaunchAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent;
}

export function LaunchAgentDialog({
  open,
  onOpenChange,
  agent,
}: LaunchAgentDialogProps) {
  const [isUpdatingAgent, setIsUpdatingAgent] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(open);

  const sendAgentDataToWebhookInternal = async () => {
    setIsUpdatingAgent(true);
    setUpdateError(null);
    try {
      let currentAgentData = JSON.parse(JSON.stringify(agent)); // Deep clone
      let voiceIdForPayload = currentAgentData.voice_id || LAURA_VOICE_ID; // Default to Laura's voice

      if (currentAgentData.voice_character === "Laura") {
        console.log("Laura's voice selected. Attempting to update Supabase with ID:", LAURA_VOICE_ID);
        try {
          await updateSupabaseAgentVoiceId(currentAgentData.id, LAURA_VOICE_ID);
          console.log("Supabase update for Laura's voice ID presumed successful.");
          voiceIdForPayload = LAURA_VOICE_ID;
          currentAgentData.voice_id = LAURA_VOICE_ID;
        } catch (supabaseError) {
          console.error("Failed to update Laura's voice ID in Supabase:", supabaseError);
        }
      }

      // Ensure we always have a valid voice ID
      if (!voiceIdForPayload) {
        voiceIdForPayload = LAURA_VOICE_ID;
        console.log("No voice ID found, defaulting to Laura's voice:", LAURA_VOICE_ID);
      }

      console.log("Final voiceIdForPayload:", voiceIdForPayload, "Type:", typeof voiceIdForPayload);

      let vapiId = currentAgentData.v_agent_id || currentAgentData.elevenlabs_agent_id || null;
      
      console.log("LaunchAgentDialog: vapiId found:", vapiId);
      
      // If no vapiId exists, we'll send a temporary one and let the backend create a new assistant
      if (!vapiId) {
        vapiId = `temp-${currentAgentData.id}`;
        console.log("LaunchAgentDialog: No vapiId found, using temporary:", vapiId);
      }

      // Ensure firstMessageNode is defined and cleaned
      const rawFirstMessage = typeof agent.flow === 'string'
        ? JSON.parse(agent.flow)?.nodes?.find(node => node.type === 'startNode')?.data?.firstMessage
        : agent.flow?.nodes?.find(node => node.type === 'startNode')?.data?.firstMessage
      || "Hi there! I'm here to help you today.";
      
      const cleanedFirstMessage = rawFirstMessage.replace(/<[^>]*>?/gm, '');

      // Get mermaid chart from agent data
      const mermaidChart = currentAgentData.mermaid_chart || "";
      
      // Use Supabase Edge Function instead of direct API calls
      const { data, error } = await supabase.functions.invoke('update-vapi-agent', {
        body: {
          agent_id: currentAgentData.id,
          v_agent_id: vapiId,
          voice_id: voiceIdForPayload,
          language: currentAgentData.language || "en",
          first_message: cleanedFirstMessage,
          mermaid_chart: mermaidChart,
          max_duration_seconds: currentAgentData.maxDurationSeconds || 600,
          background_sound: currentAgentData.background_sound === "off" ? "off" : (currentAgentData.background_sound || "office")
        }
      });

      if (error) {
        console.error("LaunchAgentDialog: Error from update-vapi-agent function:", error);
        throw new Error(`Failed to update agent: ${error.message}`);
      }

      // If successful and we got a new ID or if a new assistant was created, save it to the database
      if (data?.data?.id && (data.data.id !== vapiId || data.created)) {
        console.log("LaunchAgentDialog: Saving new/updated vapiId to Supabase:", data.data.id);
        const { error: updateError } = await supabase
          .from('agents')
          .update({ v_agent_id: data.data.id })
          .eq('id', currentAgentData.id);

        if (updateError) {
          console.error("Failed to save vapiId to Supabase:", updateError);
        } else {
          console.log("Successfully saved vapiId to Supabase");
        }
      }
      
      if (data.created) {
        console.log("LaunchAgentDialog: New assistant created successfully");
      } else {
        console.log("LaunchAgentDialog: Agent updated successfully via edge function");
      }
      setIsUpdatingAgent(false);
      return true;
    } catch (error) {
      console.error("LaunchAgentDialog: Error updating agent:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during agent update.';
      setUpdateError(`Failed to update agent: ${errorMessage}`);
      setIsUpdatingAgent(false);
      return false;
    }
  };

  useEffect(() => {
    setDialogOpen(open);
    if (open) {
      // Trigger agent update when dialog is opened
      sendAgentDataToWebhookInternal();
    } else {
      // Reset states when dialog is closed externally or by onOpenChange(false)
      setIsUpdatingAgent(false);
      setUpdateError(null);
    }
  }, [open, agent.id]); // agent.id dependency to re-update if different agent is passed while dialog was already open (edge case)

  const handleDialogOpenChange = (newOpen: boolean) => {
    setDialogOpen(newOpen);
    onOpenChange(newOpen);
    if (!newOpen) {
      setIsUpdatingAgent(false);
      setUpdateError(null);
    }
  };

  const handleSingleCall = () => {
    console.log("Single call option selected for agent:", agent.name);
    // Implementation would go here
    handleDialogOpenChange(false);
  };

  const handleBulkCall = () => {
    console.log("Bulk call option selected for agent:", agent.name);
    // Implementation would go here
    handleDialogOpenChange(false);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-xl">
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <DialogTitle className="text-xl font-semibold">Launch Agent</DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400 min-h-[20px]">
            {isUpdatingAgent 
              ? "Preparing your agent..." 
              : updateError 
              ? "Agent update failed" 
              : `Choose how you want to launch ${agent.name}`}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 min-h-[180px] flex flex-col justify-center">
          {isUpdatingAgent ? (
            <div className="flex flex-col items-center justify-center text-center">
              <RefreshCw className="h-10 w-10 text-indigo-500 animate-spin mb-4" />
              <p className="text-md font-medium text-gray-700 dark:text-gray-300">Updating Agent</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Please wait a moment.</p>
            </div>
          ) : updateError ? (
            <div className="flex flex-col items-center justify-center text-center">
              <AlertTriangle className="h-10 w-10 text-red-500 mb-3" />
              <p className="text-md font-medium text-red-600 dark:text-red-400">Update Failed</p>
              <p className="text-sm text-red-500 dark:text-red-400 mb-4 max-w-xs truncate">{updateError}</p>
              <Button onClick={sendAgentDataToWebhookInternal} variant="outline" size="sm">
                Try Again
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col items-center">
                <Button
                  onClick={handleSingleCall}
                  className="w-full h-32 flex flex-col items-center justify-center gap-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm transition-all hover:shadow-md"
                >
                  <UserRound className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
                  <span className="text-base font-medium">Individual Contact</span>
                </Button>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                  Launch a call with a single contact
                </p>
              </div>

              <div className="flex flex-col items-center">
                <Button
                  onClick={handleBulkCall}
                  className="w-full h-32 flex flex-col items-center justify-center gap-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm transition-all hover:shadow-md"
                >
                  <Users className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
                  <span className="text-base font-medium">Bulk Campaign</span>
                </Button>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                  Launch calls to multiple contacts at once
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
