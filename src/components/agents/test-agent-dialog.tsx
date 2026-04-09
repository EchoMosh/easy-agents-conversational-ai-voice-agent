import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Headphones,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { Agent } from "@/types/agent";
import { AgentTrainingPopup } from "@/components/agents/training/agent-training-popup";
import { AgentVoiceCall } from "@/components/agents/voice-call/agent-voice-call";
import { supabase } from "@/integrations/supabase/client";

const DEFAULT_VOICE_ID = "Elliot";

// Placeholder for actual Supabase update function (copied from AgentVoiceCall)
const updateSupabaseAgentVoiceId = async (
  agentId: string,
  newVoiceId: string,
) => {
  console.log(
    `Attempting to update Supabase for agent ${agentId} with voice_id ${newVoiceId}`,
  );
  const { error } = await supabase
    .from("agents")
    .update({ voice_id: newVoiceId })
    .eq("id", agentId);

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
      // Fetch fresh agent data from Supabase to ensure we have the latest updates
      const { data: freshAgentData, error: fetchError } = await supabase
        .from("agents")
        .select("*")
        .eq("id", agent.id)
        .single();

      if (fetchError) {
        console.error("Failed to fetch fresh agent data:", fetchError);
        throw new Error(`Failed to fetch agent data: ${fetchError.message}`);
      }

      let currentAgentData =
        freshAgentData || JSON.parse(JSON.stringify(agent)); // Use fresh data or fallback to prop
      let voiceIdForPayload = currentAgentData.voice_id || DEFAULT_VOICE_ID; // Default to Elliot

      if (currentAgentData.voice_character === "Laura") {
        console.log(
          "Laura's voice selected. Attempting to update Supabase with ID:",
          DEFAULT_VOICE_ID,
        );
        try {
          await updateSupabaseAgentVoiceId(
            currentAgentData.id,
            DEFAULT_VOICE_ID,
          );
          console.log(
            "Supabase update for Laura's voice ID presumed successful.",
          );
          voiceIdForPayload = DEFAULT_VOICE_ID;
          currentAgentData.voice_id = DEFAULT_VOICE_ID;
        } catch (supabaseError) {
          console.error(
            "Failed to update Laura's voice ID in Supabase:",
            supabaseError,
          );
        }
      }

      // Ensure we always have a valid voice ID
      if (!voiceIdForPayload) {
        voiceIdForPayload = DEFAULT_VOICE_ID;
        console.log(
          "No voice ID found, defaulting to Laura's voice:",
          DEFAULT_VOICE_ID,
        );
      }

      console.log(
        "Final voiceIdForPayload:",
        voiceIdForPayload,
        "Type:",
        typeof voiceIdForPayload,
      );

      const vapiId =
        currentAgentData.v_agent_id ||
        currentAgentData.elevenlabs_agent_id ||
        null;

      console.log("TestAgentDialog: assistant ID found:", vapiId);

      // If no vapiId exists, we cannot proceed
      if (!vapiId) {
        console.error("TestAgentDialog: No assistant ID found for agent");
        throw new Error(
          "No voice assistant ID found. Please ensure the agent has been properly created.",
        );
      }

      // CRITICAL: Read firstMessage from the FRESH agent row, not from
      // the stale `agent` prop. Previously we parsed `agent.flow` which
      // was the snapshot captured when the dialog first mounted, so any
      // first-message edits made after opening the flow editor were
      // silently ignored and the edge function fell back to "Hi this is
      // an AI assistant, how can I help you today?" (the hardcoded
      // default in update-vapi-agent).
      const defaultFirstMessage = "Hi there! I'm here to help you today.";
      let rawFirstMessage = defaultFirstMessage;
      try {
        const freshFlow = currentAgentData.flow;
        const flowData =
          typeof freshFlow === "string" ? JSON.parse(freshFlow) : freshFlow;
        const startNode = flowData?.nodes?.find(
          (node: any) => node.type === "startNode",
        );
        const fromNode = startNode?.data?.firstMessage;
        if (fromNode && String(fromNode).trim().length > 0) {
          rawFirstMessage = String(fromNode);
        }
      } catch (parseError) {
        console.error("Failed to parse fresh agent flow data:", parseError);
      }

      // Strip HTML tags but NOT square-bracket expressive tags like
      // [laughs] / [sighs] — those are rendered by ElevenLabs v3.
      const cleanedFirstMessage = rawFirstMessage
        .replace(/<[^>]*>?/gm, "")
        .trim();

      console.log(
        "TestAgentDialog: firstMessage →",
        cleanedFirstMessage || "(empty, will fall back to default)",
      );

      // Get mermaid chart from agent data
      const mermaidChart = currentAgentData.mermaid_chart || "";

      // CRITICAL: We must pass the FULL voice/transcriber/model config
      // from agents.voice_config / transcriber_config / model_config JSONB
      // columns. If we only send voice_id, the edge function defaults
      // voice_provider to "vapi" and coerces unknown voice_ids (like a
      // Rime voice "luna") to "Elliot" — silently reverting the user's
      // voice selection on every Test / Launch.
      const vc =
        (currentAgentData.voice_config as Record<string, unknown>) || {};
      const tc =
        (currentAgentData.transcriber_config as Record<string, unknown>) || {};
      const mc =
        (currentAgentData.model_config as Record<string, unknown>) || {};

      const { data, error } = await supabase.functions.invoke(
        "update-vapi-agent",
        {
          body: {
            agent_id: currentAgentData.id,
            v_agent_id: vapiId,
            voice_id: (vc.voiceId as string) || voiceIdForPayload,
            language: currentAgentData.language || "en",
            first_message: cleanedFirstMessage,
            mermaid_chart: mermaidChart,
            max_duration_seconds: currentAgentData.max_duration_seconds || 600,
            background_sound:
              currentAgentData.background_sound === "off"
                ? "off"
                : currentAgentData.background_sound || "office",
            knowledge_base_id: currentAgentData.vapi_knowledge_base_id,
            voice_provider: vc.provider as string | undefined,
            voice_model: vc.model as string | undefined,
            voice_speed: vc.speed as number | undefined,
            voice_stability: vc.stability as number | undefined,
            voice_similarity_boost: vc.similarityBoost as number | undefined,
            voice_emotion: vc.emotion as string[] | undefined,
            voice_style_prompt: vc.stylePrompt as string | undefined,
            transcriber_provider: tc.provider as string | undefined,
            transcriber_model: tc.model as string | undefined,
            transcriber_language: tc.language as string | undefined,
            llm_provider: mc.provider as string | undefined,
            llm_model: mc.model as string | undefined,
            llm_temperature: mc.temperature as number | undefined,
            llm_max_tokens: mc.maxTokens as number | undefined,
          },
        },
      );

      if (error) {
        console.error(
          "TestAgentDialog: Error from update-agent function:",
          error,
        );
        throw new Error(`Failed to update agent: ${error.message}`);
      }

      console.log(
        "TestAgentDialog: Agent updated successfully via edge function",
      );
      setIsUpdatingAgent(false);
      return true;
    } catch (error) {
      console.error("TestAgentDialog: Error updating agent:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error during agent update.";
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
    document.addEventListener("reopen-test-dialog", handleReopenDialog);
    return () => {
      document.removeEventListener("reopen-test-dialog", handleReopenDialog);
    };
  }, [agent.id, onOpenChange]);

  useEffect(() => {
    setDialogOpen(open);
    if (open) {
      // Add a delay to ensure any pending updates from settings have completed
      const timeoutId = setTimeout(() => {
        sendAgentDataToWebhookInternal();
      }, 500); // 500ms delay to allow settings updates to complete

      return () => clearTimeout(timeoutId);
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

  let firstMessageNode: string | undefined;
  try {
    const flow =
      typeof agent.flow === "string" ? JSON.parse(agent.flow) : agent.flow;
    firstMessageNode =
      flow?.nodes?.find((node: any) => node.type === "startNode")?.data
        ?.firstMessage || "Hi there! I'm here to help you today.";
  } catch {
    console.error("Failed to parse agent flow for first message");
    firstMessageNode = "Hi there! I'm here to help you today.";
  }

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-xl">
          <DialogHeader className="p-6 pb-4 border-b border-gray-100 dark:border-gray-800">
            <DialogTitle className="text-xl font-semibold">
              Test Agent
            </DialogTitle>
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
                <p className="text-md font-medium text-gray-700 dark:text-gray-300">
                  Updating Agent
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Please wait a moment.
                </p>
              </div>
            ) : updateError ? (
              <div className="flex flex-col items-center justify-center text-center">
                <AlertTriangle className="h-10 w-10 text-red-500 mb-3" />
                <p className="text-md font-medium text-red-600 dark:text-red-400">
                  Update Failed
                </p>
                <p className="text-sm text-red-500 dark:text-red-400 mb-4 max-w-xs truncate">
                  {updateError}
                </p>
                <Button
                  onClick={sendAgentDataToWebhookInternal}
                  variant="outline"
                  size="sm"
                >
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
