import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, Clock, ArrowRight } from "lucide-react";

interface VapiCall {
  id: string;
  assistantId?: string;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  status?: string;
  duration?: number;
  summary?: string;
}

interface Agent {
  id: string;
  name: string;
  assistantId: string;
  workspace_id: string;
}

interface CallListProps {
  calls: VapiCall[];
  agents: Agent[];
  onViewTranscript: (callId: string) => void;
  isLoading?: boolean;
}

function getStatusVariant(
  status?: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status?.toLowerCase()) {
    case "ended":
      return "secondary";
    case "in-progress":
    case "ringing":
    case "queued":
      return "default";
    case "failed":
    case "no-answer":
    case "busy":
      return "destructive";
    default:
      return "outline";
  }
}

function getStatusLabel(status?: string): string {
  if (!status) return "Unknown";
  return status
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDuration(seconds?: number): string {
  if (seconds === undefined || isNaN(seconds)) return "--";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.round(seconds % 60);
  return remaining > 0 ? `${minutes}m ${remaining}s` : `${minutes}m`;
}

function formatCallDate(dateString: string): { date: string; time: string } {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return { date: "Unknown", time: "" };
  return {
    date: d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
  };
}

export function CallListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="bg-card">
          <CardContent className="flex items-center gap-4 py-4">
            <Skeleton className="h-9 w-9 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-8 w-28 rounded-md" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const CallList: React.FC<CallListProps> = ({
  calls,
  agents,
  onViewTranscript,
}) => {
  if (calls.length === 0) {
    return null;
  }

  const getAgentName = (assistantId?: string) => {
    if (!assistantId) return "Unknown Agent";
    const agent = agents.find((a) => a.assistantId === assistantId);
    return agent ? agent.name : "Unknown Agent";
  };

  return (
    <div className="space-y-3">
      {calls.map((call) => {
        const agentName = getAgentName(call.assistantId);
        const agentInitial = agentName.charAt(0).toUpperCase();
        const { date, time } = formatCallDate(call.startedAt || call.createdAt);
        const duration = formatDuration(call.duration);

        return (
          <Card
            key={call.id}
            className="bg-card border border-border hover:border-muted-foreground/25 transition-colors"
          >
            <CardContent className="flex items-center gap-4 py-4">
              {/* Agent avatar */}
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-muted text-muted-foreground text-sm font-medium">
                  {agentInitial}
                </AvatarFallback>
              </Avatar>

              {/* Agent info + summary */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground truncate">
                    {agentName}
                  </p>
                  <Badge
                    variant={getStatusVariant(call.status)}
                    className="shrink-0 text-[11px]"
                  >
                    {getStatusLabel(call.status)}
                  </Badge>
                </div>
                {call.summary ? (
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                    {call.summary}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground/60 mt-0.5 italic">
                    No summary available
                  </p>
                )}
              </div>

              {/* Meta: date, time, duration */}
              <div className="hidden sm:flex items-center gap-4 shrink-0 text-muted-foreground">
                <div className="flex items-center gap-1.5 text-xs">
                  <Phone className="h-3.5 w-3.5" />
                  <span>{date}</span>
                  {time && (
                    <span className="text-muted-foreground/60">{time}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{duration}</span>
                </div>
              </div>

              {/* View button */}
              <Button
                variant="ghost"
                size="sm"
                className="shrink-0 text-muted-foreground hover:text-foreground"
                onClick={() => onViewTranscript(call.id)}
              >
                View
                <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default CallList;
