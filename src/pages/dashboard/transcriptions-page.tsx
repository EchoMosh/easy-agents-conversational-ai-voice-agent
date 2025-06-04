import React, { useState, useEffect } from 'react';
import { useWorkspace } from '@/context/workspace-context';
import { supabase } from "@/integrations/supabase/client";
import CallList from '@/components/transcriptions/call-list';
import TranscriptModal from '@/components/transcriptions/transcript-modal';
import { Input } from "@/components/ui/input"; // Keep for now, might remove if fully replaced by Calendar
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// Placeholder for API utility functions
// import { fetchVapiCalls, fetchVapiCallDetails } from '@/utils/vapi-api';

// Types (can be moved to a separate types file if not already)
interface VoiceCall {
  id: string;
  assistantId?: string; // Voice service uses assistant_id, but we'll map to our agent
  createdAt: string; // ISO 8601 date string
  summary?: string;
  // Add other relevant fields from voice call object
}

interface Agent {
  id: string;
  name: string;
  assistantId: string; // Vapi assistant_id associated with this agent
  workspace_id: string;
}

// Message interface is defined in transcript-modal.tsx and is more specific there.
// Remove from here if not used directly in this component for other purposes.

const TranscriptionsPage: React.FC = () => {
  const { currentWorkspace } = useWorkspace(); // Get current workspace
  const [calls, setCalls] = useState<VoiceCall[]>([]);
  const [filteredCalls, setFilteredCalls] = useState<VoiceCall[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]); // Assuming we can fetch agents
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string | null>(null);
  const [dateRangeFilter, setDateRangeFilter] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCallIdForTranscript, setSelectedCallIdForTranscript] = useState<string | null>(null);
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);

  const vapiApiKey = import.meta.env.VITE_VAPI_API_KEY as string;

  useEffect(() => {
    const fetchAgentsForWorkspace = async () => {
      if (currentWorkspace && supabase) { // Use the imported supabase client
        try {
          const { data, error } = await supabase
            .from('agents')
            .select('id, name, v_agent_id, workspace_id')
            .eq('workspace_id', currentWorkspace.id)
            .not('v_agent_id', 'is', null);

          if (error) {
            console.error('Error fetching agents from Supabase:', error);
            setError(prevError => prevError ? `${prevError}\nFailed to fetch agents: ${error.message}` : `Failed to fetch agents: ${error.message}`);
            setAgents([]);
            return;
          }

          if (data) {
            const fetchedAgents: Agent[] = data.map((agent) => ({ // Add type for agent if available from Supabase types
              id: agent.id,
              name: agent.name,
              assistantId: agent.v_agent_id,
              workspace_id: agent.workspace_id,
            }));
            setAgents(fetchedAgents);
          }
        } catch (e: any) {
          console.error('Exception fetching agents:', e);
          setError(prevError => prevError ? `${prevError}\nException while fetching agents: ${e.message}` : `Exception while fetching agents: ${e.message}`);
          setAgents([]);
        }
      } else if (currentWorkspace && !supabase) {
        console.warn('Supabase client not available (import failed or not initialized). Cannot fetch agents.');
        setError(prevError => prevError ? `${prevError}\nSupabase client not available.` : 'Supabase client not available.');
        setAgents([]);
      }
    };

    fetchAgentsForWorkspace();
  }, [currentWorkspace]); // Dependency: currentWorkspace (supabase client is stable, typically)

  // Fetch all calls from voice service
  useEffect(() => {
    // Ensure this runs after agents might have been fetched, or in parallel if independent.
    // Current setup runs it in parallel.
    if (!vapiApiKey) {
      setError(prevError => prevError ? `${prevError}\nVoice API key is not configured.` : "Voice API key is not configured. Please set VITE_VAPI_API_KEY in your .env file.");
      setIsLoading(false);
      return;
    }

    const getCalls = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Voice service endpoint for listing calls
        const response = await fetch('https://api.vapi.ai/call', {
          headers: {
            Authorization: `Bearer ${vapiApiKey}`,
          },
        });
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({ message: `Failed to fetch calls: ${response.status} ${response.statusText}` }));
          throw new Error(errorBody.message || `Failed to fetch calls: ${response.status} ${response.statusText}`);
        }
        // Voice service returns an array of call objects directly.
        const data: VoiceCall[] = await response.json();
        // Ensure assistantId is mapped from assistant_id if voice service returns that
        const mappedData = data.map(call => ({
          ...call,
          assistantId: (call as any).assistant_id || call.assistantId,
        }));
        setCalls(mappedData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching calls.');
        console.error("Voice service call fetch error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    getCalls();

  }, [vapiApiKey]); // Add vapiApiKey to dependency array

  // Filter calls by workspace and other filters
  useEffect(() => {
    if (!currentWorkspace || agents.length === 0) {
      setFilteredCalls([]);
      return;
    }

    const workspaceAgentIds = agents
      .filter(agent => agent.workspace_id === currentWorkspace.id)
      .map(agent => agent.assistantId);

    let tempFilteredCalls = calls.filter(call =>
      call.assistantId && workspaceAgentIds.includes(call.assistantId)
    );

    // Apply agent filter
    if (selectedAgentFilter) {
      const selectedAgent = agents.find(agent => agent.id === selectedAgentFilter);
      if (selectedAgent) {
        tempFilteredCalls = tempFilteredCalls.filter(call => call.assistantId === selectedAgent.assistantId);
      }
    }

    // Apply date range filter
    if (dateRangeFilter.start && dateRangeFilter.end) {
      tempFilteredCalls = tempFilteredCalls.filter(call => {
        const callDate = new Date(call.createdAt);
        return callDate >= dateRangeFilter.start! && callDate <= dateRangeFilter.end!;
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

  if (!currentWorkspace) {
    return <div className="p-4 text-center text-muted-foreground">Please select a workspace to view transcriptions.</div>;
  }

  // Error for API key specifically
  if (!vapiApiKey) {
     return (
        <div className="p-4 md:p-6 text-center">
          <h1 className="text-2xl font-semibold mb-4 text-red-600">Configuration Error</h1>
          <p className="text-muted-foreground">
            The Vapi API key is not configured. Please ensure <code className="bg-muted px-1 py-0.5 rounded">VITE_VAPI_API_KEY</code> is set in your <code className="bg-muted px-1 py-0.5 rounded">.env</code> file.
          </p>
        </div>
      );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-6">
      <div> {/* Grouping title and subtitle */}
        <h1 className="text-3xl font-bold tracking-tight">Call Transcriptions</h1>
        {currentWorkspace?.name && <p className="text-muted-foreground text-sm">{currentWorkspace.name}</p>}
      </div>

      {/* Filters Section */}
      <div className="flex flex-col md:flex-row items-start md:items-end gap-4 pt-2 pb-4 border-b border-border"> {/* Added padding and border */}
        <div className="flex flex-col gap-1">
          <label htmlFor="agent-filter-select" className="text-sm font-medium text-muted-foreground">Filter by Agent</label>
          <Select
            value={selectedAgentFilter || "all"}
            onValueChange={(value) => setSelectedAgentFilter(value === "all" ? null : value)}
          >
            <SelectTrigger id="agent-filter-select" className="w-full md:w-64 bg-background">
              <SelectValue placeholder="All Agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {agents
                .filter(agent => currentWorkspace && agent.workspace_id === currentWorkspace.id)
                .map(agent => (
                  <SelectItem key={agent.id} value={agent.id}>
                    {agent.name}
                  </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-muted-foreground">Filter by Date Range</label>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full md:w-[180px] justify-start text-left font-normal bg-background",
                    !dateRangeFilter.start && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRangeFilter.start ? format(dateRangeFilter.start, "PPP") : <span>Pick start date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateRangeFilter.start || undefined}
                  onSelect={(date) => setDateRangeFilter(prev => ({ ...prev, start: date || null }))}
                  disabled={(date) =>
                    (dateRangeFilter.end && date > dateRangeFilter.end) || date > new Date()
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <span className="self-center text-sm text-muted-foreground">to</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full md:w-[180px] justify-start text-left font-normal bg-background",
                    !dateRangeFilter.end && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRangeFilter.end ? format(dateRangeFilter.end, "PPP") : <span>Pick end date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={dateRangeFilter.end || undefined}
                  onSelect={(date) => setDateRangeFilter(prev => ({ ...prev, end: date || null }))}
                  disabled={(date) =>
                    (dateRangeFilter.start && date < dateRangeFilter.start) || date > new Date()
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Call List Section - ScrollArea might be better inside CallList if list itself is long */}
      {/* For now, applying ScrollArea here if the overall content might overflow */}
      <ScrollArea className="h-[calc(100vh-300px)]"> {/* Adjust height as needed */}
        {isLoading && !error && (
            // TODO: Implement Skeleton loaders here
            <div className="text-center p-10 text-muted-foreground">Loading calls...</div>
        )}
        {error && !isLoading && (
            <div className="text-center p-10 text-red-500">Error: {error}</div>
        )}
        {!isLoading && !error && filteredCalls.length > 0 && (
          <CallList
            calls={filteredCalls}
            agents={agents}
            onViewTranscript={handleViewTranscript}
            // isLoading prop for CallList might not be needed if page handles global loading
          />
        )}
        {!isLoading && !error && filteredCalls.length === 0 && (
          <div className="text-center text-muted-foreground mt-10 py-10 border border-dashed rounded-lg">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3 text-gray-400"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
            <h3 className="text-xl font-semibold">No Transcripts Found</h3>
            <p className="text-sm">No calls match your current filters.</p>
            <p className="text-xs mt-1">Try adjusting the agent or date range.</p>
          </div>
        )}
      </ScrollArea>
      
      {/* TODO: Pagination or Infinite Scroll */}

      {isTranscriptModalOpen && selectedCallIdForTranscript && vapiApiKey && (
        <TranscriptModal
          callId={selectedCallIdForTranscript}
          isOpen={isTranscriptModalOpen}
          onClose={handleCloseTranscriptModal}
          vapiApiKey={vapiApiKey}
          agents={agents} // Pass the agents array
        />
      )}
    </div>
  );
};

export default TranscriptionsPage;
