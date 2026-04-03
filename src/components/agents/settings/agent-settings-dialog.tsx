import * as React from "react";
import {
  Mic,
  AudioLines,
  Brain,
  Settings2,
  BookOpen,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CustomModal,
  CustomModalFooter,
} from "@/components/agents/flow/custom-modal";
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
          knowledgeBaseId: settings.knowledgeBaseId,
        },
      };

      const { error } = await supabase
        .from("agents")
        .update(updates)
        .eq("id", agentId);

      if (error) throw error;

      // Call the parent's onUpdateSettings for backward compat
      await onUpdateSettings({
        voiceId: settings.voiceId,
        language: settings.language,
        maxDurationSeconds: settings.maxDurationSeconds,
      });

      setOriginalSettings(settings);
      toast({ title: "Settings saved" });
      setOpen(false);
    } catch (err) {
      console.error("Failed to save settings:", err);
      toast({
        title: "Error",
        description: "Failed to save settings",
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

  return (
    <CustomModal
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) handleCancel();
        else setOpen(v);
      }}
      title="Agent Settings"
      description="Configure voice, transcription, LLM, behavior, and knowledge"
      className="max-w-2xl"
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Tab bar */}
          <div className="flex gap-1 border-b border-border/50 mb-4 -mx-1 px-1 overflow-x-auto">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap",
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

          {/* Tab content */}
          <div className="min-h-[300px] max-h-[50vh] overflow-y-auto pr-1">
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

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-border/50">
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
    </CustomModal>
  );
}
