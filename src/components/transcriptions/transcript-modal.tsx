import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AudioPlayer } from "./audio-player";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { X, Search as SearchIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ToolCall {
  id: string;
  type: "function";
  function: { name: string; arguments: string };
}

interface Message {
  role: "assistant" | "user" | "system" | "tool";
  message?: string | null;
  timestamp: string;
  timeOffset?: number;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
  content?: string;
}

interface VapiCustomer {
  number: string;
  name?: string;
}

interface VapiAssistant {
  id: string;
  name?: string;
}

interface VapiCallDetails {
  id: string;
  assistantId?: string;
  assistant?: VapiAssistant;
  customer?: VapiCustomer;
  phoneNumber?: string;
  type?: string;
  status?: string;
  createdAt?: string;
  startedAt?: string;
  endedAt?: string;
  endedReason?: string;
  endedBy?: string;
  summary?: string;
  recordingUrl?: string;
  messages: Message[];
  duration?: number;
}

interface TranscriptModalProps {
  callId: string | null;
  isOpen: boolean;
  onClose: () => void;
  vapiApiKey: string;
  agents: {
    id: string;
    name: string;
    assistantId: string;
    workspace_id: string;
  }[];
}

const TranscriptModal: React.FC<TranscriptModalProps> = ({
  callId,
  isOpen,
  onClose,
  vapiApiKey,
  agents,
}) => {
  const [callDetails, setCallDetails] = useState<VapiCallDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);
  const [messageRefs, setMessageRefs] = useState<
    React.RefObject<HTMLDivElement>[]
  >([]);

  useEffect(() => {
    if (callDetails) {
      setMessageRefs(
        callDetails.messages.map(() => React.createRef<HTMLDivElement>()),
      );
    }
  }, [callDetails]);

  useEffect(() => {
    if (isOpen && callId && vapiApiKey) {
      const fetchTranscriptDetails = async () => {
        setIsLoading(true);
        setError(null);
        setCallDetails(null);
        try {
          const response = await fetch(`https://api.vapi.ai/call/${callId}`, {
            headers: { Authorization: `Bearer ${vapiApiKey}` },
          });
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({
              message: `HTTP error! status: ${response.status}`,
            }));
            throw new Error(
              errorData.message ||
                `Failed to fetch transcript details: ${response.statusText}`,
            );
          }
          const data: VapiCallDetails = await response.json();
          let cumulativeOffset = 0;
          const messages = data.messages || [];
          const messagesWithOffset = messages.map((msg, index, arr) => {
            let offsetForThisMessage = msg.timeOffset;
            if (offsetForThisMessage === undefined) {
              if (index > 0) {
                const prevTimestamp = new Date(
                  arr[index - 1].timestamp,
                ).getTime();
                const currentTimestamp = new Date(msg.timestamp).getTime();
                if (!isNaN(prevTimestamp) && !isNaN(currentTimestamp)) {
                  cumulativeOffset += (currentTimestamp - prevTimestamp) / 1000;
                }
              }
              offsetForThisMessage = cumulativeOffset;
            } else {
              cumulativeOffset = offsetForThisMessage;
            }
            return { ...msg, timeOffset: offsetForThisMessage };
          });
          setCallDetails({ ...data, messages: messagesWithOffset });
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "An unknown error occurred",
          );
        } finally {
          setIsLoading(false);
        }
      };
      fetchTranscriptDetails();
    } else if (!isOpen) {
      setCallDetails(null);
      setError(null);
      setIsLoading(false);
      setSearchTerm("");
    }
  }, [isOpen, callId, vapiApiKey]);

  useEffect(() => {
    if (!searchTerm && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "auto" });
    }
  }, [callDetails?.messages, searchTerm]);

  useEffect(() => {
    if (searchTerm && callDetails) {
      const firstMatchIndex = callDetails.messages.findIndex((msg) => {
        if (msg.role === "system") return false;
        const content = renderMessageContent(msg);
        return content.toLowerCase().includes(searchTerm.toLowerCase());
      });

      if (
        firstMatchIndex !== -1 &&
        messageRefs[firstMatchIndex] &&
        messageRefs[firstMatchIndex].current
      ) {
        messageRefs[firstMatchIndex].current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }
  }, [searchTerm, callDetails, messageRefs]);

  const getAgentNameById = (assistantId?: string) => {
    if (!assistantId && !callDetails?.assistant?.id) return "N/A";
    const idToFind = assistantId || callDetails?.assistant?.id;
    const agent = agents.find((a) => a.assistantId === idToFind);
    return agent ? agent.name : callDetails?.assistant?.name || "Unknown Agent";
  };

  const renderMessageContent = (msg: Message): string => {
    if (
      msg.role === "assistant" &&
      typeof msg.message === "object" &&
      msg.message !== null
    ) {
      // @ts-ignore
      if (msg.message.type === "function-call")
        return `Function Call: ${msg.message.functionCall.name}`;
      // @ts-ignore
      if (msg.message.type === "text") return msg.message.text;
      return JSON.stringify(msg.message);
    }
    return msg.message || msg.content || "";
  };

  const getHighlightedMessageContent = (
    text: string,
    highlight: string,
  ): React.ReactNode[] => {
    if (!highlight.trim() || !text) return [text];
    const regex = new RegExp(
      `(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi",
    );
    const parts = text.split(regex);
    return parts.map((part, index) =>
      regex.test(part) && part.toLowerCase() === highlight.toLowerCase() ? (
        <mark
          key={index}
          className="bg-yellow-200 dark:bg-yellow-500/70 text-black px-0.5 rounded-[3px]"
        >
          {part}
        </mark>
      ) : (
        part
      ),
    );
  };

  const formatDateForDetails = (isoString: string | undefined) => {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toString() === "Invalid Date"
      ? "N/A"
      : date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
  };

  const formatTimeInMinutes = (seconds: number | undefined) => {
    if (seconds === undefined || isNaN(seconds)) return "N/A";
    const m = Math.round(seconds / 60);
    return `${m} minute${m === 1 ? "" : "s"}`;
  };

  const handleMessageClick = (message: Message) => {
    if (message.timeOffset !== undefined && audioPlayerRef.current) {
      audioPlayerRef.current.currentTime = message.timeOffset;
      audioPlayerRef.current
        .play()
        .catch((e) => console.warn("Audio play failed:", e));
      audioPlayerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  };

  const customerName =
    callDetails?.customer?.name || callDetails?.customer?.number || "Caller";
  const agentName = getAgentNameById(callDetails?.assistantId);
  const agentInitial = agentName?.charAt(0).toUpperCase() || "A";

  if (!isOpen) return null;

  const filteredMessages =
    callDetails?.messages.filter((msg) => msg.role !== "system") || [];

  const renderMessagesElements = (messagesToRender: Message[]) => {
    // Log each message's role to help debug
    console.log(
      "Messages with roles:",
      messagesToRender.map((m) => ({
        role: m.role,
        content: renderMessageContent(m).substring(0, 50) + "...",
      })),
    );

    return messagesToRender.map((msg, i) => {
      const originalContent = renderMessageContent(msg);
      const highlightedContent = getHighlightedMessageContent(
        originalContent,
        searchTerm,
      );
      const messageKey = `${msg.timestamp}-${i}-${msg.role || "msg"}`;
      const originalIndex =
        callDetails?.messages.findIndex(
          (originalMsg) =>
            originalMsg.timestamp === msg.timestamp &&
            renderMessageContent(originalMsg) === originalContent,
        ) ?? -1;

      // Mix of strategies to detect agent vs human:
      // 1. Role check
      // 2. Position in array (odd vs even)
      // 3. Customer check

      let isAgent = false;

      // Determine speaker from role, fall back to alternating
      if (
        msg.role?.toLowerCase() === "assistant" ||
        msg.role?.toLowerCase() === "bot"
      ) {
        isAgent = true;
      } else if (msg.role?.toLowerCase() === "user") {
        isAgent = false;
      } else {
        // Fallback to alternating if role is missing
        isAgent = i % 2 === 0;
      }

      return (
        <div
          key={messageKey}
          ref={originalIndex !== -1 ? messageRefs[originalIndex] : undefined}
          className={`flex gap-2.5 mb-4 ${isAgent ? "items-start" : "items-end justify-end"}`}
          onClick={() => handleMessageClick(msg)}
        >
          {isAgent && (
            <Avatar className="h-6 w-6 text-xs flex-shrink-0">
              <AvatarFallback className="bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200">
                {agentInitial}
              </AvatarFallback>
            </Avatar>
          )}
          <div
            className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl shadow-sm cursor-pointer ${isAgent ? "bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none" : "bg-blue-500 text-white rounded-br-none"}`}
          >
            <p className="text-sm leading-snug">{highlightedContent}</p>
          </div>
        </div>
      );
    });
  };

  const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({
    label,
    value,
  }) => (
    <div className="flex justify-between items-baseline">
      <dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt>
      <dd className="text-sm text-slate-700 dark:text-slate-200 text-right">
        {value}
      </dd>
    </div>
  );

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(openState) => {
        if (!openState) onClose();
      }}
    >
      {/* Removed p-0 to allow default DialogContent padding, which should prevent X overlap */}
      <DialogContent className="max-w-4xl w-full sm:w-[calc(100%-3rem)] flex h-[calc(100vh-5rem)] max-h-[700px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden">
        {isLoading && (
          <div className="flex items-center justify-center h-full text-lg p-10">
            Loading...
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-full text-red-500 p-10 text-center">
            Error: {error}
          </div>
        )}

        {callDetails && !isLoading && !error && (
          <>
            {/* Left Column */}
            <div className="w-[320px] flex-shrink-0 bg-slate-50 dark:bg-slate-800/30 border-r border-slate-200 dark:border-slate-700 flex flex-col pt-3">
              {" "}
              {/* Added pt-3 to give space from top if DialogContent padding is not enough for X */}
              <div className="p-6 pb-4 pt-3">
                {" "}
                {/* Adjusted padding */}
                <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50 mb-1">
                  Call Transcript
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
                  Review call details, summary, and full transcript.
                </p>
                <Separator className="dark:bg-slate-700/60" />
              </div>
              <ScrollArea className="flex-1 px-6">
                <div className="space-y-6 pb-6">
                  <div>
                    <h3 className="text-md font-semibold mb-3 text-slate-800 dark:text-slate-100">
                      Call Details
                    </h3>
                    <dl className="space-y-2">
                      <DetailItem label="Agent" value={agentName} />
                      <DetailItem
                        label="Date"
                        value={formatDateForDetails(
                          callDetails.startedAt || callDetails.createdAt,
                        )}
                      />
                      <DetailItem
                        label="Time"
                        value={formatTimeInMinutes(callDetails.duration)}
                      />
                      <DetailItem
                        label="Type"
                        value={
                          callDetails.type
                            ? callDetails.type.replace(/([A-Z])/g, " $1").trim()
                            : "N/A"
                        }
                      />
                      {/* Add more details like Status if needed */}
                    </dl>
                  </div>

                  {callDetails.summary && (
                    <div>
                      <Separator className="dark:bg-slate-700/60 mb-5" />
                      <h3 className="text-md font-semibold mb-2 text-slate-800 dark:text-slate-100">
                        Summary
                      </h3>
                      <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                        <p className="whitespace-pre-wrap">
                          {callDetails.summary}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Right Column */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 overflow-hidden pt-3">
              {" "}
              {/* Added pt-3 */}
              <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700">
                {" "}
                {/* Adjusted padding */}
                <div className="relative">
                  <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <Input
                    placeholder="Search transcript" /* Shortened placeholder */
                    className="h-9 text-sm bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-full pl-10 pr-4 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <ScrollArea className="flex-1 px-5 pt-4 pb-5">
                {" "}
                {/* Adjusted padding */}
                <div className="space-y-4">
                  {renderMessagesElements(filteredMessages)}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              {callDetails.recordingUrl && (
                <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <div className="max-w-2xl mx-auto">
                    {/* Custom audio player */}
                    <AudioPlayer src={callDetails.recordingUrl} />
                    {/* Keep hidden audio element for message click functionality */}
                    <audio
                      ref={audioPlayerRef}
                      src={callDetails.recordingUrl}
                      className="hidden"
                    />
                  </div>
                </div>
              )}
            </div>
            {/* Default X button from DialogContent should be used. Ensure DialogContent has padding or the columns respect its position. */}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TranscriptModal;
