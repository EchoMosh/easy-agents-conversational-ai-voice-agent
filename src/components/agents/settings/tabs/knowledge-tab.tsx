import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AgentSettingsState } from "@/components/agents/settings/types";

interface KnowledgeTabProps {
  settings: AgentSettingsState;
  onChange: (partial: Partial<AgentSettingsState>) => void;
  agentId: string;
  workspaceId: string;
}

export function KnowledgeTab({ settings, onChange }: KnowledgeTabProps) {
  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Knowledge Base Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Knowledge Base</Label>
        <Select
          value={settings.knowledgeBaseId ?? "none"}
          onValueChange={(id) =>
            onChange({ knowledgeBaseId: id === "none" ? undefined : id })
          }
        >
          <SelectTrigger className="h-11 rounded-xl border-border/50 bg-background/50 backdrop-blur-sm">
            <SelectValue placeholder="Select knowledge base" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none" className="py-2.5">
              None
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Info note */}
      <div className="rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm p-4">
        <p className="text-xs text-muted-foreground leading-relaxed">
          Knowledge bases let your agent reference uploaded documents during
          conversations. Manage your knowledge bases on the Knowledge Base page,
          then select one here.
        </p>
      </div>
    </div>
  );
}
