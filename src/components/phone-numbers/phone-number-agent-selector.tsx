import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bot } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

interface PhoneNumberAgentSelectorProps {
  workspaceId: string;
  selectedAgentId: string | null;
  onAgentChange: (agentId: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export const PhoneNumberAgentSelector = ({
  workspaceId,
  selectedAgentId,
  onAgentChange,
  placeholder = "Select an agent",
  disabled = false,
}: PhoneNumberAgentSelectorProps) => {
  const [agents, setAgents] = useState<Pick<Tables<"agents">, "id" | "name" | "role">[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAgents();
  }, [workspaceId]);

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from("agents")
        .select("id, name, role")
        .eq("workspace_id", workspaceId)
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error("Error fetching agents:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Select
      value={selectedAgentId || "none"}
      onValueChange={(value) => onAgentChange(value === "none" ? null : value)}
      disabled={disabled || loading}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder}>
          {selectedAgentId === null || selectedAgentId === "none" ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : (
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span>
                {agents.find((a) => a.id === selectedAgentId)?.name || "Unknown Agent"}
              </span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">
          <span className="text-muted-foreground">No agent assigned</span>
        </SelectItem>
        {agents.map((agent) => (
          <SelectItem key={agent.id} value={agent.id}>
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <div>
                <div className="font-medium">{agent.name}</div>
                <div className="text-xs text-muted-foreground">
                  {agent.role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </div>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
