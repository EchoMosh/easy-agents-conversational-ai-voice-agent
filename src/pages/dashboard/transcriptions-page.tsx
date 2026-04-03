import React, { useState, useEffect } from "react";
import { useWorkspace } from "@/context/workspace-context";
import { supabase } from "@/integrations/supabase/client";
import CallList, {
  CallListSkeleton,
} from "@/components/transcriptions/call-list";
import TranscriptModal from "@/components/transcriptions/transcript-modal";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, FileText, X } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface VoiceCall {
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

const TranscriptionsPage: React.FC = () => {
  const { currentWorkspace } = useWorkspace();
  const [calls, setCalls] = useState<VoiceCall[]>([]);
  const [filteredCalls, setFilteredCalls] = useState<VoiceCall[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isAgentsLoading, setIsAgentsLoading] = useState(true);
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string | null>(
    null,
  );
  const [dateRangeFilter, setDateRangeFilter] = useState<{
    start: Date | null;
    end: Date | null;
  }>({ start: null, end: null });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCallIdForTranscript, setSelectedCallIdForTranscript] =
    useState<string | null>(null);
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);

  const vapiApiKey = import.meta.env.VITE_VAPI_API_KEY as string;

  useEffect(() => {
    const fetchAgentsForWorkspace = async () => {
      if (currentWorkspace && supabase) {
        try {
          const { data, error } = await supabase
            .from("agents")
            .select("id, name, v_agent_id, workspace_id")
            .eq("workspace_id", currentWorkspace.id)
            .not("v_agent_id", "is", null);

          if (error) {
            console.error("Error fetching agents from Supabase:", error);
            setError((prevError) =>
              prevError
                ? `${prevError}\nFailed to fetch agents: ${error.message}`
                : `Failed to fetch agents: ${error.message}`,
            );
            setAgents([]);
            return;
          }

          if (data) {
            const fetchedAgents: Agent[] = data.map((agent) => ({
              id: agent.id,
              name: agent.name,
              assistantId: agent.v_agent_id,
              workspace_id: agent.workspace_id,
            }));
            setAgents(fetchedAgents);
          }
        } catch (e: any) {
          console.error("Exception fetching agents:", e);
          setError((prevError) =>
            prevError
              ? `${prevError}\nException while fetching agents: ${e.message}`
              : `Exception while fetching agents: ${e.message}`,
          );
          setAgents([]);
        } finally {
          setIsAgentsLoading(false);
        }
      } else if (currentWorkspace && !supabase) {
        console.warn("Supabase client not available. Cannot fetch agents.");
        setError((prevError) =>
          prevError
            ? `${prevError}\nSupabase client not available.`
            : "Supabase client not available.",
        );
        setAgents([]);
      }
    };

    fetchAgentsForWorkspace();
  }, [currentWorkspace]);

  useEffect(() => {
    if (!vapiApiKey) {
      setError((prevError) =>
        prevError
          ? `${prevError}\nVoice API key is not configured.`
          : "Voice API key is not configured. Please check your environment setup.",
      );
      setIsLoading(false);
      return;
    }

    const getCalls = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("https://api.vapi.ai/call", {
          headers: {
            Authorization: `Bearer ${vapiApiKey}`,
          },
        });
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({
            message: `Failed to fetch calls: ${response.status} ${response.statusText}`,
          }));
          throw new Error(
            errorBody.message ||
              `Failed to fetch calls: ${response.status} ${response.statusText}`,
          );
        }
        const data: VoiceCall[] = await response.json();
        const mappedData = data.map((call) => ({
          ...call,
          assistantId: (call as any).assistant_id || call.assistantId,
        }));
        setCalls(mappedData);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "An unknown error occurred while fetching calls.",
        );
        console.error("Voice service call fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    getCalls();
  }, [vapiApiKey]);

  useEffect(() => {
    if (!currentWorkspace || agents.length === 0) {
      setFilteredCalls([]);
      return;
    }

    const workspaceAgentIds = agents
      .filter((agent) => agent.workspace_id === currentWorkspace.id)
      .map((agent) => agent.assistantId);

    let tempFilteredCalls = calls.filter(
      (call) =>
        call.assistantId && workspaceAgentIds.includes(call.assistantId),
    );

    if (selectedAgentFilter) {
      const selectedAgent = agents.find(
        (agent) => agent.id === selectedAgentFilter,
      );
      if (selectedAgent) {
        tempFilteredCalls = tempFilteredCalls.filter(
          (call) => call.assistantId === selectedAgent.assistantId,
        );
      }
    }

    if (dateRangeFilter.start && dateRangeFilter.end) {
      tempFilteredCalls = tempFilteredCalls.filter((call) => {
        const callDate = new Date(call.createdAt);
        return (
          callDate >= dateRangeFilter.start! && callDate <= dateRangeFilter.end!
        );
      });
    }

    setFilteredCalls(tempFilteredCalls);
  }, [calls, agents, currentWorkspace, selectedAgentFilter, dateRangeFilter]);

  const handleViewTranscript = (callId: string) => {
    setSelectedCallIdForTranscript(callId);
    setIsTranscriptModalOpen(true);
  };

  const handleCloseTranscriptModal = () => {
    setIsTranscriptModalOpen(false);
    setSelectedCallIdForTranscript(null);
  };

  const hasActiveFilters =
    selectedAgentFilter !== null ||
    dateRangeFilter.start !== null ||
    dateRangeFilter.end !== null;

  const clearFilters = () => {
    setSelectedAgentFilter(null);
    setDateRangeFilter({ start: null, end: null });
  };

  if (!currentWorkspace) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Please select a workspace to view transcriptions.
      </div>
    );
  }

  if (!vapiApiKey) {
    return (
      <div className="p-4 md:p-6 text-center">
        <h1 className="text-2xl font-semibold mb-4 text-destructive">
          Configuration Error
        </h1>
        <p className="text-muted-foreground">
          The voice service API key is not configured. Please check your
          environment setup.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Page header */}
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        Transcriptions
      </h1>

      {/* Compact inline filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Select
          value={selectedAgentFilter || "all"}
          onValueChange={(value) =>
            setSelectedAgentFilter(value === "all" ? null : value)
          }
        >
          <SelectTrigger className="w-48 h-9 text-sm bg-background">
            <SelectValue placeholder="All Agents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Agents</SelectItem>
            {agents
              .filter(
                (agent) =>
                  currentWorkspace &&
                  agent.workspace_id === currentWorkspace.id,
              )
              .map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 justify-start text-left font-normal",
                !dateRangeFilter.start && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
              {dateRangeFilter.start
                ? format(dateRangeFilter.start, "MMM d, yyyy")
                : "Start date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRangeFilter.start || undefined}
              onSelect={(date) =>
                setDateRangeFilter((prev) => ({ ...prev, start: date || null }))
              }
              disabled={(date) =>
                (dateRangeFilter.end ? date > dateRangeFilter.end : false) ||
                date > new Date()
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <span className="text-sm text-muted-foreground">to</span>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "h-9 justify-start text-left font-normal",
                !dateRangeFilter.end && "text-muted-foreground",
              )}
            >
              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
              {dateRangeFilter.end
                ? format(dateRangeFilter.end, "MMM d, yyyy")
                : "End date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRangeFilter.end || undefined}
              onSelect={(date) =>
                setDateRangeFilter((prev) => ({ ...prev, end: date || null }))
              }
              disabled={(date) =>
                (dateRangeFilter.start
                  ? date < dateRangeFilter.start
                  : false) || date > new Date()
              }
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-muted-foreground hover:text-foreground"
            onClick={clearFilters}
          >
            <X className="mr-1 h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Call list */}
      <ScrollArea className="h-[calc(100vh-280px)]">
        {(isLoading || isAgentsLoading) && !error && <CallListSkeleton />}

        {error && !isLoading && !isAgentsLoading && (
          <div className="text-center p-10 text-destructive text-sm">
            {error}
          </div>
        )}

        {!isLoading &&
          !isAgentsLoading &&
          !error &&
          filteredCalls.length > 0 && (
            <CallList
              calls={filteredCalls}
              agents={agents}
              onViewTranscript={handleViewTranscript}
            />
          )}

        {!isLoading &&
          !isAgentsLoading &&
          !error &&
          filteredCalls.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <h3 className="text-base font-medium text-foreground">
                No transcripts found
              </h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                {hasActiveFilters
                  ? "No calls match your current filters. Try adjusting the agent or date range."
                  : "There are no call transcriptions for this workspace yet."}
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={clearFilters}
                >
                  Clear filters
                </Button>
              )}
            </div>
          )}
      </ScrollArea>

      {isTranscriptModalOpen && selectedCallIdForTranscript && vapiApiKey && (
        <TranscriptModal
          callId={selectedCallIdForTranscript}
          isOpen={isTranscriptModalOpen}
          onClose={handleCloseTranscriptModal}
          vapiApiKey={vapiApiKey}
          agents={agents}
        />
      )}
    </div>
  );
};

export default TranscriptionsPage;
