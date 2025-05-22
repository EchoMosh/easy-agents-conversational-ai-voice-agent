import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquare, Headphones, RefreshCw, AlertTriangle } from "lucide-react";
import { Agent } from "@/types/agent";
import { AgentTrainingPopup } from "@/components/agents/training/agent-training-popup";
import { AgentVoiceCall } from "@/components/agents/voice-call/agent-voice-call";
import axios from "axios";
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

interface TestAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent;
}

export function TestAgentDialog({
  open,
  onOpenChange,
  agent,
}: TestAgentDialogProps) {
  const [showChatPopup, setShowChatPopup] = useState(false);
  const [showVoicePopup, setShowVoicePopup] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(open);

  const [isUpdatingAgent, setIsUpdatingAgent] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const sendAgentDataToWebhookInternal = async () => {
    setIsUpdatingAgent(true);
    setUpdateError(null);
    try {
      let currentAgentData = JSON.parse(JSON.stringify(agent)); // Deep clone
      let voiceIdForPayload = currentAgentData.voice_id || null;

      if (currentAgentData.voice_character === "Laura") {
        console.log("Laura's voice selected. Attempting to update Supabase with ID:", LAURA_VOICE_ID);
        try {
          await updateSupabaseAgentVoiceId(currentAgentData.id, LAURA_VOICE_ID);
          console.log("Supabase update for Laura's voice ID presumed successful.");
          voiceIdForPayload = LAURA_VOICE_ID;
          currentAgentData.voice_id = LAURA_VOICE_ID;
        } catch (supabaseError) {
          console.error("Failed to update Laura's voice ID in Supabase:", supabaseError);
          // Not setting component-level error here, as it's a background detail.
          // The main webhook call will proceed.
        }
      }

      if (!currentAgentData.conversation_config) {
        currentAgentData.conversation_config = {};
      }
      if (!currentAgentData.conversation_config.tts) {
        currentAgentData.conversation_config.tts = {};
      }
      currentAgentData.conversation_config.tts.optimize_streaming_latency = 0;
      
      const vapiId = currentAgentData.v_agent_id || currentAgentData.elevenlabs_agent_id || currentAgentData.id;

      // Ensure firstMessageNode is defined and cleaned
      const rawFirstMessage = typeof agent.flow === 'string'
        ? JSON.parse(agent.flow)?.nodes?.find(node => node.type === 'startNode')?.data?.firstMessage
        : agent.flow?.nodes?.find(node => node.type === 'startNode')?.data?.firstMessage
      || "Hi there! I'm here to help you today.";
      
      const cleanedFirstMessage = rawFirstMessage.replace(/<[^>]*>?/gm, '');

      // Create a copy of currentAgentData to modify for the payload
      const agentDetailsPayload = { ...currentAgentData };
      delete agentDetailsPayload.flow; // Remove the flow property
      
      const webhookPayload = {
        vapi_id: vapiId,
        first_message: cleanedFirstMessage, 
        language: currentAgentData.language || "en",
        voice_id: voiceIdForPayload,
        agent_details: agentDetailsPayload, // Use the modified agent_details
      };
      
      console.log("TestAgentDialog: Sending agent data to webhook:", JSON.stringify(webhookPayload, null, 2));
      
      await axios.post(
        "https://moshi.app.n8n.cloud/webhook/update-agent",
        webhookPayload,
        { headers: { 'Content-Type': 'application/json' } }
      );
      
      console.log("TestAgentDialog: Agent data sent to webhook successfully.");
      setIsUpdatingAgent(false);
      return true;
    } catch (error) {
      console.error("TestAgentDialog: Error sending agent data to webhook:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error during agent update.';
      setUpdateError(`Failed to update agent: ${errorMessage}`);
      setIsUpdatingAgent(false);
      return false;
    }
  };
  
  useEffect(() => {
    const handleReopenDialog = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.agentId === agent.id) {
        onOpenChange(true); // This will trigger the other useEffect for 'open'
      }
    };
    document.addEventListener('reopen-test-dialog', handleReopenDialog);
    return () => {
      document.removeEventListener('reopen-test-dialog', handleReopenDialog);
    };
  }, [agent.id, onOpenChange]);
  
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

  const handleChatOption = () => {
    setShowChatPopup(true);
    handleDialogOpenChange(false);
  };

  const handleVoiceOption = () => {
    setShowVoicePopup(true);
    handleDialogOpenChange(false);
  };

  const firstMessageNode = 
    typeof agent.flow === 'string'
      ? JSON.parse(agent.flow)?.nodes?.find(node => node.type === 'startNode')?.data?.firstMessage
      : agent.flow?.nodes?.find(node => node.type === 'startNode')?.data?.firstMessage
    || "Hi there! I'm here to help you today.";

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-xl">
          <DialogHeader className="p-6 pb-4 border-b border-gray-100 dark:border-gray-800">
            <DialogTitle className="text-xl font-semibold">Test Agent</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400 min-h-[20px]">
              {isUpdatingAgent 
                ? "Preparing your agent..." 
                : updateError 
                ? "Agent update failed" 
                : `Choose how you want to interact with ${agent.name}`}
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
                    onClick={handleChatOption}
                    className="w-full h-32 flex flex-col items-center justify-center gap-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm transition-all hover:shadow-md"
                  >
                    <MessageSquare className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
                    <span className="text-base font-medium">Text Chat</span>
                  </Button>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                    Interact through text messages
                  </p>
                </div>

                <div className="flex flex-col items-center">
                  <Button
                    onClick={handleVoiceOption}
                    className="w-full h-32 flex flex-col items-center justify-center gap-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm transition-all hover:shadow-md"
                  >
                    <Headphones className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
                    <span className="text-base font-medium">Voice Chat</span>
                  </Button>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                    Speak directly with your agent
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Text chat popup */}
      <AgentTrainingPopup
        agent={agent}
        open={showChatPopup}
        onOpenChange={setShowChatPopup}
      />

      {/* Voice call popup */}
      <AgentVoiceCall
        agent={agent}
        open={showVoicePopup}
        onOpenChange={setShowVoicePopup}
        firstMessageNode={firstMessageNode}
      />
    </>
  );
}
