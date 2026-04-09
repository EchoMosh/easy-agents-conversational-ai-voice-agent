import { useMemo } from "react";
import { Zap, Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AgentSettingsState } from "@/components/agents/settings/types";
import {
  LLM_PROVIDERS,
  isRealtimeModel,
} from "@/components/agents/settings/constants/llm-providers";

interface LlmTabProps {
  settings: AgentSettingsState;
  onChange: (partial: Partial<AgentSettingsState>) => void;
}

// Default config when the user flips Realtime Mode ON.
const REALTIME_DEFAULTS = {
  llmProvider: "openai",
  llmModel: "gpt-realtime-2025-08-28",
  voiceProvider: "openai",
  voiceId: "alloy",
  voiceModel: "",
};

// Preset config to snap back to when Realtime Mode is turned OFF.
const STANDARD_DEFAULTS = {
  llmProvider: "openai",
  llmModel: "gpt-4o-mini",
};

export function LlmTab({ settings, onChange }: LlmTabProps) {
  const provider = useMemo(
    () => LLM_PROVIDERS.find((p) => p.id === settings.llmProvider),
    [settings.llmProvider],
  );

  const realtimeActive = isRealtimeModel(settings.llmModel);

  const handleProviderChange = (providerId: string) => {
    const newProvider = LLM_PROVIDERS.find((p) => p.id === providerId);
    if (!newProvider) return;

    const firstModel = newProvider.models[0];
    onChange({
      llmProvider: providerId,
      llmModel: firstModel?.id ?? "",
    });
  };

  const handleRealtimeToggle = (on: boolean) => {
    if (on) {
      // Switching INTO realtime: auto-configure everything.
      onChange({
        llmProvider: REALTIME_DEFAULTS.llmProvider,
        llmModel: REALTIME_DEFAULTS.llmModel,
        voiceProvider: REALTIME_DEFAULTS.voiceProvider,
        voiceId: REALTIME_DEFAULTS.voiceId,
        voiceModel: REALTIME_DEFAULTS.voiceModel,
      });
    } else {
      // Switching OUT of realtime: snap back to a sensible default.
      onChange({
        llmProvider: STANDARD_DEFAULTS.llmProvider,
        llmModel: STANDARD_DEFAULTS.llmModel,
      });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* === REALTIME MODE TOGGLE === */}
      <div
        className={`rounded-xl border p-4 transition-colors ${
          realtimeActive
            ? "border-violet-400/50 bg-violet-50/50 dark:bg-violet-950/20"
            : "border-border/50 bg-background/50"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 rounded-lg p-1.5 ${
              realtimeActive
                ? "bg-violet-500/20 text-violet-600 dark:text-violet-400"
                : "bg-muted text-muted-foreground"
            }`}
          >
            <Zap className="h-4 w-4" />
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-semibold">Realtime Mode</Label>
                {realtimeActive && (
                  <Badge
                    variant="outline"
                    className="ml-2 border-violet-400/50 text-[10px] px-1.5 py-0 text-violet-600 dark:text-violet-400"
                  >
                    Active
                  </Badge>
                )}
              </div>
              <Switch
                checked={realtimeActive}
                onCheckedChange={handleRealtimeToggle}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              OpenAI speech-to-speech. ~200ms latency, natural interruptions,
              built-in emotional expression. No separate transcriber or TTS.
            </p>
            {realtimeActive && (
              <div className="mt-3 space-y-2 rounded-lg bg-violet-500/5 p-3 text-xs text-violet-900 dark:text-violet-200">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-3 w-3 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="font-medium">While Realtime is on:</p>
                    <ul className="list-disc space-y-0.5 pl-4 opacity-90">
                      <li>
                        Voice provider is locked to OpenAI (
                        <code className="font-mono">alloy</code>,{" "}
                        <code className="font-mono">echo</code>,{" "}
                        <code className="font-mono">shimmer</code>,{" "}
                        <code className="font-mono">marin</code>, or{" "}
                        <code className="font-mono">cedar</code>)
                      </li>
                      <li>Transcriber tab has no effect</li>
                      <li>Knowledge bases are not supported</li>
                      <li>
                        Change the model below to switch variants (production vs
                        preview)
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* LLM Provider — disabled while realtime is on since it's locked */}
      <div className="space-y-2">
        <Label
          className={`text-sm font-medium ${realtimeActive ? "opacity-60" : ""}`}
        >
          LLM Provider
          {realtimeActive && (
            <span className="ml-2 text-[10px] font-normal text-muted-foreground">
              (locked by Realtime Mode)
            </span>
          )}
        </Label>
        <Select
          value={settings.llmProvider}
          onValueChange={handleProviderChange}
          disabled={realtimeActive}
        >
          <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background/50">
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {LLM_PROVIDERS.map((p) => (
              <SelectItem key={p.id} value={p.id} className="py-2.5">
                <span className="flex items-center gap-2">
                  <span>{p.name}</span>
                  {p.requiresApiKey && (
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 text-muted-foreground"
                    >
                      Requires API Key
                    </Badge>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Model Selector */}
      {provider && provider.models.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Model</Label>
          <Select
            value={settings.llmModel}
            onValueChange={(id) => onChange({ llmModel: id })}
          >
            <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background/50">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {provider.models.map((model) => {
                const modelIsRealtime = isRealtimeModel(model.id);
                return (
                  <SelectItem
                    key={model.id}
                    value={model.id}
                    className="py-2.5"
                  >
                    <span className="flex items-center gap-2">
                      <span>{model.name}</span>
                      {modelIsRealtime && (
                        <Badge
                          variant="outline"
                          className="border-violet-400/50 text-[10px] px-1.5 py-0 text-violet-600 dark:text-violet-400"
                        >
                          Realtime
                        </Badge>
                      )}
                      {model.contextWindow && !modelIsRealtime && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 text-muted-foreground"
                        >
                          {model.contextWindow >= 1000
                            ? `${Math.round(model.contextWindow / 1000)}k`
                            : model.contextWindow}
                        </Badge>
                      )}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Temperature Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Temperature</Label>
          <span className="text-xs text-muted-foreground tabular-nums">
            {(settings.llmTemperature ?? 0.7).toFixed(2)}
          </span>
        </div>
        <Slider
          value={[settings.llmTemperature ?? 0.7]}
          onValueChange={([v]) => onChange({ llmTemperature: v })}
          min={0}
          max={1}
          step={0.01}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Focused</span>
          <span>Creative</span>
        </div>
      </div>

      {/* Max Tokens Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Max Tokens</Label>
          <span className="text-xs text-muted-foreground tabular-nums">
            {settings.llmMaxTokens ?? 250}
          </span>
        </div>
        <Slider
          value={[settings.llmMaxTokens ?? 250]}
          onValueChange={([v]) => onChange({ llmMaxTokens: v })}
          min={50}
          max={1000}
          step={10}
          className="w-full"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>50</span>
          <span>1000</span>
        </div>
      </div>
    </div>
  );
}
