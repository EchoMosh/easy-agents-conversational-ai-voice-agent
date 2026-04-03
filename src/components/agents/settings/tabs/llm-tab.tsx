import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AgentSettingsState } from "@/components/agents/settings/types";
import { LLM_PROVIDERS } from "@/components/agents/settings/constants/llm-providers";

interface LlmTabProps {
  settings: AgentSettingsState;
  onChange: (partial: Partial<AgentSettingsState>) => void;
}

export function LlmTab({ settings, onChange }: LlmTabProps) {
  const provider = useMemo(
    () => LLM_PROVIDERS.find((p) => p.id === settings.llmProvider),
    [settings.llmProvider],
  );

  const handleProviderChange = (providerId: string) => {
    const newProvider = LLM_PROVIDERS.find((p) => p.id === providerId);
    if (!newProvider) return;

    const firstModel = newProvider.models[0];
    onChange({
      llmProvider: providerId,
      llmModel: firstModel?.id ?? "",
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* LLM Provider */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">LLM Provider</Label>
        <Select
          value={settings.llmProvider}
          onValueChange={handleProviderChange}
        >
          <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background/50 backdrop-blur-sm">
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
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
            <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background/50 backdrop-blur-sm">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {provider.models.map((model) => (
                <SelectItem key={model.id} value={model.id} className="py-2.5">
                  <span className="flex items-center gap-2">
                    <span>{model.name}</span>
                    {model.contextWindow && (
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
              ))}
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
