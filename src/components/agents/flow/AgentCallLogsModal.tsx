import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Agent } from '@/types/agent';
import CallLogListSidebar from './CallLogListSidebar';
import CallTranscriptView, { Message as TranscriptMessage } from './CallTranscriptView'; // Import Message type if needed by VoiceCall

// Types for VoiceCall
export interface VoiceCall {
  id: string;
  assistantId?: string; // Vapi's assistant_id
  createdAt: string;
  summary?: string;
  messages?: TranscriptMessage[]; // Use the exported Message type
  recordingUrl?: string;
  duration?: number;
  type?: string; // For call type e.g., "web_call", "phone_call"
  // Vapi specific fields that might be on the call object from the list
  assistant_id?: string;
  // Consider if customer/phone info is needed for list items too
}

interface AgentCallLogsModalProps {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
}

const AgentCallLogsModal: React.FC<AgentCallLogsModalProps> = ({ agent, isOpen, onClose }) => {
  const [calls, setCalls] = useState<VoiceCall[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [error, setError] = useState<string | null>(null);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [localDialogIsOpen, setLocalDialogIsOpen] = useState(isOpen);

  const vapiApiKey = import.meta.env.VITE_VAPI_API_KEY as string;

  useEffect(() => {
    setLocalDialogIsOpen(isOpen);
    if (isOpen && agent && agent.v_agent_id && vapiApiKey) {
      const fetchAgentCalls = async () => {
        setIsLoading(true);
        setError(null);
        setCalls([]); // Clear previous calls
        setSelectedCallId(null); // Clear selected call
        try {
          const response = await fetch('https://api.vapi.ai/call', {
            headers: { Authorization: `Bearer ${vapiApiKey}` },
          });
          if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ message: `Failed to fetch calls: ${response.status} ${response.statusText}` }));
            throw new Error(errorBody.message || `Failed to fetch calls: ${response.status} ${response.statusText}`);
          }
          const allCallsData: any[] = await response.json();
          const allCallsProcessed: VoiceCall[] = allCallsData.map((call: any) => ({
            ...call,
            assistantId: call.assistant_id || call.assistantId, // Normalize Vapi's assistant_id
            messages: call.messages || [], 
            recordingUrl: call.recordingUrl || call.recording_url,
            type: call.type, // Ensure 'type' is mapped
            // duration and summary should be spread by ...call if present
          }));
          
          const agentSpecificCalls = allCallsProcessed.filter(c => c.assistantId === agent.v_agent_id);
          setCalls(agentSpecificCalls);
          // Optionally select the first call by default
          // if (agentSpecificCalls.length > 0) {
          //   setSelectedCallId(agentSpecificCalls[0].id);
          // }

        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
          setError(`Failed to fetch call logs: ${errorMessage}`);
          console.error("Error fetching agent call logs:", err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchAgentCalls();
    } else if (!isOpen) {
      setCalls([]);
      setError(null);
      setIsLoading(true); // Reset loading state for next open
      setSelectedCallId(null);
    }
  }, [isOpen, agent, vapiApiKey]);

  const handleLocalDialogStateChange = (newOpenState: boolean) => {
    setLocalDialogIsOpen(newOpenState);
    if (!newOpenState) {
      setSelectedCallId(null); // Clear selection when modal closes
    }
    onClose(); 
  };
  
  useEffect(() => { // Sync prop with local state
    setLocalDialogIsOpen(isOpen);
  }, [isOpen]);

  const selectedCall = calls.find(call => call.id === selectedCallId);

  return (
    <Dialog open={localDialogIsOpen} onOpenChange={handleLocalDialogStateChange}>
      <DialogContent className="max-w-6xl w-[calc(100%-3rem)] h-[calc(100vh-5rem)] max-h-[800px] flex flex-row p-0 overflow-hidden">
        <DialogHeader className="hidden"> {/* Header can be part of the layout if needed, or removed for cleaner two-panel */}
          <DialogTitle>Call Logs for {agent?.name || 'Agent'}</DialogTitle>
          {agent && <DialogDescription>Viewing calls for agent: {agent.name}.</DialogDescription>}
        </DialogHeader>
        
        {/* Left Panel: Call List */}
        <div className="w-[300px] md:w-[350px] border-r dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col h-full">
          <div className="p-4 border-b dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Call History</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{agent?.name}</p>
          </div>
          {isLoading && (
            <div className="p-2 space-y-2 flex-1 overflow-y-auto">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-md" />)}
            </div>
          )}
          {error && !isLoading && (
            <div className="p-4 text-center text-red-500 flex-1 flex items-center justify-center">{error}</div>
          )}
          {!isLoading && !error && (
            <CallLogListSidebar
              calls={calls}
              selectedCallId={selectedCallId}
              onCallSelect={setSelectedCallId}
              agentName={agent?.name}
            />
          )}
        </div>

        {/* Right Panel: Transcript View */}
        <div className="flex-1 flex flex-col overflow-hidden h-full bg-white dark:bg-slate-900">
          <CallTranscriptView
            call={selectedCall}
            agentForTranscript={agent}
            vapiApiKey={vapiApiKey}
          />
        </div>
        
        {/* Footer can be removed if close is handled by Dialog's X button */}
        {/* <DialogFooter className="p-4 border-t dark:border-gray-700">
          <Button variant="outline" onClick={() => handleLocalDialogStateChange(false)}>Close</Button>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
};

export default AgentCallLogsModal;
