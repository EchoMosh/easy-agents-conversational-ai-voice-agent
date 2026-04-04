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
  UserRound,
  Users,
  RefreshCw,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Agent } from "@/types/agent";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/context/workspace-context";
import { SingleCallView, WorkspacePhone } from "./single-call-view";
import { BulkCallView } from "./bulk-call-view";

const DEFAULT_VOICE_ID = "Elliot";

type View = "launch" | "single" | "bulk";

const updateSupabaseAgentVoiceId = async (
  agentId: string,
  newVoiceId: string,
) => {
  const { error } = await supabase
    .from("agents")
    .update({ voice_id: newVoiceId })
    .eq("id", agentId);

  if (error) {
    console.error("Supabase update error:", error);
    throw new Error(`Supabase update failed: ${error.message}`);
  }
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
  const [view, setView] = useState<View>("launch");
  const [phoneNumbers, setPhoneNumbers] = useState<WorkspacePhone[]>([]);
  const [isFetchingPhones, setIsFetchingPhones] = useState(false);
  const { currentWorkspace } = useWorkspace();

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
        freshAgentData || JSON.parse(JSON.stringify(agent));
      let voiceIdForPayload = currentAgentData.voice_id || DEFAULT_VOICE_ID;

      if (currentAgentData.voice_character === "Laura") {
        try {
          await updateSupabaseAgentVoiceId(
            currentAgentData.id,
            DEFAULT_VOICE_ID,
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

      if (!voiceIdForPayload) {
        voiceIdForPayload = DEFAULT_VOICE_ID;
      }

      const vapiId =
        currentAgentData.v_agent_id ||
        currentAgentData.elevenlabs_agent_id ||
        null;

      if (!vapiId) {
        throw new Error(
          "No voice assistant ID found. Please ensure the agent has been properly created.",
        );
      }

      const defaultFirstMessage = "Hi there! I'm here to help you today.";
      let rawFirstMessage = defaultFirstMessage;
      try {
        const flowData =
          typeof agent.flow === "string" ? JSON.parse(agent.flow) : agent.flow;
        rawFirstMessage =
          flowData?.nodes?.find((node: any) => node.type === "startNode")?.data
            ?.firstMessage || defaultFirstMessage;
      } catch (parseError) {
        console.error("Failed to parse agent flow data:", parseError);
      }

      const cleanedFirstMessage = rawFirstMessage.replace(/<[^>]*>?/gm, "");
      const mermaidChart = currentAgentData.mermaid_chart || "";

      const {
        data: { session },
      } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke(
        "update-vapi-agent",
        {
          body: {
            agent_id: currentAgentData.id,
            v_agent_id: vapiId,
            voice_id: voiceIdForPayload,
            language: currentAgentData.language || "en",
            first_message: cleanedFirstMessage,
            mermaid_chart: mermaidChart,
            max_duration_seconds: currentAgentData.max_duration_seconds || 600,
            background_sound:
              currentAgentData.background_sound === "off"
                ? "off"
                : currentAgentData.background_sound || "office",
            knowledge_base_id: currentAgentData.vapi_knowledge_base_id,
          },
          headers: { Authorization: `Bearer ${session?.access_token}` },
        },
      );

      if (error) {
        console.error(
          "LaunchAgentDialog: Error from update-agent function:",
          error,
        );
        throw new Error(`Failed to update agent: ${error.message}`);
      }

      if (data?.data?.id && (data.data.id !== vapiId || data.created)) {
        const { error: updateError } = await supabase
          .from("agents")
          .update({ v_agent_id: data.data.id })
          .eq("id", currentAgentData.id);

        if (updateError) {
          console.error(
            "Failed to save assistant ID to Supabase:",
            updateError,
          );
        }
      }

      setIsUpdatingAgent(false);
      return true;
    } catch (error) {
      console.error("LaunchAgentDialog: Error updating agent:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error during agent update.";
      setUpdateError(`Failed to update agent: ${errorMessage}`);
      setIsUpdatingAgent(false);
      return false;
    }
  };

  const fetchPhoneNumbers = async () => {
    if (!currentWorkspace?.id) return;
    if (phoneNumbers.length > 0) return;

    setIsFetchingPhones(true);
    try {
      const { data, error } = await supabase
        .from("phone_numbers")
        .select("id, twilio_phone_number, friendly_name, vapi_phone_number_id")
        .eq("workspace_id", currentWorkspace.id);

      if (!error && data) setPhoneNumbers(data);
    } catch (err) {
      console.error("Failed to fetch phone numbers:", err);
    } finally {
      setIsFetchingPhones(false);
    }
  };

  useEffect(() => {
    setDialogOpen(open);
    if (open) {
      sendAgentDataToWebhookInternal();
    } else {
      setIsUpdatingAgent(false);
      setUpdateError(null);
      setView("launch");
    }
  }, [open, agent.id]);

  const handleDialogOpenChange = (newOpen: boolean) => {
    setDialogOpen(newOpen);
    onOpenChange(newOpen);
    if (!newOpen) {
      setIsUpdatingAgent(false);
      setUpdateError(null);
      setView("launch");
    }
  };

  const handleSingleCall = async () => {
    await fetchPhoneNumbers();
    setView("single");
  };

  const handleBulkCall = async () => {
    await fetchPhoneNumbers();
    setView("bulk");
  };

  const viewTitles: Record<View, string> = {
    launch: "Launch Agent",
    single: "Call Individual Contact",
    bulk: "Bulk Campaign",
  };

  const viewDescriptions: Record<string, string | null> = {
    launch: isUpdatingAgent
      ? "Preparing your agent..."
      : updateError
        ? "Agent update failed"
        : `Choose how you want to launch ${agent.name}`,
    single: "Enter the contact's phone number to start a call",
    bulk: "Select which leads to call and kick off your campaign",
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        className={`p-0 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-xl ${
          view === "launch" ? "sm:max-w-md" : "sm:max-w-lg"
        }`}
      >
        <DialogHeader className="p-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <DialogTitle className="text-xl font-semibold">
            {viewTitles[view]}
          </DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400 min-h-[20px]">
            {viewDescriptions[view]}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 min-h-[180px] flex flex-col justify-center">
          {view === "launch" && (
            <>
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
                      onClick={handleSingleCall}
                      disabled={isFetchingPhones}
                      className="w-full h-32 flex flex-col items-center justify-center gap-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm transition-all hover:shadow-md"
                    >
                      {isFetchingPhones ? (
                        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                      ) : (
                        <UserRound className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
                      )}
                      <span className="text-base font-medium">
                        Individual Contact
                      </span>
                    </Button>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                      Launch a call with a single contact
                    </p>
                  </div>

                  <div className="flex flex-col items-center">
                    <Button
                      onClick={handleBulkCall}
                      disabled={isFetchingPhones}
                      className="w-full h-32 flex flex-col items-center justify-center gap-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm transition-all hover:shadow-md"
                    >
                      {isFetchingPhones ? (
                        <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
                      ) : (
                        <Users className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
                      )}
                      <span className="text-base font-medium">
                        Bulk Campaign
                      </span>
                    </Button>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                      Launch calls to multiple contacts at once
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {view === "single" && currentWorkspace?.id && (
            <SingleCallView
              agent={agent}
              phoneNumbers={phoneNumbers}
              workspaceId={currentWorkspace.id}
              onBack={() => setView("launch")}
            />
          )}

          {view === "bulk" && currentWorkspace?.id && (
            <BulkCallView
              agent={agent}
              phoneNumbers={phoneNumbers}
              workspaceId={currentWorkspace.id}
              onBack={() => setView("launch")}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
