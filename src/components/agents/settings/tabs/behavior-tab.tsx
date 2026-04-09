import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentSettingsState } from "@/components/agents/settings/types";
import {
  BACKGROUND_SOUNDS,
  ENDPOINTING_PRESETS,
} from "@/components/agents/settings/constants/behavior-defaults";

interface BehaviorTabProps {
  settings: AgentSettingsState;
  onChange: (partial: Partial<AgentSettingsState>) => void;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
}

export function BehaviorTab({ settings, onChange }: BehaviorTabProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const activePreset = ENDPOINTING_PRESETS.find(
    (p) => Math.abs(p.waitSeconds - settings.startSpeakingWaitSeconds) < 0.05,
  );

  const applyPreset = (presetId: string) => {
    const preset = ENDPOINTING_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    // Scale other values proportionally based on the preset's wait time
    const factor = preset.waitSeconds / 0.8; // 0.8 is balanced baseline
    onChange({
      startSpeakingWaitSeconds: preset.waitSeconds,
      onPunctuationSeconds: Math.round(0.1 * factor * 100) / 100,
      onNoPunctuationSeconds: Math.round(0.8 * factor * 100) / 100,
      onNumberSeconds: Math.round(0.4 * factor * 100) / 100,
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Response Speed Presets */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Response Speed</Label>
        <div className="grid grid-cols-3 gap-2">
          {ENDPOINTING_PRESETS.map((preset) => {
            const isActive = activePreset?.id === preset.id;
            return (
              <Button
                key={preset.id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => applyPreset(preset.id)}
                className={cn(
                  "h-auto flex-col items-start gap-1 py-3 px-3 rounded-xl text-left",
                  !isActive &&
                    "border-border/50 bg-background/50 hover:bg-accent/50",
                )}
              >
                <span className="text-sm font-medium">{preset.name}</span>
                <span
                  className={cn(
                    "text-[10px] leading-tight",
                    isActive
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground",
                  )}
                >
                  {preset.description}
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Advanced Endpointing */}
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-xl border border-border/50 bg-background/50 px-4 py-3 text-sm font-medium hover:bg-accent/50 transition-colors">
          <span>Advanced Timing</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              advancedOpen && "rotate-180",
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-4 space-y-5">
          {/* Start Speaking Delay */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Start Speaking Delay
              </Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {(settings.startSpeakingWaitSeconds ?? 0.4).toFixed(1)}s
              </span>
            </div>
            <Slider
              value={[settings.startSpeakingWaitSeconds ?? 0.4]}
              onValueChange={([v]) => onChange({ startSpeakingWaitSeconds: v })}
              min={0.1}
              max={2.0}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* On Punctuation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">On Punctuation</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {(settings.onPunctuationSeconds ?? 0.1).toFixed(2)}s
              </span>
            </div>
            <Slider
              value={[settings.onPunctuationSeconds ?? 0.1]}
              onValueChange={([v]) => onChange({ onPunctuationSeconds: v })}
              min={0.05}
              max={1.0}
              step={0.05}
              className="w-full"
            />
          </div>

          {/* On No Punctuation */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">On No Punctuation</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {(settings.onNoPunctuationSeconds ?? 1.5).toFixed(1)}s
              </span>
            </div>
            <Slider
              value={[settings.onNoPunctuationSeconds ?? 1.5]}
              onValueChange={([v]) => onChange({ onNoPunctuationSeconds: v })}
              min={0.3}
              max={3.0}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* On Number */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">On Number</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {(settings.onNumberSeconds ?? 0.5).toFixed(1)}s
              </span>
            </div>
            <Slider
              value={[settings.onNumberSeconds ?? 0.5]}
              onValueChange={([v]) => onChange({ onNumberSeconds: v })}
              min={0.1}
              max={2.0}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Stop Speaking — Words */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Stop Speaking Words</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {settings.stopSpeakingNumWords ?? 2}
              </span>
            </div>
            <Slider
              value={[settings.stopSpeakingNumWords ?? 2]}
              onValueChange={([v]) => onChange({ stopSpeakingNumWords: v })}
              min={1}
              max={5}
              step={1}
              className="w-full"
            />
          </div>

          {/* Stop Speaking — Voice Seconds */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Stop Speaking Voice Seconds
              </Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {(settings.stopSpeakingVoiceSeconds ?? 0.2).toFixed(1)}s
              </span>
            </div>
            <Slider
              value={[settings.stopSpeakingVoiceSeconds ?? 0.2]}
              onValueChange={([v]) => onChange({ stopSpeakingVoiceSeconds: v })}
              min={0.1}
              max={1.0}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Stop Speaking — Backoff */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Stop Speaking Backoff
              </Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {(settings.stopSpeakingBackoffSeconds ?? 1.0).toFixed(1)}s
              </span>
            </div>
            <Slider
              value={[settings.stopSpeakingBackoffSeconds ?? 1.0]}
              onValueChange={([v]) =>
                onChange({ stopSpeakingBackoffSeconds: v })
              }
              min={0.5}
              max={3.0}
              step={0.1}
              className="w-full"
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Call Limits */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Call Limits</Label>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">
              Silence Timeout
            </Label>
            <span className="text-xs text-muted-foreground tabular-nums">
              {settings.silenceTimeoutSeconds ?? 30}s
            </span>
          </div>
          <Slider
            value={[settings.silenceTimeoutSeconds ?? 30]}
            onValueChange={([v]) => onChange({ silenceTimeoutSeconds: v })}
            min={5}
            max={120}
            step={5}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>5s</span>
            <span>120s</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">
              Max Duration
            </Label>
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatDuration(settings.maxDurationSeconds ?? 600)}
            </span>
          </div>
          <Slider
            value={[settings.maxDurationSeconds ?? 600]}
            onValueChange={([v]) => onChange({ maxDurationSeconds: v })}
            min={60}
            max={3600}
            step={60}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>1m</span>
            <span>60m</span>
          </div>
        </div>
      </div>

      {/* Ambiance */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Ambiance</Label>

        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Background Sound
          </Label>
          <Select
            value={settings.backgroundSound ?? "off"}
            onValueChange={(val) => onChange({ backgroundSound: val })}
          >
            <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background/50">
              <SelectValue placeholder="Select sound" />
            </SelectTrigger>
            <SelectContent>
              {BACKGROUND_SOUNDS.map((sound) => (
                <SelectItem key={sound.id} value={sound.id} className="py-2">
                  {sound.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border/50 bg-background/50 px-4 py-3">
          <Label className="text-sm cursor-pointer" htmlFor="bg-denoising">
            Background Denoising
          </Label>
          <Switch
            id="bg-denoising"
            checked={settings.backgroundDenoisingEnabled ?? false}
            onCheckedChange={(checked) =>
              onChange({ backgroundDenoisingEnabled: checked })
            }
          />
        </div>
      </div>
    </div>
  );
}
