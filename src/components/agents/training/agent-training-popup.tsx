
import React, { useState, useRef, useEffect } from "react";
import { Check, Volume2, Send, X } from "lucide-react";
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
import { Input } from "@/components/ui/input";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, editingMessageId]);

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
      } else {
        handleSendMessage();
      }
    }
  };

  const playTextToSpeech = (messageId: string, text: string) => {
    // This is a placeholder for actual text-to-speech functionality
    // In a real implementation, you would call a TTS API or use the Web Speech API
    
    // For now, we'll just toggle the speaking state to show visual feedback
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
    // to use for retraining the model
    console.log("Correction submitted for message:", editingMessageId, "Correction:", correctionInput);

    // Reset the editing state
    setEditingMessageId(null);
    setCorrectionInput("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] md:max-w-[600px] p-0 flex flex-col h-[650px] max-h-[80vh] overflow-hidden bg-background">
        <DialogHeader className="p-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-left">{agent.name}</DialogTitle>
              <DialogDescription className="text-left capitalize">
                {agent.role.replace('_', ' ')}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2 shadow-sm relative group ${
                  message.role === "user"
                    ? "bg-blue-500 text-white rounded-br-none"
                    : message.feedback === "negative"
                    ? "bg-red-100 dark:bg-red-900 rounded-bl-none"
                    : message.feedback === "positive"
                    ? "bg-green-100 dark:bg-green-900 rounded-bl-none"
                    : "bg-gray-200 dark:bg-gray-800 rounded-bl-none"
                }`}
              >
                {message.role === "agent" && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`absolute top-1/2 -translate-y-1/2 -right-10 h-9 w-9 p-0 bg-white dark:bg-gray-700 rounded-full shadow-sm opacity-40 group-hover:opacity-100 transition-opacity ${
                      speakingMessageId === message.id 
                        ? "text-blue-500 dark:text-blue-400 opacity-100" 
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                    onClick={() => playTextToSpeech(message.id, message.content)}
                    title="Listen to AI response"
                  >
                    <Volume2 className="h-5 w-5" />
                  </Button>
                )}
                
                {editingMessageId === message.id ? (
                  <div className="mt-2">
                    <p className="text-xs mb-1 text-gray-600 dark:text-gray-300">
                      Provide the correct answer:
                    </p>
                    <div className="flex flex-col space-y-2">
                      <Textarea
                        value={correctionInput}
                        onChange={(e) => setCorrectionInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="min-h-[80px] text-sm border border-gray-300 dark:border-gray-700"
                        placeholder="Enter the correct response..."
                      />
                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={handleCancelEditing}
                        >
                          Cancel
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm"
                          onClick={handleSubmitCorrection}
                        >
                          Submit Correction
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    
                    {/* Show the correction if there is one */}
                    {message.correction && (
                      <div className="mt-2 p-2 bg-white dark:bg-gray-950 rounded border border-green-300 dark:border-green-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Corrected to:</p>
                        <p className="text-sm leading-relaxed text-green-700 dark:text-green-400">{message.correction}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-end mt-1">
                      <div
                        className={`text-[10px] ${
                          message.role === "user"
                            ? "text-blue-100"
                            : "text-gray-500 dark:text-gray-400"
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
              <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-gray-200 dark:bg-gray-800 rounded-bl-none">
                <div className="flex space-x-1 h-5 items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" style={{ animationDelay: "300ms" }}></div>
                </div>
              </div>
            </div>
          )}
          
          {/* Invisible div at the end of messages to scroll to */}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t bg-white dark:bg-gray-950">
          {!editingMessageId && (
            <div className="relative flex items-center">
              <Textarea
                placeholder="Type your message..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[40px] h-10 max-h-[100px] resize-none pr-3 rounded-md border-gray-300 dark:border-gray-700 focus-visible:outline-none focus-visible:ring-0 text-sm py-2 shadow-sm flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!userInput.trim()}
                className="ml-2 h-10 py-2.5 rounded-md bg-blue-500 hover:bg-blue-600 transition-colors"
                size="sm"
              >
                <Send className="h-4 w-4 mr-1" />
                Send
              </Button>
            </div>
          )}
          <div className="flex justify-between items-center mt-4">
            <p className="text-xs text-gray-500">Training helps improve agent responses</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs h-8 rounded-md" 
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
