import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  PhoneCall,
  PhoneOff,
  X,
  Mic,
  MicOff,
  Volume2,
  RefreshCw,
} from "lucide-react"; // Removed Settings, Added MicOff
import { Agent } from "@/types/agent";
import Vapi from "@vapi-ai/web";
// import axios from "axios"; // No longer needed here
// import { supabase } from "@/integrations/supabase/client"; // No longer needed here

// Define message types
interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
  isFinal?: boolean;
}

interface AgentVoiceCallProps {
  agent: Agent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  firstMessageNode?: string; // Optional prop for the first message from the flow
}

// Interface for the agent update payload
interface AgentUpdatePayload {
  conversation_config: {
    agent: {
      first_message: string;
      prompt: {
        prompt: string;
        llm: string;
      };
      language: string;
    };
    tts: {
      voice_id: string;
      optimize_streaming_latency: number;
    };
    conversation: {
      max_duration_seconds: number;
    };
    turn: {
      turn_timeout: number;
      mode: string;
    };
  };
}

export function AgentVoiceCall({
  agent,
  open,
  onOpenChange: parentOnOpenChange, // Renamed to avoid conflict with Dialog's prop
  firstMessageNode = "Hi there! I'm here to help you today.", // Default first message if none provided
}: AgentVoiceCallProps) {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [callStatus, setCallStatus] = useState<
    "ready" | "connecting" | "active" | "ended" | "error" | "retrying"
  >("ready"); // Removed "updating"
  const [isMuted, setIsMuted] = useState(false); // Added for mute functionality
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const vapiRef = useRef<Vapi | null>(null);
  const currentAgentMessageIdRef = useRef<string | null>(null);
  const preSpeechAssistantTextRef = useRef<string | null>(null); // Buffer for assistant text arriving before speech-start
  const preSpeechTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Timeout for flushing buffered text

  // Effect to scroll to bottom of messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleInternalDialogStateChange = (newOpenState: boolean) => {
    if (!newOpenState) {
      // If dialog is requesting to be closed
      console.log("Dialog requesting to close. Stopping call if active.");
      if (isCallActive && vapiRef.current) {
        try {
          console.log("Stopping voice call due to dialog close request.");
          vapiRef.current.stop();
          setIsCallActive(false); // Mark as stopped to prevent resetState from trying again
        } catch (e) {
          console.error(
            "Error stopping voice call on dialog close request:",
            e,
          );
        }
      }
    }
    parentOnOpenChange(newOpenState); // Propagate to parent to actually change the 'open' prop
  };

  // Initialize Vapi when component mounts and handle cleanup
  useEffect(() => {
    if (open) {
      if (!vapiRef.current) {
        console.log(
          "AgentVoiceCall: Dialog opened, initializing voice service.",
        );
        initializeVapi();
        // Agent update logic is now handled in TestAgentDialog
      } else {
        console.log(
          "AgentVoiceCall: Dialog opened, voice service instance already exists.",
        );
      }
    }

    return () => {
      console.log(
        "AgentVoiceCall: useEffect[open] cleanup. Dialog is closing or component unmounting.",
      );
      resetState();
    };
  }, [open]);

  const initializeVapi = () => {
    if (
      typeof navigator.mediaDevices === "undefined" ||
      typeof navigator.mediaDevices.enumerateDevices === "undefined"
    ) {
      console.error(
        "MediaDevices API (navigator.mediaDevices.enumerateDevices) is not available. This can happen in insecure contexts (non-HTTPS, excluding localhost) or unsupported browsers.",
      );
      setErrorDetails(
        "Required microphone access API is not available. Please ensure you are on a secure (HTTPS) connection or using localhost, and that your browser supports this feature.",
      );
      setCallStatus("error");
      return;
    }

    const vapiKey = import.meta.env.VITE_VAPI_PUBLIC_KEY as string;

    if (!vapiKey) {
      console.error(
        "Voice service public key not found in environment variables",
      );
      setErrorDetails(
        "Voice service configuration missing. Please check your environment setup.",
      );
      setCallStatus("error");
      return;
    }

    try {
      console.log(
        "Initializing voice service with key:",
        vapiKey.substring(0, 5) + "...",
      );
      vapiRef.current = new Vapi(vapiKey);
      setupVapiEventListeners();
    } catch (error) {
      console.error("Error initializing voice service:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      setErrorDetails(`Initialization error: ${errorMessage}`);
      setCallStatus("error");
    }
  };

  // Cleanup on dialog close
  // This useEffect is now redundant due to the cleanup logic in the main useEffect above.
  // useEffect(() => {
  //   if (!open) {
  //     resetState();
  //   }
  // }, [open]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const setupVapiEventListeners = () => {
    if (!vapiRef.current) return;

    // Call status events
    vapiRef.current.on("call-start", () => {
      console.log("Call started event received from voice service.");
      setCallStatus("active");
      setIsCallActive(true);
      currentAgentMessageIdRef.current = null;

      // Use the first message from the flow or the default
      // The first message is now expected to be configured server-side via the webhook
      // called in TestAgentDialog. So, we don't need to vapi.say() it here.
      // if (vapiRef.current) {
      //   console.log("Using vapi.say() for the first message:", firstMessageNode);
      //   vapiRef.current.say(firstMessageNode);
      // }
    });

    vapiRef.current.on("call-end", () => {
      console.log("Call ended");
      setCallStatus("ended");
      setIsCallActive(false);
      setIsAgentSpeaking(false);
      // setIsMuted(false); // Optionally reset mute state on call end, or persist it
      if (currentAgentMessageIdRef.current) {
        // Finalize any open agent message
        setMessages((prev) =>
          prev.map((m) =>
            m.id === currentAgentMessageIdRef.current
              ? { ...m, isFinal: true, timestamp: new Date() }
              : m,
          ),
        );
        currentAgentMessageIdRef.current = null;
      }
    });

    // Speech events
    vapiRef.current.on("speech-start", () => {
      console.log("Agent speaking started (speech-start event)");
      setIsAgentSpeaking(true);
      const newAgentMessageId = Date.now().toString() + "-agent-speech";
      currentAgentMessageIdRef.current = newAgentMessageId;
      // Create an empty bubble, it will be populated by 'message' events.
      setMessages((prev) => [
        ...prev,
        {
          id: newAgentMessageId,
          role: "agent",
          content: "",
          timestamp: new Date(),
          isFinal: false,
        },
      ]);
    });

    vapiRef.current.on("speech-end", () => {
      console.log("Agent speaking ended (speech-end event)");
      setIsAgentSpeaking(false);
      if (currentAgentMessageIdRef.current) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === currentAgentMessageIdRef.current
              ? { ...m, isFinal: true, timestamp: new Date() }
              : m,
          ),
        );
        currentAgentMessageIdRef.current = null;
      }
    });

    // Message events
    vapiRef.current.on("message", (msg: any) => {
      console.log(
        "Message received from voice service:",
        JSON.stringify(msg, null, 2),
      );

      if (msg.role === "user") {
        if (msg.type === "transcript") {
          const content = msg.transcript || "";
          const isPartial = msg.transcriptType === "partial";
          const isFinal = msg.transcriptType === "final";

          if (isPartial) {
            setMessages((prev) => {
              const lastUserMessageIndex = [...prev]
                .reverse()
                .findIndex((m) => m.role === "user" && !m.isFinal);
              if (lastUserMessageIndex >= 0) {
                // Corrected: was lastUserMessageIdRef.current
                const actualIndex = prev.length - 1 - lastUserMessageIndex;
                const updated = [...prev];
                updated[actualIndex] = { ...updated[actualIndex], content };
                return updated;
              } else {
                return [
                  ...prev,
                  {
                    id: Date.now().toString(),
                    role: "user",
                    content,
                    timestamp: new Date(),
                    isFinal: false,
                  },
                ];
              }
            });
          } else if (isFinal) {
            setMessages((prev) => {
              const lastUserMessageIndex = [...prev]
                .reverse()
                .findIndex((m) => m.role === "user" && !m.isFinal);
              if (lastUserMessageIndex >= 0) {
                // Corrected: was lastUserMessageIdRef.current
                const actualIndex = prev.length - 1 - lastUserMessageIndex;
                const updated = [...prev];
                updated[actualIndex] = {
                  ...updated[actualIndex],
                  content,
                  isFinal: true,
                };
                return updated;
              } else {
                return [
                  ...prev,
                  {
                    id: Date.now().toString(),
                    role: "user",
                    content,
                    timestamp: new Date(),
                    isFinal: true,
                  },
                ];
              }
            });
          }
        } else {
          console.warn(
            "Received user-role message that is not a transcript:",
            msg,
          );
        }
      } else if (msg.role === "assistant") {
        let assistantContent = "";
        let isFinalTranscript = false;

        if (msg.type === "transcript" && typeof msg.transcript === "string") {
          assistantContent = msg.transcript;
          isFinalTranscript = msg.transcriptType === "final";
          console.log(
            "Assistant transcript:",
            assistantContent,
            "isFinal:",
            isFinalTranscript,
          );
        } else {
          // Skip non-transcript assistant messages (raw LLM text, function calls, etc.)
          // These duplicate the transcript content and cause double message bubbles
          console.log("Skipping non-transcript assistant message:", msg.type);
        }

        if (assistantContent) {
          if (currentAgentMessageIdRef.current) {
            // First, update the current bubble with this content
            setMessages((prev) =>
              prev.map((m) =>
                m.id === currentAgentMessageIdRef.current
                  ? { ...m, content: assistantContent, timestamp: new Date() }
                  : m,
              ),
            );

            // If this is a final transcript, finalize the current bubble and prepare for a new one
            if (isFinalTranscript) {
              console.log("Finalizing bubble with content:", assistantContent);

              // Finalize the current bubble
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === currentAgentMessageIdRef.current
                    ? { ...m, isFinal: true }
                    : m,
                ),
              );

              // Create a new empty bubble for upcoming speech if the agent is still speaking
              if (isAgentSpeaking) {
                const newAgentMessageId =
                  Date.now().toString() +
                  "-agent-speech-" +
                  Math.random().toString(36).substring(7);
                setMessages((prev) => [
                  ...prev,
                  {
                    id: newAgentMessageId,
                    role: "agent",
                    content: "", // Start empty, will be populated by subsequent messages
                    timestamp: new Date(),
                    isFinal: false,
                  },
                ]);
                currentAgentMessageIdRef.current = newAgentMessageId;
              } else {
                // If agent is not speaking anymore, just clear the reference
                currentAgentMessageIdRef.current = null;
              }
            }
          } else {
            // No active speech bubble from speech-start.
            console.log(
              "Creating new bubble for assistant content with no current ref",
            );
            const newAgentMessageId =
              Date.now().toString() +
              "-agent-text-" +
              Math.random().toString(36).substring(7);
            setMessages((prev) => [
              ...prev,
              {
                id: newAgentMessageId,
                role: "agent",
                content: assistantContent,
                timestamp: new Date(),
                isFinal: isFinalTranscript, // Finalize immediately if it's a final transcript
              },
            ]);

            // Only set as current if it's not final or if agent is still speaking
            if (!isFinalTranscript || isAgentSpeaking) {
              currentAgentMessageIdRef.current = newAgentMessageId;
            }
          }
        } else {
          // Handle other assistant-originated events that don't directly result in a chat message
          if (msg.type === "function-call") {
            console.log(
              "Function call from assistant (not displayed in chat):",
              msg.functionCall,
            );
          } else if (msg.type === "tool-calls") {
            console.log(
              "Tool calls from assistant (not displayed in chat):",
              msg.toolCalls,
            );
          } else {
            console.warn(
              "Received assistant-role message with no displayable content:",
              msg,
            );
          }
        }
      } else if (msg.type === "status-update") {
        // Handle status updates (in-progress, ended, etc.)
        if (msg.status === "ended" && msg.endedReason) {
          const reason = msg.endedReason as string;
          if (reason.includes("error") || reason.includes("failed")) {
            const friendlyReason = reason
              .replace(/-/g, " ")
              .replace("pipeline ", "");
            setErrorDetails(`Call ended: ${friendlyReason}`);
            setCallStatus("error");
            setIsCallActive(false);
          }
        }
      } else {
        console.warn(
          "Unhandled voice service message with unknown role:",
          msg.role,
          "Full message:",
          msg,
        );
      }
    });
  };

  // Agent update logic (sendAgentDataToWebhook, LAURA_VOICE_ID, updateSupabaseAgentVoiceId)
  // has been moved to TestAgentDialog.tsx

  const handleStartCall = async () => {
    if (!vapiRef.current) {
      initializeVapi();
      if (!vapiRef.current) {
        return; // If initialization failed, don't proceed
      }
    }

    setRetryCount(0);
    setErrorDetails(null);

    try {
      setCallStatus("connecting");

      // Use the v_agent_id field which contains the actual Vapi assistant ID
      // If v_agent_id is not available, fall back to other fields that might contain it
      const assistantId =
        agent.v_agent_id || agent.elevenlabs_agent_id || agent.id;

      console.log("Starting call with assistant ID:", assistantId);

      if (!assistantId) {
        throw new Error(
          "No valid assistant ID found. Please make sure the agent has a v_agent_id field.",
        );
      }

      // Check if the ID looks like a Vapi ID (typically a UUID)
      const looksLikeVapiId =
        /^[a-f0-9-]{36}$/.test(assistantId) || assistantId.startsWith("asst_");
      if (!looksLikeVapiId) {
        console.warn(
          "The assistant ID doesn't appear to be a valid format:",
          assistantId,
        );
      }

      // Start call with assistant ID and override the transcriber
      // to avoid pipeline-error-deepgram-transcriber-failed
      await vapiRef.current.start(assistantId, {
        transcriber: {
          provider: "talkscriber",
          model: "whisper",
          language: "en",
        },
      });
    } catch (error) {
      console.error("Error starting call:", error);
      // Handle different error types more specifically
      let errorMessage = "Unknown error";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (error === undefined) {
        errorMessage =
          "Connection failed with undefined error. This often indicates a network issue or invalid assistant ID.";
      } else if (typeof error === "string") {
        errorMessage = error;
      } else {
        try {
          errorMessage = JSON.stringify(error);
        } catch (e) {
          errorMessage = "Unspecified error occurred";
        }
      }

      console.error("Detailed error information:", {
        errorType: typeof error,
        errorValue: error,
        errorString: String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      });

      setErrorDetails(`Connection error: ${errorMessage}`);
      setCallStatus("error");

      // Check browser permissions
      checkMicrophonePermissions();

      // Check if the assistant ID might be the issue
      const assistantId =
        agent.v_agent_id || agent.elevenlabs_agent_id || agent.id;

      // Log all potential IDs for debugging
      console.log("Available IDs:", {
        id: agent.id,
        v_agent_id: agent.v_agent_id,
        elevenlabs_agent_id: agent.elevenlabs_agent_id,
      });

      if (!assistantId) {
        setErrorDetails(
          "No valid assistant ID found. Please make sure the agent has been properly created.",
        );
      } else if (
        !/^[a-f0-9-]{36}$/.test(assistantId) &&
        !assistantId.startsWith("asst_")
      ) {
        setErrorDetails(
          `The assistant ID "${assistantId}" doesn't appear to be a valid assistant ID. Please verify the agent has been properly configured.`,
        );
      }
    }
  };

  const checkMicrophonePermissions = async () => {
    try {
      const permissionStatus = await navigator.permissions.query({
        name: "microphone" as PermissionName,
      });

      if (permissionStatus.state === "denied") {
        setErrorDetails(
          "Microphone access denied. Please allow microphone access in your browser settings.",
        );
      }
    } catch (error) {
      console.error("Error checking microphone permissions:", error);
    }
  };

  const handleRetry = async () => {
    if (retryCount >= maxRetries) {
      setErrorDetails(
        `Failed after ${maxRetries} attempts. Please check your connection and try again later.`,
      );
      return;
    }

    setRetryCount((prev) => prev + 1);
    setCallStatus("retrying");

    // Exponential backoff: 1s, 2s, 4s, etc.
    const backoffTime = Math.pow(2, retryCount) * 1000;
    console.log(
      `Retrying in ${backoffTime / 1000} seconds... (Attempt ${retryCount + 1}/${maxRetries})`,
    );

    setTimeout(() => {
      // Clean up previous instance
      if (vapiRef.current) {
        try {
          console.log(
            "Stopping existing voice service instance before retry...",
          );
          vapiRef.current.stop();
        } catch (e) {
          console.error(
            "Error stopping previous voice service instance during retry:",
            e,
          );
        } finally {
          // Ensure the ref is cleared to allow for a new instance
          vapiRef.current = null;
          console.log("Voice service instance reference cleared for retry.");
        }
      }

      // Reinitialize and try again
      console.log("Re-initializing voice service for retry...");
      initializeVapi(); // This will now create a new instance as vapiRef.current is null

      // Only proceed if initialization was successful
      if (vapiRef.current && callStatus !== "error") {
        console.log(
          "Voice service re-initialized, attempting to start call again...",
        );
        handleStartCall();
      } else {
        console.error(
          "Voice service initialization failed during retry, aborting start call.",
        );
        // Error state should already be set by initializeVapi if it failed
      }
    }, backoffTime);
  };

  const handleStopCall = async () => {
    if (!vapiRef.current) return;

    try {
      await vapiRef.current.stop();
      setCallStatus("ended");
      setIsCallActive(false);
    } catch (error) {
      console.error("Error stopping call:", error);
    }
  };

  const resetState = () => {
    // isCallActive might have been set to false by handleInternalDialogStateChange
    // if the call was stopped there.
    if (vapiRef.current) {
      try {
        if (isCallActive) {
          // If still marked active (e.g., unmount without dialog close event)
          console.log(
            "resetState: Call was still marked active, stopping now.",
          );
          vapiRef.current.stop();
        }
      } catch (error) {
        console.error("Error stopping voice service during resetState:", error);
      } finally {
        vapiRef.current = null;
      }
    }
    setIsCallActive(false); // Ensure this is false after reset
    setIsAgentSpeaking(false);
    setCallStatus("ready");
    setIsMuted(false); // Reset mute state
    setMessages([]);
    currentAgentMessageIdRef.current = null;
    // No preSpeech refs to clear as they've been removed from this simplified logic
  };

  const handleResetConversation = () => {
    if (isCallActive) {
      handleStopCall();
    }
    setMessages([]);
    setCallStatus("ready");
    setIsAgentSpeaking(false);
    setIsMuted(false); // Reset mute state
    currentAgentMessageIdRef.current = null;
    // No preSpeech refs to clear

    setTimeout(() => {
      if (vapiRef.current) {
        try {
          vapiRef.current.stop();
        } catch (e) {
          /*ignore*/
        }
        vapiRef.current = null;
      }
      initializeVapi();
    }, 100);
  };

  // handleUpdateAgent function is removed as agent update is handled by TestAgentDialog

  // Determine call button state
  const getCallButtonState = () => {
    switch (callStatus) {
      case "ready":
        return {
          text: "Start Call",
          icon: <PhoneCall className="h-5 w-5 mr-2" />,
          color: "bg-green-500 hover:bg-green-600",
          disabled: false,
          onClick: handleStartCall,
        };
      case "connecting":
        return {
          text: "Connecting...",
          icon: <RefreshCw className="h-5 w-5 mr-2 animate-spin" />,
          color: "bg-yellow-500",
          disabled: true,
          onClick: () => {},
        };
      case "retrying":
        return {
          text: `Retrying (${retryCount}/${maxRetries})...`,
          icon: <RefreshCw className="h-5 w-5 mr-2 animate-spin" />,
          color: "bg-yellow-500",
          disabled: true,
          onClick: () => {},
        };
      // "updating" case removed
      case "active":
        return {
          text: "End Call",
          icon: <PhoneOff className="h-5 w-5 mr-2" />,
          color: "bg-red-500 hover:bg-red-600",
          disabled: false,
          onClick: handleStopCall,
        };
      case "error":
        return {
          text: "Retry Call",
          icon: <RefreshCw className="h-5 w-5 mr-2" />,
          color: "bg-yellow-500 hover:bg-yellow-600",
          disabled: false,
          onClick: handleRetry,
        };
      default:
        return {
          text: "Start Call",
          icon: <PhoneCall className="h-5 w-5 mr-2" />,
          color: "bg-green-500 hover:bg-green-600",
          disabled: false,
          onClick: handleStartCall,
        };
    }
  };

  const callButton = getCallButtonState();

  const handleToggleMute = () => {
    if (vapiRef.current && callStatus === "active") {
      const newMutedState = !isMuted;
      vapiRef.current.setMuted(newMutedState);
      setIsMuted(newMutedState);
      console.log(`Microphone ${newMutedState ? "muted" : "unmuted"}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleInternalDialogStateChange}>
      <DialogContent className="sm:max-w-[480px] md:max-w-[520px] p-0 flex flex-col h-[700px] max-h-[80vh] overflow-hidden bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-700/60 shadow-2xl">
        <DialogHeader className="p-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-inherit z-10 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  handleInternalDialogStateChange(false); // Use the new handler
                  // Re-open the test agent dialog with a longer delay to prevent flickering
                  setTimeout(() => {
                    const testDialogEvent = new CustomEvent(
                      "reopen-test-dialog",
                      { detail: { agentId: agent.id } },
                    );
                    document.dispatchEvent(testDialogEvent);
                  }, 300);
                }}
                className="mr-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                title="Back to options"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-arrow-left"
                >
                  <path d="m12 19-7-7 7-7" />
                  <path d="M19 12H5" />
                </svg>
              </Button>
              <div>
                <DialogTitle className="text-left text-lg font-semibold">
                  {agent.name}
                </DialogTitle>
                <DialogDescription className="text-left capitalize text-sm text-gray-500 dark:text-gray-400">
                  {agent.role.replace("_", " ")}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              {/* Settings button removed */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleResetConversation}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                title="Reset Conversation"
              >
                <RefreshCw className="h-5 w-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleInternalDialogStateChange(false)} // Use the new handler for the X button
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                title="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white dark:bg-gray-900">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="p-4 rounded-full bg-indigo-100 dark:bg-indigo-900/30 mb-4">
                <Mic className="h-10 w-10 text-indigo-500 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
                Ready to start your voice call
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                Click the Start Call button below to begin talking with{" "}
                {agent.name}
              </p>
            </div>
          ) : (
            <>
              {messages.map((message) => {
                const isUser = message.role === "user";
                const bubbleBaseStyle =
                  "max-w-[75%] px-4 py-3 relative group shadow-md";
                const userBubbleStyle = `bg-blue-500 text-white rounded-3xl rounded-br-lg`;
                const agentBubbleStyle = `bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-3xl rounded-bl-lg`;

                return (
                  <div
                    key={message.id}
                    className={`flex flex-col mb-2 ${isUser ? "items-end" : "items-start"}`}
                  >
                    {message.content === "" && !isUser ? (
                      <div className="flex items-center justify-center bg-gray-200 dark:bg-gray-700 rounded-full px-4 py-2 w-20 shadow-md">
                        <div className="flex items-center gap-1">
                          <div
                            className="h-2 w-2 bg-gray-500 dark:bg-gray-300 rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></div>
                          <div
                            className="h-2 w-2 bg-gray-500 dark:bg-gray-300 rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          ></div>
                          <div
                            className="h-2 w-2 bg-gray-500 dark:bg-gray-300 rounded-full animate-bounce"
                            style={{ animationDelay: "600ms" }}
                          ></div>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`${bubbleBaseStyle} ${isUser ? userBubbleStyle : agentBubbleStyle}`}
                      >
                        <p className="text-sm leading-relaxed">
                          {message.content}
                        </p>
                      </div>
                    )}

                    <div className={`mt-1 ${isUser ? "mr-1" : "ml-1"}`}>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500/80">
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-inherit">
          <div className="flex items-center space-x-2">
            <Button
              className={`flex-grow py-5 text-white font-medium rounded-xl ${callButton.color}`}
              disabled={callButton.disabled}
              onClick={callButton.onClick}
            >
              {callButton.icon}
              {callButton.text}
            </Button>
            {callStatus === "active" && (
              <Button
                variant="outline"
                size="icon"
                onClick={handleToggleMute}
                className="p-5 rounded-xl border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
              >
                {isMuted ? (
                  <MicOff className="h-5 w-5" />
                ) : (
                  <Mic className="h-5 w-5" />
                )}
              </Button>
            )}
          </div>

          {callStatus === "active" && !isMuted && (
            <div className="flex justify-center mt-2">
              <div className="flex items-center text-xs text-green-500 font-medium animate-pulse">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                Call Active
              </div>
            </div>
          )}

          {callStatus === "active" && isMuted && (
            <div className="flex justify-center mt-2">
              <div className="flex items-center text-xs text-yellow-500 font-medium">
                <MicOff className="h-3 w-3 mr-1" />
                Microphone Muted
              </div>
            </div>
          )}

          {callStatus === "error" && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-lg">
              <p className="text-sm text-center text-red-600 dark:text-red-400 font-medium mb-1">
                There was an error connecting to the voice service.
              </p>
              <p className="text-xs text-center text-red-500 dark:text-red-400 mb-2">
                {errorDetails || "Please try again or check your connection."}
              </p>
              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mt-2">
                <p className="font-medium">Troubleshooting steps:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Check your internet connection</li>
                  <li>Ensure microphone permissions are enabled</li>
                  <li>Verify the assistant ID is correct</li>
                  <li>Try refreshing the page</li>
                </ul>
              </div>
              <div className="mt-3 pt-2 border-t border-red-200 dark:border-red-800/30">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  <span className="font-medium">For developers:</span> Check the
                  browser console (F12) for detailed error logs.
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Make sure you've created an assistant in the voice service
                  dashboard and are using its ID.
                </p>
              </div>
            </div>
          )}

          {callStatus === "retrying" && (
            <div className="flex justify-center mt-2">
              <div className="flex items-center text-xs text-yellow-500 font-medium">
                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1 animate-pulse"></span>
                Retrying connection... Attempt {retryCount}/{maxRetries}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
