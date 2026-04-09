import * as React from "react";
import {
  Mic,
  AudioLines,
  Brain,
  Settings2,
  BookOpen,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { AgentSettingsState, DEFAULT_SETTINGS } from "./types";
import { VoiceTab } from "./tabs/voice-tab";
import { TranscriberTab } from "./tabs/transcriber-tab";
import { LlmTab } from "./tabs/llm-tab";
import { BehaviorTab } from "./tabs/behavior-tab";
import { KnowledgeTab } from "./tabs/knowledge-tab";

const TABS = [
  { id: "voice", label: "Voice", icon: Mic },
  { id: "transcriber", label: "Transcriber", icon: AudioLines },
  { id: "llm", label: "LLM", icon: Brain },
  { id: "behavior", label: "Behavior", icon: Settings2 },
  { id: "knowledge", label: "Knowledge", icon: BookOpen },
] as const;

type TabId = (typeof TABS)[number]["id"];

interface AgentSettingsProps {
  agentId: string;
  currentVoice?: string;
  currentLanguage?: string;
  currentHumorLevel?: number;
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onUpdateSettings: (settings: {
    voiceId?: string;
    language?: string;
    humorLevel?: number;
    maxDurationSeconds?: number;
  }) => Promise<void>;
}

export function AgentSettings({
  agentId,
  open: controlledOpen,
  onOpenChange,
  onUpdateSettings,
}: AgentSettingsProps) {
  const isOpen = controlledOpen ?? false;
  const setOpen = React.useCallback(
    (value: boolean) => {
      onOpenChange?.(value);
      if (!value) {
        document.body.style.overflow = "";
        document.body.style.paddingRight = "";
      }
    },
    [onOpenChange],
  );

  const [activeTab, setActiveTab] = React.useState<TabId>("voice");
  const [settings, setSettings] =
    React.useState<AgentSettingsState>(DEFAULT_SETTINGS);
  const [originalSettings, setOriginalSettings] =
    React.useState<AgentSettingsState>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [agentMeta, setAgentMeta] = React.useState<{
    v_agent_id: string | null;
    first_message: string;
    mermaid_chart: string;
    vapi_knowledge_base_id: string | null;
  }>({
    v_agent_id: null,
    first_message: "",
    mermaid_chart: "",
    vapi_knowledge_base_id: null,
  });
  const { toast } = useToast();

  const handleChange = React.useCallback(
    (partial: Partial<AgentSettingsState>) => {
      setSettings((prev) => ({ ...prev, ...partial }));
    },
    [],
  );

  // Load agent data when dialog opens
  React.useEffect(() => {
    if (!isOpen || !agentId) return;

    const loadAgent = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("agents")
          .select("*")
          .eq("id", agentId)
          .maybeSingle();

        if (error) throw error;
        if (!data) return;

        const vc = (data.voice_config as Record<string, unknown>) || {};
        const tc = (data.transcriber_config as Record<string, unknown>) || {};
        const mc = (data.model_config as Record<string, unknown>) || {};

        const loaded: AgentSettingsState = {
          ...DEFAULT_SETTINGS,
          voiceProvider: (vc.provider as string) || "vapi",
          voiceId:
            (data.voice_id as string) || (vc.voiceId as string) || "Elliot",
          voiceModel: vc.model as string | undefined,
          voiceSpeed: (vc.speed as number) ?? 1.0,
          voiceStability: (vc.stability as number) ?? 0.5,
          voiceSimilarityBoost: (vc.similarityBoost as number) ?? 0.75,
          voiceEmotions: (vc.emotion as string[]) || [],
          voiceStylePrompt: (vc.stylePrompt as string) || "",
          transcriberProvider: (tc.provider as string) || "talkscriber",
          transcriberModel: (tc.model as string) || "whisper",
          transcriberLanguage:
            (tc.language as string) || (data.language as string) || "en",
          llmProvider: (mc.provider as string) || "groq",
          llmModel: (mc.model as string) || "llama-3.3-70b-versatile",
          llmTemperature: (mc.temperature as number) ?? 0.3,
          llmMaxTokens: (mc.maxTokens as number) ?? 250,
          backgroundSound: (data.background_sound as string) || "off",
          backgroundDenoisingEnabled: true,
          silenceTimeoutSeconds: 30,
          maxDurationSeconds: (data.max_duration_seconds as number) || 600,
          knowledgeBaseId: (data.vapi_knowledge_base_id as string) || null,
          language: (data.language as string) || "en",
        };

        // Extract first_message from flow data
        let firstMessage = "";
        try {
          const flowData =
            typeof data.flow === "string" ? JSON.parse(data.flow) : data.flow;
          firstMessage =
            flowData?.nodes?.find((node: any) => node.type === "startNode")
              ?.data?.firstMessage || "";
        } catch (parseErr) {
          console.error("Failed to parse flow for first_message:", parseErr);
        }

        setAgentMeta({
          v_agent_id: (data.v_agent_id as string) || null,
          first_message: firstMessage.replace(/<[^>]*>?/gm, ""),
          mermaid_chart: (data.mermaid_chart as string) || "",
          vapi_knowledge_base_id:
            (data.vapi_knowledge_base_id as string) || null,
        });

        setSettings(loaded);
        setOriginalSettings(loaded);
      } catch (err) {
        console.error("Failed to load agent settings:", err);
        toast({
          title: "Error",
          description: "Failed to load agent settings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadAgent();
    setActiveTab("voice");
  }, [isOpen, agentId, toast]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updates = {
        voice_id: settings.voiceId,
        language: settings.language,
        background_sound: settings.backgroundSound,
        max_duration_seconds: settings.maxDurationSeconds,
        voice_config: {
          provider: settings.voiceProvider,
          voiceId: settings.voiceId,
          model: settings.voiceModel,
          speed: settings.voiceSpeed,
          stability: settings.voiceStability,
          similarityBoost: settings.voiceSimilarityBoost,
          emotion: settings.voiceEmotions,
          stylePrompt: settings.voiceStylePrompt,
        },
        transcriber_config: {
          provider: settings.transcriberProvider,
          model: settings.transcriberModel,
          language: settings.transcriberLanguage,
        },
        model_config: {
          provider: settings.llmProvider,
          model: settings.llmModel,
          temperature: settings.llmTemperature,
          maxTokens: settings.llmMaxTokens,
          ...(settings.knowledgeBaseId && {
            knowledgeBaseId: settings.knowledgeBaseId,
          }),
        },
      };

      const { error } = await supabase
        .from("agents")
        .update(updates)
        .eq("id", agentId);

      if (error) {
        console.error("Supabase save error:", error);
        throw error;
      }

      // Sync full settings to the voice backend — BLOCKING so the user sees
      // real errors instead of a fake "Settings saved" toast over a silently
      // failed sync.
      if (agentMeta.v_agent_id) {
        // Do NOT manually set Authorization — supabase-js auto-attaches the
        // current session's JWT and refreshes it if expired. Setting
        // `Bearer ${session?.access_token}` manually sends literal
        // "Bearer undefined" when the stale session is null, which causes
        // Supabase's Functions gateway to reject with 401.
        const { data: syncResult, error: syncError } =
          await supabase.functions.invoke("update-vapi-agent", {
            body: {
              agent_id: agentId,
              v_agent_id: agentMeta.v_agent_id,
              voice_id: settings.voiceId,
              language: settings.language,
              first_message:
                agentMeta.first_message ||
                "Hello! This is an AI assistant. How can I help you today?",
              mermaid_chart: agentMeta.mermaid_chart,
              max_duration_seconds: settings.maxDurationSeconds,
              background_sound: settings.backgroundSound,
              knowledge_base_id: agentMeta.vapi_knowledge_base_id,
              voice_provider: settings.voiceProvider,
              voice_model: settings.voiceModel,
              voice_speed: settings.voiceSpeed,
              voice_stability: settings.voiceStability,
              voice_similarity_boost: settings.voiceSimilarityBoost,
              voice_emotion: settings.voiceEmotions,
              voice_style_prompt: settings.voiceStylePrompt,
              transcriber_provider: settings.transcriberProvider,
              transcriber_model: settings.transcriberModel,
              transcriber_language: settings.transcriberLanguage,
              llm_provider: settings.llmProvider,
              llm_model: settings.llmModel,
              llm_temperature: settings.llmTemperature,
              llm_max_tokens: settings.llmMaxTokens,
              background_denoising_enabled: settings.backgroundDenoisingEnabled,
              silence_timeout_seconds: settings.silenceTimeoutSeconds,
              start_speaking_wait_seconds: settings.startSpeakingWaitSeconds,
              smart_endpointing_enabled: settings.smartEndpointingEnabled,
              on_punctuation_seconds: settings.onPunctuationSeconds,
              on_no_punctuation_seconds: settings.onNoPunctuationSeconds,
              on_number_seconds: settings.onNumberSeconds,
              stop_speaking_num_words: settings.stopSpeakingNumWords,
              stop_speaking_voice_seconds: settings.stopSpeakingVoiceSeconds,
              stop_speaking_backoff_seconds:
                settings.stopSpeakingBackoffSeconds,
            },
          });

        if (syncError) {
          console.error("Agent sync error:", syncError);
          throw new Error(
            `Saved locally but upstream sync failed: ${syncError.message}`,
          );
        }
        const result = syncResult as {
          success?: boolean;
          error?: string;
          message?: string;
          details?: unknown;
        } | null;
        if (result && result.success === false) {
          console.error("Upstream rejected update:", result);
          const reason = result.message || result.error || "unknown error";
          throw new Error(
            `Saved locally but agent update was rejected: ${reason}`,
          );
        }
      } else {
        console.warn(
          "Agent has no upstream ID — saved locally only, skipping remote sync",
        );
        toast({
          title: "Saved locally",
          description:
            "This agent hasn't been deployed yet, so changes are only stored locally.",
        });
      }

      setOriginalSettings(settings);
      if (agentMeta.v_agent_id) {
        toast({ title: "Settings saved" });
      }
      setOpen(false);

      // Fire parent sync (non-critical, local-only fields)
      onUpdateSettings({
        voiceId: settings.voiceId,
        language: settings.language,
        maxDurationSeconds: settings.maxDurationSeconds,
      }).catch((err) => {
        console.error("Parent onUpdateSettings failed:", err);
      });
    } catch (err) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message || String(err);
      console.error("Failed to save settings:", errorMsg, err);
      toast({
        title: "Error",
        description: `Failed to save settings: ${errorMsg}`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSettings(originalSettings);
    setOpen(false);
  };

  const hasChanges =
    JSON.stringify(settings) !== JSON.stringify(originalSettings);

  // Save button is also enabled when there are no local changes but the
  // agent has been deployed upstream — this lets the user force a re-sync
  // of the already-saved DB state to the voice backend, which is critical
  // when earlier syncs silently failed (e.g. from the 401 JWT bug) and
  // left the upstream assistant out of date.
  const canSave = hasChanges || !!agentMeta.v_agent_id;

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      style={{
        // Create a new stacking/paint context so backdrop-filter inside
        // the dialog can't sample through to the ReactFlow canvas
        // underneath. Without this, every mouse move on the canvas
        // forced a repaint of every blurred element inside the dialog
        // and the user saw the background flickering through.
        isolation: "isolate",
      }}
      onClick={handleCancel}
    >
      <div
        className="relative flex flex-col bg-background rounded-2xl shadow-2xl border border-border/50 w-full max-w-2xl max-h-[90vh] mx-4"
        style={{
          // GPU-promote the dialog container so its repaints are
          // isolated from the rest of the page.
          willChange: "transform",
          transform: "translateZ(0)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — fixed */}
        <div className="shrink-0 px-6 py-4 border-b border-border/50 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Agent Settings</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Configure voice, transcription, LLM, behavior, and knowledge
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCancel}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Tab bar — fixed */}
            <div className="shrink-0 flex gap-1 border-b border-border/50 px-6 overflow-x-auto">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap",
                      isActive
                        ? "text-primary border-b-2 border-primary"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab content — scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5">
              {activeTab === "voice" && (
                <VoiceTab settings={settings} onChange={handleChange} />
              )}
              {activeTab === "transcriber" && (
                <TranscriberTab settings={settings} onChange={handleChange} />
              )}
              {activeTab === "llm" && (
                <LlmTab settings={settings} onChange={handleChange} />
              )}
              {activeTab === "behavior" && (
                <BehaviorTab settings={settings} onChange={handleChange} />
              )}
              {activeTab === "knowledge" && (
                <KnowledgeTab
                  settings={settings}
                  onChange={handleChange}
                  agentId={agentId}
                />
              )}
            </div>

            {/* Footer — fixed at bottom */}
            <div className="shrink-0 flex justify-end gap-3 px-6 py-4 border-t border-border/50 rounded-b-2xl">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving || !canSave}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : hasChanges ? (
                  "Save Changes"
                ) : (
                  "Re-sync to Backend"
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
