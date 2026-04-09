import { useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AgentSettingsState } from "@/components/agents/settings/types";
import { TRANSCRIBER_PROVIDERS } from "@/components/agents/settings/constants/transcriber-providers";

interface TranscriberTabProps {
  settings: AgentSettingsState;
  onChange: (partial: Partial<AgentSettingsState>) => void;
}

export function TranscriberTab({ settings, onChange }: TranscriberTabProps) {
  const provider = useMemo(
    () =>
      TRANSCRIBER_PROVIDERS.find((p) => p.id === settings.transcriberProvider),
    [settings.transcriberProvider],
  );

  const handleProviderChange = (providerId: string) => {
    const newProvider = TRANSCRIBER_PROVIDERS.find((p) => p.id === providerId);
    if (!newProvider) return;

    const firstModel = newProvider.models[0];
    onChange({
      transcriberProvider: providerId,
      transcriberModel: firstModel?.id ?? "",
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Transcriber Provider */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Transcriber Provider</Label>
        <Select
          value={settings.transcriberProvider}
          onValueChange={handleProviderChange}
        >
          <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background/50">
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            {TRANSCRIBER_PROVIDERS.map((p) => (
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

        {provider?.description && (
          <p className="text-xs text-muted-foreground leading-relaxed pl-1">
            {provider.description}
          </p>
        )}
      </div>

      {/* Model Selector */}
      {provider && provider.models.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">Model</Label>
          <Select
            value={settings.transcriberModel}
            onValueChange={(id) => onChange({ transcriberModel: id })}
          >
            <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background/50">
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {provider.models.map((model) => (
                <SelectItem key={model.id} value={model.id} className="py-2.5">
                  {model.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Info text */}
      <div className="rounded-xl border border-border/50 bg-background/50 p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          The transcriber converts caller speech to text in real-time. The
          default provider works well for most use cases. Only change this if
          you need specialized accuracy for a particular language or domain.
        </p>
      </div>
    </div>
  );
}
