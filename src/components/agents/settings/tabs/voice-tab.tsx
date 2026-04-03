import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { AgentSettingsState } from "@/components/agents/settings/types";
import {
  VOICE_PROVIDERS,
  getProvider,
} from "@/components/agents/settings/constants/voice-providers";

interface VoiceTabProps {
  settings: AgentSettingsState;
  onChange: (partial: Partial<AgentSettingsState>) => void;
}

const LANGUAGES = [
  { id: "en", name: "English" },
  { id: "zh", name: "Chinese" },
  { id: "es", name: "Spanish" },
  { id: "hi", name: "Hindi" },
  { id: "pt", name: "Portuguese" },
  { id: "fr", name: "French" },
  { id: "de", name: "German" },
  { id: "ja", name: "Japanese" },
  { id: "ar", name: "Arabic" },
  { id: "ko", name: "Korean" },
  { id: "id", name: "Indonesian" },
  { id: "it", name: "Italian" },
  { id: "nl", name: "Dutch" },
  { id: "tr", name: "Turkish" },
  { id: "pl", name: "Polish" },
  { id: "ru", name: "Russian" },
  { id: "sv", name: "Swedish" },
  { id: "ms", name: "Malay" },
  { id: "ro", name: "Romanian" },
  { id: "uk", name: "Ukrainian" },
  { id: "el", name: "Greek" },
  { id: "cs", name: "Czech" },
  { id: "da", name: "Danish" },
  { id: "fi", name: "Finnish" },
  { id: "bg", name: "Bulgarian" },
  { id: "hr", name: "Croatian" },
  { id: "sk", name: "Slovak" },
  { id: "ta", name: "Tamil" },
  { id: "vi", name: "Vietnamese" },
  { id: "no", name: "Norwegian" },
  { id: "hu", name: "Hungarian" },
  { id: "pt-br", name: "Portuguese (Brazil)" },
];

export function VoiceTab({ settings, onChange }: VoiceTabProps) {
  const provider = useMemo(
    () => getProvider(settings.voiceProvider),
    [settings.voiceProvider],
  );

  const handleProviderChange = (providerId: string) => {
    const newProvider = getProvider(providerId);
    if (!newProvider) return;

    const firstVoice = newProvider.voices[0];
    const firstModel = newProvider.models?.[0];

    onChange({
      voiceProvider: providerId,
      voiceId: firstVoice?.id ?? "",
      voiceModel: firstModel?.id ?? "",
      voiceSpeed: 1.0,
      voiceStability: 0.5,
      voiceSimilarityBoost: 0.75,
      voiceEmotions: [],
      voiceStylePrompt: "",
    });
  };

  if (!provider) return null;

  const hasModels = provider.models && provider.models.length > 0;
  const selectedEmotions = settings.voiceEmotions ?? [];

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Voice Provider */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Voice Provider</Label>
        <Select
          value={settings.voiceProvider}
          onValueChange={handleProviderChange}
        >
          <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background/50 backdrop-blur-sm">
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            {VOICE_PROVIDERS.map((p) => (
              <SelectItem key={p.id} value={p.id} className="py-2.5">
                <span className="flex items-center gap-2">
                  <span>{p.name}</span>
                  {p.id === "vapi" ? (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      Free
                    </Badge>
                  ) : (
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

      {/* Voice Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Voice</Label>
        <Select
          value={settings.voiceId}
          onValueChange={(id) => onChange({ voiceId: id })}
        >
          <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background/50 backdrop-blur-sm">
            <SelectValue placeholder="Select voice" />
          </SelectTrigger>
          <SelectContent>
            {provider.voices.map((voice) => (
              <SelectItem key={voice.id} value={voice.id} className="py-2.5">
                <span className="flex items-center gap-2">
                  <span>{voice.name}</span>
                  {voice.gender && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] px-1.5 py-0",
                        voice.gender === "female"
                          ? "border-pink-400/50 text-pink-500"
                          : "border-blue-400/50 text-blue-500",
                      )}
                    >
                      {voice.gender}
                    </Badge>
                  )}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Model Selector */}
      {hasModels && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Model</Label>
          <Select
            value={settings.voiceModel}
            onValueChange={(id) => onChange({ voiceModel: id })}
          >
            <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background/50 backdrop-blur-sm">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {provider.models?.map((model) => (
                <SelectItem key={model.id} value={model.id} className="py-2.5">
                  <span className="flex items-center gap-2">
                    <span>{model.name}</span>
                    {model.latency && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 text-muted-foreground"
                      >
                        {model.latency}
                      </Badge>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Speed Slider */}
      {provider.supportsSpeed && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Speed</Label>
            <span className="text-xs text-muted-foreground tabular-nums">
              {settings.voiceSpeed?.toFixed(1) ?? "1.0"}x
            </span>
          </div>
          <Slider
            value={[settings.voiceSpeed ?? 1.0]}
            onValueChange={([v]) => onChange({ voiceSpeed: v })}
            min={0.5}
            max={2.0}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0.5x</span>
            <span>2.0x</span>
          </div>
        </div>
      )}

      {/* Stability Slider (ElevenLabs) */}
      {provider.supportsStability && (
        <>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Stability</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {(settings.voiceStability ?? 0.5).toFixed(2)}
              </span>
            </div>
            <Slider
              value={[settings.voiceStability ?? 0.5]}
              onValueChange={([v]) => onChange({ voiceStability: v })}
              min={0}
              max={1}
              step={0.01}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Variable</span>
              <span>Stable</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Similarity Boost</Label>
              <span className="text-xs text-muted-foreground tabular-nums">
                {(settings.voiceSimilarityBoost ?? 0.75).toFixed(2)}
              </span>
            </div>
            <Slider
              value={[settings.voiceSimilarityBoost ?? 0.75]}
              onValueChange={([v]) => onChange({ voiceSimilarityBoost: v })}
              min={0}
              max={1}
              step={0.01}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        </>
      )}

      {/* Emotion Multi-Select (Cartesia / PlayHT) */}
      {provider.supportsEmotion && provider.emotions && (
        <div className="space-y-3">
          <Label className="text-sm font-medium">Emotions</Label>
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm p-3">
            {provider.emotions.map((emotion) => {
              const checked = selectedEmotions.includes(emotion);
              return (
                <label
                  key={emotion}
                  className="flex items-center gap-2 cursor-pointer text-sm"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(isChecked) => {
                      const next = isChecked
                        ? [...selectedEmotions, emotion]
                        : selectedEmotions.filter((e) => e !== emotion);
                      onChange({ voiceEmotions: next });
                    }}
                  />
                  <span className="capitalize">{emotion}</span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Style Prompt (OpenAI) */}
      {provider.supportsStylePrompt && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Style Prompt</Label>
          <Textarea
            value={settings.voiceStylePrompt ?? ""}
            onChange={(e) => onChange({ voiceStylePrompt: e.target.value })}
            placeholder="Describe how the voice should sound..."
            className="min-h-[80px] rounded-xl border-border/50 bg-background/50 backdrop-blur-sm resize-none"
          />
        </div>
      )}

      {/* Language Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Language</Label>
        <Select
          value={settings.language ?? "en"}
          onValueChange={(lang) => onChange({ language: lang })}
        >
          <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background/50 backdrop-blur-sm">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {LANGUAGES.map((lang) => (
              <SelectItem key={lang.id} value={lang.id} className="py-2">
                {lang.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
