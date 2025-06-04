import React, { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { X, Search as SearchIcon } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AudioPlayer } from '@/components/transcriptions/audio-player'; // Assuming path
import { VoiceCall } from './AgentCallLogsModal'; // Reusing the exported type
import { Agent } from '@/types/agent'; // For agent name mapping

// Copied and adapted from TranscriptModal.tsx
interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string; };
}

export interface Message { // Exporting for potential use if needed by parent
  role: 'assistant' | 'user' | 'system' | 'tool';
  message?: string | null;
  timestamp: string;
  timeOffset?: number;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
  content?: string; // Vapi sometimes uses 'content' for tool messages
}

// Simplified VapiCallDetails for this view, as we get the selected call object
// The parent (AgentCallLogsModal) will fetch the full call list.
// If a call object from that list doesn't have full messages, we might need to fetch them here.
// For now, assume 'call' prop has 'messages'.
interface CallTranscriptViewProps {
  call: VoiceCall | null; // The selected call object
  agentForTranscript: Agent | null; // The agent associated with this log session
  vapiApiKey: string; // Needed if we have to fetch full details or for audio player if it uses it
}

const CallTranscriptView: React.FC<CallTranscriptViewProps> = ({ call, agentForTranscript, vapiApiKey }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const [messageRefs, setMessageRefs] = useState<React.RefObject<HTMLDivElement>[]>([]);
  
  // Local state for detailed messages if we need to fetch them separately
  const [detailedMessages, setDetailedMessages] = useState<Message[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailError, setDetailError] = useState<string|null>(null);

  useEffect(() => {
    if (call?.messages && Array.isArray(call.messages)) {
      setDetailedMessages(call.messages as Message[]); // Assuming messages are already on the call object
      setMessageRefs((call.messages as Message[]).map(() => React.createRef<HTMLDivElement>()));
    } else if (call && !call.messages && vapiApiKey) {
      // If messages are not on the call object, fetch them (example from TranscriptModal)
      // This might be needed if the initial call list is just summaries
      const fetchFullCallDetails = async () => {
        setIsLoadingDetails(true);
        setDetailError(null);
        try {
          const response = await fetch(`https://api.vapi.ai/call/${call.id}`, {
            headers: { Authorization: `Bearer ${vapiApiKey}` },
          });
          if (!response.ok) throw new Error('Failed to fetch call details');
          const data = await response.json();
          setDetailedMessages(data.messages || []);
          setMessageRefs((data.messages || []).map(() => React.createRef<HTMLDivElement>()));
        } catch (e) {
          setDetailError(e instanceof Error ? e.message : 'Unknown error fetching details');
        } finally {
          setIsLoadingDetails(false);
        }
      };
      // fetchFullCallDetails(); // Uncomment if needed
      // For now, assume messages are part of the 'call' prop from the list.
      // If not, this fetching logic needs to be robustly implemented.
      // For this iteration, we'll assume `call.messages` is populated.
       setDetailedMessages((call as any)?.messages || []); // Cast to any if messages prop is not on VoiceCall
       setMessageRefs(((call as any)?.messages || []).map(() => React.createRef<HTMLDivElement>()));

    } else {
      setDetailedMessages([]);
      setMessageRefs([]);
    }
  }, [call, vapiApiKey]);


  useEffect(() => {
    if (!searchTerm && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [detailedMessages, searchTerm]);
  
  useEffect(() => {
    if (searchTerm && detailedMessages.length > 0) {
      const firstMatchIndex = detailedMessages.findIndex(msg => {
        if (msg.role === 'system') return false;
        const content = renderMessageContent(msg);
        return content.toLowerCase().includes(searchTerm.toLowerCase());
      });

      if (firstMatchIndex !== -1 && messageRefs[firstMatchIndex] && messageRefs[firstMatchIndex].current) {
        messageRefs[firstMatchIndex].current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [searchTerm, detailedMessages, messageRefs]);

  const renderMessageContent = (msg: Message): string => {
    // Simplified from TranscriptModal, adapt as needed
    return msg.message || msg.content || (msg.tool_calls ? `Tool Call: ${msg.tool_calls[0]?.function?.name}` : '');
  };

  const getHighlightedMessageContent = (text: string, highlight: string): React.ReactNode[] => {
    if (!highlight.trim() || !text) return [text];
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) && part.toLowerCase() === highlight.toLowerCase() ?
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-500/70 text-black px-0.5 rounded-[3px]">{part}</mark>
       : part
    );
  };
  
  const handleMessageClick = (message: Message) => {
    if (message.timeOffset !== undefined && audioPlayerRef.current && call?.recordingUrl) {
      audioPlayerRef.current.currentTime = message.timeOffset;
      audioPlayerRef.current.play().catch(e => console.warn("Audio play failed:", e));
    }
  };

  if (!call) {
    return <div className="flex-1 flex items-center justify-center p-6 text-gray-500 dark:text-gray-400">Select a call to view details.</div>;
  }
  
  if (isLoadingDetails) {
     return <div className="flex-1 flex items-center justify-center p-6 text-gray-500 dark:text-gray-400">Loading transcript details...</div>;
  }
  if (detailError) {
     return <div className="flex-1 flex items-center justify-center p-6 text-red-500">Error: {detailError}</div>;
  }

  const agentName = agentForTranscript?.name || 'Agent';
  const agentInitial = agentName.charAt(0).toUpperCase() || 'A';
  // const customerName = 'Caller'; // Placeholder, adapt if customer info is in VoiceCall

  const formatDuration = (seconds?: number): string => {
    if (seconds === undefined || isNaN(seconds)) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  const formatDate = (isoString?: string): string => {
    if (!isoString) return "N/A";
    try {
      return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return "Invalid Date";
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden h-full">
      {/* Search Bar Section - Styled to match screenshot */}
      <div className="px-4 py-6 border-b border-gray-200 dark:border-gray-700"> {/* Increased py to py-6 for more vertical spacing */}
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search transcript"
            className="h-10 text-sm bg-gray-100 dark:bg-gray-800 border-transparent rounded-full pl-10 pr-4 w-full focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {/* Removed explicit clear button to match screenshot's simpler search input */}
        </div>
      </div>

      {/* Call Summary Card REMOVED */}

      <ScrollArea className="flex-1 px-5 pt-4 pb-5">
        <div className="space-y-4">
          {detailedMessages.filter(msg => msg.role !== 'system').map((msg, i) => {
            const originalContent = renderMessageContent(msg);
            const highlightedContent = getHighlightedMessageContent(originalContent, searchTerm);
            const messageKey = `${msg.timestamp}-${i}-${msg.role || 'msg'}`;
            
            // Determine if the message is from the user or the agent
            const isUserMessage = msg.role?.toLowerCase() === 'user';

            return (
              <div
                key={messageKey}
                ref={messageRefs[i]} // Assuming messageRefs aligns with detailedMessages
                // If it's a user message, align to end (right); otherwise, align to start (left for agent)
                className={`flex gap-2.5 mb-4 ${isUserMessage ? "items-end justify-end" : "items-start"}`}
                onClick={() => handleMessageClick(msg)}
              >
                {!isUserMessage && ( // Agent's avatar on the left
                  <Avatar className="h-6 w-6 text-xs flex-shrink-0">
                    <AvatarFallback className="bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200">
                      {agentInitial}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl shadow-sm cursor-pointer ${
                  isUserMessage 
                    ? 'bg-blue-500 text-white rounded-br-none' // User style (blue)
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none' // Agent style (gray)
                }`}>
                  <p className="text-sm leading-snug">{highlightedContent}</p>
                </div>
                {isUserMessage && ( // User's avatar on the right
                   <Avatar className="h-6 w-6 text-xs flex-shrink-0">
                    <AvatarFallback className="bg-blue-500 text-white">
                      {'C'} {/* Placeholder for Caller/User */}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {call.recordingUrl && (
        <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700"> {/* Adjusted padding and removed background */}
          {/* Display the custom AudioPlayer component */}
          <AudioPlayer src={call.recordingUrl} />
          {/* Hidden HTML audio element for programmatic control (e.g., seeking via message click) */}
          <audio ref={audioPlayerRef} src={call.recordingUrl} className="hidden" />
        </div>
      )}
    </div>
  );
};

export default CallTranscriptView;
