
import React, { useState, useRef, useEffect } from "react";
import { Check, Volume2, Send, X, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Agent } from "@/types/agent";

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

export function AgentTrainingPopup({ agent, open, onOpenChange }: AgentTrainingPopupProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "agent",
      content: `Hi there! I'm ${agent.name}, your ${agent.role.replace('_', ' ')}. I'm here to help you with anything you need. How can I assist you today?`,
      timestamp: new Date(),
    },
  ]);
  
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [correctionInput, setCorrectionInput] = useState("");
  const [showCorrectionSlider, setShowCorrectionSlider] = useState(false);
  const [correctionTargetId, setCorrectionTargetId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, editingMessageId, showCorrectionSlider]);

  // Reset correction slider state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      // Reset state when dialog closes
      setShowCorrectionSlider(false);
      setCorrectionTargetId(null);
      setCorrectionInput("");
    }
  }, [open]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if (!userInput.trim()) return;

    // Add user message
    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: userInput,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, newUserMessage]);
    setUserInput("");
    setIsTyping(true);

    // Simulate agent response after a delay
    setTimeout(() => {
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        content: `I understand you're saying "${userInput}". As ${agent.name}, I'm designed to help with ${agent.role.replace('_', ' ')} tasks. Could you provide more details about what you need assistance with?`,
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, agentResponse]);
      setIsTyping(false);
    }, 1500);
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

  const playTextToSpeech = (messageId: string, text: string) => {
    // This is a placeholder for actual text-to-speech functionality
    setSpeakingMessageId(messageId === speakingMessageId ? null : messageId);
    
    // Simulate speech ending after 3 seconds
    if (messageId !== speakingMessageId) {
      setTimeout(() => {
        setSpeakingMessageId(null);
      }, 3000);
    }
    
    console.log("Playing speech for:", text);
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

  const handleSubmitCorrectionFromSlider = () => {
    if (!correctionInput.trim() || !correctionTargetId) return;

    // Store the correction
    setMessages(prev => 
      prev.map(message => 
        message.id === correctionTargetId 
          ? { 
              ...message, 
              correction: correctionInput,
              feedback: "negative" // Ensure feedback is set to negative
            } 
          : message
      )
    );

    // In a real implementation, you would send this correction to your backend
    console.log("Correction submitted for message:", correctionTargetId, "Correction:", correctionInput);

    // Reset the correction slider state
    setShowCorrectionSlider(false);
    setCorrectionTargetId(null);
    setCorrectionInput("");
  };

  const handleSubmitCorrection = () => {
    if (!correctionInput.trim() || !editingMessageId) return;

    // Store the correction
    setMessages(prev => 
      prev.map(message => 
        message.id === editingMessageId 
          ? { 
              ...message, 
              correction: correctionInput,
              feedback: "negative" // Ensure feedback is set to negative
            } 
          : message
      )
    );

    // In a real implementation, you would send this correction to your backend
    console.log("Correction submitted for message:", editingMessageId, "Correction:", correctionInput);

    // Reset the editing state
    setEditingMessageId(null);
    setCorrectionInput("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] md:max-w-[700px] p-0 flex flex-col h-[750px] max-h-[85vh] overflow-hidden bg-white dark:bg-black border-0 shadow-xl rounded-2xl">
        <DialogHeader className="p-5 sticky top-0 bg-white dark:bg-black z-10 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-medium text-gray-900 dark:text-white">{agent.name}</DialogTitle>
              <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                {agent.role.replace('_', ' ')}
              </DialogDescription>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="rounded-full h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50 dark:bg-gray-950">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              } group`}
            >
              <div
                className={`max-w-[60%] px-4 py-3 relative shadow-sm ${
                  message.role === "user"
                    ? "bg-blue-500 text-white rounded-t-2xl rounded-l-2xl rounded-br-sm"
                    : message.feedback === "negative"
                    ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-red-200 dark:border-red-800 rounded-t-2xl rounded-r-2xl rounded-bl-sm"
                    : message.feedback === "positive"
                    ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-green-200 dark:border-green-800 rounded-t-2xl rounded-r-2xl rounded-bl-sm"
                    : "bg-white dark:bg-gray-900 text-gray-900 dark:text-white border border-gray-100 dark:border-gray-800 rounded-t-2xl rounded-r-2xl rounded-bl-sm"
                }`}
              >
                {message.role === "agent" && (
                  <div className="absolute top-1/2 -translate-y-1/2 -right-24 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 p-0 bg-white dark:bg-gray-800 rounded-full shadow-sm transition-all ${
                        speakingMessageId === message.id 
                          ? "text-blue-500 dark:text-blue-400 ring-2 ring-blue-500/20" 
                          : "text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                      }`}
                      onClick={() => playTextToSpeech(message.id, message.content)}
                      title="Listen to AI response"
                    >
                      <Volume2 className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-8 w-8 p-0 bg-white dark:bg-gray-800 rounded-full shadow-sm transition-all ${
                        message.feedback === "negative" 
                          ? "text-red-500 dark:text-red-400 ring-2 ring-red-500/20" 
                          : "text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
                      }`}
                      onClick={() => handleOpenCorrection(message.id)}
                      title="Correct this response"
                    >
                      <AlertCircle className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                {editingMessageId === message.id ? (
                  <div className="mt-2">
                    <p className="text-xs mb-2 text-gray-600 dark:text-gray-300">
                      Provide the correct answer:
                    </p>
                    <div className="flex flex-col space-y-2">
                      <Textarea
                        value={correctionInput}
                        onChange={(e) => setCorrectionInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="min-h-[80px] text-sm border border-gray-200 dark:border-gray-700 rounded-xl"
                        placeholder="Enter the correct response..."
                      />
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                          onClick={handleCancelEditing}
                        >
                          Cancel
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm"
                          className="bg-blue-500 hover:bg-blue-600 text-white"
                          onClick={handleSubmitCorrection}
                        >
                          Submit
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    
                    {/* Show the correction if there is one */}
                    {message.correction && (
                      <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Corrected to:</p>
                        <p className="text-sm leading-relaxed text-gray-900 dark:text-white">{message.correction}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-end mt-1">
                      <div
                        className={`text-[10px] ${
                          message.role === "user"
                            ? "text-blue-100"
                            : "text-gray-400 dark:text-gray-500"
                        }`}
                      >
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="px-4 py-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-t-2xl rounded-r-2xl rounded-bl-sm">
                <div className="flex space-x-1 h-5 items-center">
                  <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" style={{ animationDuration: "1.4s" }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" style={{ animationDuration: "1.2s", animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 animate-pulse" style={{ animationDuration: "1.4s", animationDelay: "300ms" }}></div>
                </div>
              </div>
            </div>
          )}
          
          {/* Invisible div at the end of messages to scroll to */}
          <div ref={messagesEndRef} />
        </div>

        {/* Correction panel */}
        {showCorrectionSlider && (
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-100 dark:border-gray-800 p-5 shadow-lg rounded-b-2xl animate-in slide-in-from-bottom duration-300 z-20">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">How should the AI have responded?</h3>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800" 
                onClick={handleCancelCorrectionSlider}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              value={correctionInput}
              onChange={(e) => setCorrectionInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="min-h-[100px] text-sm border border-gray-200 dark:border-gray-700 rounded-xl mb-4"
              placeholder="Enter the correct response the AI should have given..."
              autoFocus
            />
            <div className="flex justify-end space-x-3">
              <Button 
                variant="outline" 
                size="sm"
                className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border-gray-200 dark:border-gray-700"
                onClick={handleCancelCorrectionSlider}
              >
                Cancel
              </Button>
              <Button 
                variant="default" 
                size="sm"
                className="bg-blue-500 hover:bg-blue-600 text-white"
                onClick={handleSubmitCorrectionFromSlider}
                disabled={!correctionInput.trim()}
              >
                Submit Correction
              </Button>
            </div>
          </div>
        )}

        <div className={`p-5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-black ${showCorrectionSlider ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-200`}>
          {!editingMessageId && (
            <div className="relative flex items-center">
              <Textarea
                placeholder="Type your message..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[40px] h-10 max-h-[100px] resize-none pr-10 rounded-xl border-gray-200 dark:border-gray-700 focus-visible:ring-1 focus-visible:ring-blue-500 text-sm py-2.5 flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!userInput.trim()}
                className="absolute right-2 h-8 w-8 p-0 rounded-full bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex justify-between items-center mt-4">
            <p className="text-xs text-gray-500">Training helps improve agent responses</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs h-8 rounded-full border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800" 
              onClick={() => onOpenChange(false)}
            >
              <Check className="h-3 w-3 mr-1" />
              Done Training
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
