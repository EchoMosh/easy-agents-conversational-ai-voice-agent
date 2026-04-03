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

      setOriginalSettings(settings);
      toast({ title: "Settings saved" });
      setOpen(false);

      // Call the parent's onUpdateSettings in background (syncs to voice service)
      onUpdateSettings({
        voiceId: settings.voiceId,
        language: settings.language,
        maxDurationSeconds: settings.maxDurationSeconds,
      }).catch((err) => {
        console.error("Voice service sync failed (settings saved to DB):", err);
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleCancel}
    >
      <div
        className="relative flex flex-col bg-background rounded-2xl shadow-2xl border border-border/50 w-full max-w-2xl max-h-[90vh] mx-4"
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
              <Button onClick={handleSave} disabled={isSaving || !hasChanges}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
