import React, { useState, useRef, useEffect, useCallback } from "react";
import { Check, Send, X, AlertCircle, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Agent } from "@/types/agent";
import { Input } from "@/components/ui/input";
import { sendUserMessage } from "@/utils/agent-training-api";
import { useToast } from "@/hooks/use-toast";
import { FlowData, FlowNode } from "@/types/agent-types";
import { supabase } from "@/integrations/supabase/client";

// Utility function to strip HTML tags
const stripHtmlTags = (html: string): string => {
  if (!html) return '';
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
};

interface AgentTrainingPopupProps {
  agent: Agent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  timestamp: Date;
  feedback?: "positive" | "negative";
  correction?: string;
}

export function AgentTrainingPopup({
  agent,
  open,
  onOpenChange,
}: AgentTrainingPopupProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState("");
  const [isInitializing, setIsInitializing] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [correctionInput, setCorrectionInput] = useState("");
  const [showCorrectionSlider, setShowCorrectionSlider] = useState(false);
  const [correctionTargetId, setCorrectionTargetId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const initialized = useRef(false);

  const findFirstMessage = useCallback((flowData: FlowData, agentData: Agent): string => {
    const fallbackMessage = `Hi there! I'm ${agentData.name}, your ${agentData.role.replace('_', ' ')}. How can I help you today?`;

    if (!flowData || !flowData.nodes || !Array.isArray(flowData.nodes) || flowData.nodes.length === 0) {
      return fallbackMessage;
    }

    // Prioritize StartNode for the first message in test chat
    const startNode = flowData.nodes.find((node: FlowNode) => node.type === 'startNode');

    if (startNode && startNode.data && typeof startNode.data.firstMessage === 'string') {
      const trimmedMessage = stripHtmlTags(startNode.data.firstMessage).trim();
      if (trimmedMessage !== '') {
        return trimmedMessage;
      }
    }

    // Fallback to old logic if StartNode doesn't have a message (or doesn't exist)
    const greetingOrSpeakNodes = flowData.nodes.filter(
      (node: FlowNode) => node.type === 'greetingNode' || node.type === 'speakNode'
    );

    if (greetingOrSpeakNodes.length > 0) {
      const firstRelevantNode = greetingOrSpeakNodes[0];
      if (firstRelevantNode.data) {
        if (firstRelevantNode.type === 'greetingNode' && typeof firstRelevantNode.data.greeting === 'string') {
          const trimmedGreeting = stripHtmlTags(firstRelevantNode.data.greeting).trim();
          if (trimmedGreeting !== '') {
            return trimmedGreeting;
          }
        } else if (firstRelevantNode.type === 'speakNode' && typeof firstRelevantNode.data.message === 'string') {
          const trimmedMessage = stripHtmlTags(firstRelevantNode.data.message).trim();
          if (trimmedMessage !== '') {
            return trimmedMessage;
          }
        }
      }
    }
    
    return fallbackMessage;
  }, []);

  const initializeChat = useCallback(() => {
    setIsInitializing(true);
    try {
      let flowData: FlowData;
      if (typeof agent.flow === 'string') {
        try {
          flowData = JSON.parse(agent.flow);
        } catch (e) {
          console.error('Failed to parse flow data:', e);
          flowData = { nodes: [], edges: [] };
        }
      } else if (agent.flow) {
        flowData = agent.flow as FlowData;
      } else {
        flowData = { nodes: [], edges: [] };
      }
      
      const firstMessageContent = findFirstMessage(flowData, agent);
      const strippedFirstMessage = stripHtmlTags(firstMessageContent).trim();
      console.log('[AgentTrainingPopup] Determined first message:', strippedFirstMessage);
      
      const initialMessageId = Date.now().toString();

      if (strippedFirstMessage) {
        setMessages([{
          id: initialMessageId,
          role: "agent",
          content: strippedFirstMessage,
          timestamp: new Date()
        }]);
      } else {
        setMessages([]);
        console.log('[AgentTrainingPopup] No valid first message found, starting with empty chat for user input.');
      }
      initialized.current = true;
    } catch (error) {
      console.error('[AgentTrainingPopup] Error initializing training:', error);
      toast({
        title: "Error",
        description: "Failed to initialize training session",
        variant: "destructive",
      });
      
      setMessages([{
        id: Date.now().toString(),
        role: "agent",
        content: `Hi there! I'm ${agent.name}, your ${agent.role.replace('_', ' ')}. I'm here to help you with anything you need. How can I assist you today?`,
        timestamp: new Date()
      }]);
    } finally {
      setIsInitializing(false);
    }
  }, [agent, toast, findFirstMessage]);

  useEffect(() => {
    if (open && !initialized.current) {
      initializeChat();
    }
    
    if (!open) {
      setShowCorrectionSlider(false);
      setCorrectionTargetId(null);
      setCorrectionInput("");
      initialized.current = false;
      setMessages([]);
      setUserInput("");
      setIsTyping(false);
      setEditingMessageId(null);
      setStreamingMessageId(null);
      setStreamingContent("");
    }
  }, [open, initializeChat]);

  const handleResetConversation = () => {
    setMessages([]);
    setUserInput("");
    setIsTyping(false);
    setEditingMessageId(null);
    setCorrectionInput("");
    setShowCorrectionSlider(false);
    setCorrectionTargetId(null);
    setStreamingMessageId(null);
    setStreamingContent("");
    
    initialized.current = false;
    initializeChat();
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, editingMessageId, showCorrectionSlider]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  };

  const handleSendMessage = async () => {
    if (!userInput.trim() || !agent.id) return;

    const userMessageId = Date.now().toString();
    const newUserMessage: Message = {
      id: userMessageId,
      role: "user",
      content: userInput,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setUserInput("");
    setIsTyping(true);

    // Create placeholder message for streaming
    const agentMessageId = (Date.now() + 1).toString();
    setStreamingMessageId(agentMessageId);
    setStreamingContent("");
    
    const placeholderMessage: Message = {
      id: agentMessageId,
      role: "agent",
      content: "",
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, placeholderMessage]);

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      conversationHistory.push({
        role: "user",
        content: userInput
      });
      
      const response = await sendUserMessage(
        agent.id, 
        userInput, 
        conversationHistory,
        (chunk: string) => {
          setStreamingContent(prev => {
            const newContent = prev + chunk;
            setMessages(currentMessages => 
              currentMessages.map(msg => 
                msg.id === agentMessageId 
                  ? { ...msg, content: newContent }
                  : msg
              )
            );
            return newContent;
          });
        }
      );
      
      if (response.message) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === agentMessageId 
              ? { ...msg, content: response.message }
              : msg
          )
        );
      }
    } catch (error) {
      console.error('[AgentTrainingPopup] Error sending message:', error);
      
      const fallbackContent = `I understand you're saying "${userInput}". As ${agent.name}, I'm designed to help with ${agent.role.replace('_', ' ')} tasks. Could you provide more details about what you need assistance with?`;
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === agentMessageId 
            ? { ...msg, content: fallbackContent }
            : msg
        )
      );
    } finally {
      setIsTyping(false);
      setStreamingMessageId(null);
      setStreamingContent("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (editingMessageId) {
        handleSubmitCorrection();
      } else if (showCorrectionSlider) {
        handleSubmitCorrectionFromSlider();
      } else {
        handleSendMessage();
      }
    }
  };


  const handleCancelEditing = () => {
    setEditingMessageId(null);
    setCorrectionInput("");
  };

  const handleOpenCorrection = (messageId: string) => {
    setCorrectionTargetId(messageId);
    setShowCorrectionSlider(true);
    setCorrectionInput("");
  };

  const handleCancelCorrectionSlider = () => {
    setShowCorrectionSlider(false);
    setCorrectionTargetId(null);
    setCorrectionInput("");
  };

  const saveTrainingExample = async (
    agentId: string, 
    userMessage: string, 
    aiResponse: string, 
    correctedResponse: string
  ) => {
    try {
      const { error } = await supabase
        .from('agent_training_examples')
        .insert({
          agent_id: agentId,
          user_message: userMessage,
          ai_response: aiResponse,
          corrected_response: correctedResponse,
          user_id: (await supabase.auth.getUser()).data.user?.id
        });

      if (error) {
        console.error('[TrainingPopup] Error saving training example:', error);
        toast({
          title: "Error",
          description: "Failed to save training example",
          variant: "destructive",
        });
      } else {
        console.log('[TrainingPopup] Training example saved successfully');
        toast({
          title: "Success",
          description: "Training example saved",
        });
      }
    } catch (error) {
      console.error('[TrainingPopup] Error saving training example:', error);
    }
  };

  const handleSubmitCorrectionFromSlider = async () => {
    if (!correctionInput.trim() || !correctionTargetId) return;

    const correctedMessageIndex = messages.findIndex(msg => msg.id === correctionTargetId);
    if (correctedMessageIndex <= 0) {
      console.error("[TrainingPopup] Cannot find message or preceding user message");
      return;
    }

    const agentMessage = messages[correctedMessageIndex];
    let userMessageIndex = correctedMessageIndex - 1;
    while (userMessageIndex >= 0) {
      if (messages[userMessageIndex].role === "user") {
        break;
      }
      userMessageIndex--;
    }

    if (userMessageIndex >= 0) {
      const userMessage = messages[userMessageIndex];
      
      await saveTrainingExample(
        agent.id,
        userMessage.content,
        agentMessage.content,
        correctionInput
      );
    }

    setMessages(prev => prev.map(message => message.id === correctionTargetId ? {
      ...message,
      correction: correctionInput,
      feedback: "negative"
    } : message));

    setShowCorrectionSlider(false);
    setCorrectionTargetId(null);
    setCorrectionInput("");
  };

  const handleSubmitCorrection = async () => {
    if (!correctionInput.trim() || !editingMessageId) return;

    const correctedMessageIndex = messages.findIndex(msg => msg.id === editingMessageId);
    if (correctedMessageIndex <= 0) {
      console.error("[TrainingPopup] Cannot find message or preceding user message");
      return;
    }

    const agentMessage = messages[correctedMessageIndex];
    let userMessageIndex = correctedMessageIndex - 1;
    while (userMessageIndex >= 0) {
      if (messages[userMessageIndex].role === "user") {
        break;
      }
      userMessageIndex--;
    }

    if (userMessageIndex >= 0) {
      const userMessage = messages[userMessageIndex];
      
      await saveTrainingExample(
        agent.id,
        userMessage.content,
        agentMessage.content,
        correctionInput
      );
    }

    setMessages(prev => prev.map(message => message.id === editingMessageId ? {
      ...message,
      correction: correctionInput,
      feedback: "negative"
    } : message));

    setEditingMessageId(null);
    setCorrectionInput("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] md:max-w-[520px] p-0 flex flex-col h-[700px] max-h-[80vh] overflow-hidden bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-700/60 shadow-2xl">
        <DialogHeader className="p-4 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-inherit z-10 rounded-t-3xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  onOpenChange(false);
                  setTimeout(() => {
                    const testDialogEvent = new CustomEvent('reopen-test-dialog', { detail: { agentId: agent.id } });
                    document.dispatchEvent(testDialogEvent);
                  }, 300);
                }} 
                className="mr-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                title="Back to options"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-left">
                  <path d="m12 19-7-7 7-7"/>
                  <path d="M19 12H5"/>
                </svg>
              </Button>
              <div>
                <DialogTitle className="text-left text-lg font-semibold">{agent.name}</DialogTitle>
                <DialogDescription className="text-left capitalize text-sm text-gray-500 dark:text-gray-400">
                  {agent.role.replace('_', ' ')}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center space-x-1">
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
                onClick={() => onOpenChange(false)} 
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                title="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white dark:bg-gray-900">
          {isInitializing ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {messages.map(message => {
                const isUser = message.role === "user";
                const isStreaming = streamingMessageId === message.id;
                const bubbleBaseStyle = "max-w-[75%] px-4 py-3 relative group shadow-md"; 
                const userBubbleStyle = "bg-blue-500 text-white rounded-3xl rounded-br-lg"; 
                const agentBaseBubbleStyle = "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-3xl rounded-bl-lg";
                
                let agentBubbleStyle = agentBaseBubbleStyle;
                if (message.feedback === "negative") {
                  agentBubbleStyle = "bg-red-100 dark:bg-red-800/50 text-red-700 dark:text-red-200 rounded-3xl rounded-bl-lg";
                } else if (message.feedback === "positive") {
                  agentBubbleStyle = "bg-green-100 dark:bg-green-800/50 text-green-700 dark:text-green-200 rounded-3xl rounded-bl-lg";
                }

                return (
                <div key={message.id} className={`flex flex-col mb-2 ${isUser ? "items-end" : "items-start"}`}>
                  <div className={`${bubbleBaseStyle} ${isUser ? userBubbleStyle : agentBubbleStyle}`}>
                    {message.role === "agent" && (
                      <div className="absolute top-1/2 -translate-y-1/2 -right-11 flex flex-col space-y-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-6 w-6 p-0 bg-white dark:bg-gray-600/80 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity ${message.feedback === "negative" ? "text-red-500 dark:text-red-400 opacity-100" : "text-gray-500 dark:text-gray-400 hover:text-red-500"}`}
                          onClick={() => handleOpenCorrection(message.id)}
                          title="Correct this response"
                        >
                          <AlertCircle className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                    
                    {editingMessageId === message.id ? (
                      <div className="mt-2">
                        <p className="text-xs mb-1 text-gray-600 dark:text-gray-300">
                          Provide the correct answer:
                        </p>
                        <div className="flex flex-col space-y-2">
                          <Textarea
                            value={correctionInput}
                            onChange={e => setCorrectionInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            className="min-h-[70px] text-sm border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/80 text-gray-800 dark:text-gray-100 rounded-xl"
                            placeholder="Enter the correct response..."
                          />
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="sm" onClick={handleCancelEditing} className="text-gray-600 dark:text-gray-300 rounded-lg">
                              Cancel
                            </Button>
                            <Button variant="default" size="sm" onClick={handleSubmitCorrection} className="bg-blue-500 hover:bg-blue-600 rounded-lg">
                              Submit Correction
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm leading-relaxed">
                          {stripHtmlTags(message.content)}
                          {/* FIXED: Only show cursor when actively streaming AND there's content */}
                          {isStreaming && message.content.length > 0 && (
                            <span className="inline-block w-2 h-4 bg-blue-500 dark:bg-blue-400 ml-1 animate-pulse" />
                          )}
                        </p>
                        
                        {message.correction && (
                          <div className="mt-2 p-2 bg-white dark:bg-gray-700/50 rounded-xl border border-green-300 dark:border-green-600/70">
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Corrected to:</p>
                            <p className="text-sm leading-relaxed text-green-700 dark:text-green-300">{message.correction}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  
                  <div className={`mt-1 ${isUser ? 'mr-1' : 'ml-1'}`}>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500/80">
                      {new Date(message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              );})}
              
              {isTyping && !streamingMessageId && (
                <div className="flex justify-start">
                  <div className="max-w-[50%] rounded-3xl px-3 py-2 bg-gray-100 dark:bg-gray-700/80 rounded-bl-lg">
                    <div className="flex space-x-1.5 h-5 items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse"></div>
                      <div
                        className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse"
                        style={{
                          animationDelay: "200ms",
                        }}
                      ></div>
                      <div
                        className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500 animate-pulse"
                        style={{
                          animationDelay: "400ms",
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {showCorrectionSlider && (
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700/80 p-4 transition-transform duration-300 transform translate-y-0 z-20 shadow-lg rounded-t-2xl">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">How should the AI have responded?</h3>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600" onClick={handleCancelCorrectionSlider}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              value={correctionInput}
              onChange={e => setCorrectionInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[80px] text-sm border border-gray-300 dark:border-gray-600 mb-3 rounded-xl bg-gray-50 dark:bg-gray-800 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Enter the correct response the AI should have given..."
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <Button variant="ghost" size="sm" onClick={handleCancelCorrectionSlider} className="rounded-lg text-gray-600 dark:text-gray-300">
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSubmitCorrectionFromSlider}
                disabled={!correctionInput.trim()}
                className="bg-blue-500 hover:bg-blue-600 rounded-lg"
              >
                Submit Correction
              </Button>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-b-3xl">
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Type a message..."
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping || isInitializing}
                className="pr-12 rounded-xl border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!userInput.trim() || isTyping || isInitializing}
              size="sm"
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl px-4"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
