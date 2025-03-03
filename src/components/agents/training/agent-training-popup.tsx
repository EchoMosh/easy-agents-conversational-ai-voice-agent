import React, { useState, useRef, useEffect } from "react";
import { Check, Volume2, Send, X, AlertCircle, Edit, Trash2, Plus, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Agent, TrainingExample } from "@/types/agent-types";
import { Input } from "@/components/ui/input";
import { sendUserMessage } from "@/utils/agent-training-api";
import { useToast } from "@/hooks/use-toast";
import { FlowData, FlowNode } from "@/types/agent-types";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";

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
  onOpenChange
}: AgentTrainingPopupProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [correctionInput, setCorrectionInput] = useState("");
  const [showCorrectionSlider, setShowCorrectionSlider] = useState(false);
  const [correctionTargetId, setCorrectionTargetId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("chat");
  const [trainingExamples, setTrainingExamples] = useState<TrainingExample[]>([]);
  const [isLoadingExamples, setIsLoadingExamples] = useState(false);
  const [editingExampleId, setEditingExampleId] = useState<string | null>(null);
  const [newExampleUserMessage, setNewExampleUserMessage] = useState("");
  const [newExampleAiResponse, setNewExampleAiResponse] = useState("");
  const [newExampleCorrection, setNewExampleCorrection] = useState("");
  const [isAddingExample, setIsAddingExample] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const initialized = useRef(false);

  useEffect(() => {
    if (open && agent?.id) {
      fetchTrainingExamples();
    }
  }, [open, agent?.id]);

  const fetchTrainingExamples = async () => {
    if (!agent?.id) return;
    
    setIsLoadingExamples(true);
    try {
      const { data, error } = await supabase
        .from('agent_training_examples')
        .select('*')
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[TrainingPopup] Error fetching training examples:', error);
        throw error;
      }
      
      setTrainingExamples(data || []);
    } catch (error) {
      console.error('[TrainingPopup] Failed to fetch training examples:', error);
      toast({
        title: "Error",
        description: "Failed to load training examples",
        variant: "destructive",
      });
    } finally {
      setIsLoadingExamples(false);
    }
  };

  const findFirstMessage = (flowData: FlowData): string => {
    if (!flowData || !flowData.nodes || !Array.isArray(flowData.nodes) || flowData.nodes.length === 0) {
      return `Hi there! I'm ${agent.name}, your ${agent.role.replace('_', ' ')}. How can I help you today?`;
    }

    const greetingNodes = flowData.nodes.filter(
      (node: FlowNode) => node.type === 'greetingNode' || node.type === 'speakNode'
    );

    if (greetingNodes.length === 0) {
      return `Hi there! I'm ${agent.name}, your ${agent.role.replace('_', ' ')}. How can I help you today?`;
    }

    const firstNode = greetingNodes[0];
    if (firstNode.data) {
      if (firstNode.type === 'greetingNode' && firstNode.data.greeting) {
        return String(firstNode.data.greeting);
      } else if (firstNode.type === 'speakNode' && firstNode.data.message) {
        return String(firstNode.data.message);
      }
    }

    return `Hi there! I'm ${agent.name}, your ${agent.role.replace('_', ' ')}. How can I help you today?`;
  };

  useEffect(() => {
    if (open && !initialized.current) {
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
        
        const firstMessage = findFirstMessage(flowData);
        console.log('[AgentTrainingPopup] First message from flow:', firstMessage);
        
        setMessages([{
          id: "1",
          role: "agent",
          content: firstMessage,
          timestamp: new Date()
        }]);
        
        initialized.current = true;
      } catch (error) {
        console.error('[AgentTrainingPopup] Error initializing training:', error);
        toast({
          title: "Error",
          description: "Failed to initialize training session",
          variant: "destructive",
        });
        
        setMessages([{
          id: "1",
          role: "agent",
          content: `Hi there! I'm ${agent.name}, your ${agent.role.replace('_', ' ')}. I'm here to help you with anything you need. How can I assist you today?`,
          timestamp: new Date()
        }]);
      } finally {
        setIsInitializing(false);
      }
    }
    
    if (!open) {
      setShowCorrectionSlider(false);
      setCorrectionTargetId(null);
      setCorrectionInput("");
      initialized.current = false;
      setMessages([]);
    }
  }, [open, agent]);

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

    try {
      const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      conversationHistory.push({
        role: "user",
        content: userInput
      });
      
      const response = await sendUserMessage(agent.id, userInput, conversationHistory);
      
      const agentResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        content: response.message || `I understand you're saying "${userInput}". As ${agent.name}, I'm designed to help with ${agent.role.replace('_', ' ')} tasks.`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, agentResponse]);
    } catch (error) {
      console.error('[AgentTrainingPopup] Error sending message:', error);
      
      const fallbackResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        content: `I understand you're saying "${userInput}". As ${agent.name}, I'm designed to help with ${agent.role.replace('_', ' ')} tasks. Could you provide more details about what you need assistance with?`,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackResponse]);
    } finally {
      setIsTyping(false);
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

  const playTextToSpeech = (messageId: string, text: string) => {
    setSpeakingMessageId(messageId === speakingMessageId ? null : messageId);

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

  const saveTrainingExample = async (
    agentId: string, 
    userMessage: string, 
    aiResponse: string, 
    correctedResponse: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('agent_training_examples')
        .insert({
          agent_id: agentId,
          user_message: userMessage,
          ai_response: aiResponse,
          corrected_response: correctedResponse,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select();

      if (error) {
        console.error('[TrainingPopup] Error saving training example:', error);
        toast({
          title: "Error",
          description: "Failed to save training example",
          variant: "destructive",
        });
        return null;
      } else {
        console.log('[TrainingPopup] Training example saved successfully:', data);
        toast({
          title: "Success",
          description: "Training example saved",
        });
        
        fetchTrainingExamples();
        return data[0];
      }
    } catch (error) {
      console.error('[TrainingPopup] Error saving training example:', error);
      return null;
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

  const handleDeleteExample = async (exampleId: string) => {
    try {
      const { error } = await supabase
        .from('agent_training_examples')
        .delete()
        .eq('id', exampleId);
      
      if (error) {
        console.error('[TrainingPopup] Error deleting training example:', error);
        toast({
          title: "Error",
          description: "Failed to delete training example",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Training example deleted",
        });
        
        fetchTrainingExamples();
      }
    } catch (error) {
      console.error('[TrainingPopup] Error deleting training example:', error);
    }
  };

  const handleSaveExampleEdit = async (exampleId: string) => {
    const example = trainingExamples.find(ex => ex.id === exampleId);
    if (!example) return;
    
    try {
      const { error } = await supabase
        .from('agent_training_examples')
        .update({
          user_message: example.user_message,
          ai_response: example.ai_response,
          corrected_response: example.corrected_response
        })
        .eq('id', exampleId);
      
      if (error) {
        console.error('[TrainingPopup] Error updating training example:', error);
        toast({
          title: "Error",
          description: "Failed to update training example",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Training example updated",
        });
        setEditingExampleId(null);
      }
    } catch (error) {
      console.error('[TrainingPopup] Error updating training example:', error);
    }
  };

  const handleAddNewExample = async () => {
    if (!newExampleUserMessage || !newExampleAiResponse || !newExampleCorrection) {
      toast({
        title: "Error",
        description: "All fields are required to add a training example",
        variant: "destructive",
      });
      return;
    }
    
    const result = await saveTrainingExample(
      agent.id,
      newExampleUserMessage,
      newExampleAiResponse,
      newExampleCorrection
    );
    
    if (result) {
      setNewExampleUserMessage("");
      setNewExampleAiResponse("");
      setNewExampleCorrection("");
      setIsAddingExample(false);
    }
  };

  const handleCancelAddExample = () => {
    setIsAddingExample(false);
    setNewExampleUserMessage("");
    setNewExampleAiResponse("");
    setNewExampleCorrection("");
  };

  const updateExampleField = (exampleId: string, field: keyof TrainingExample, value: string) => {
    setTrainingExamples(examples => 
      examples.map(ex => 
        ex.id === exampleId ? { ...ex, [field]: value } : ex
      )
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] md:max-w-[700px] p-0 flex flex-col h-[750px] max-h-[85vh] overflow-hidden bg-background">
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid grid-cols-2 mx-4 mt-2">
            <TabsTrigger value="chat" className="flex items-center gap-1">
              <MessageSquare className="w-4 h-4" />
              Chat Training
            </TabsTrigger>
            <TabsTrigger value="examples" className="flex items-center gap-1">
              <Edit className="w-4 h-4" />
              Training Examples
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden p-0 m-0">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-gray-900/90">
              {isInitializing ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  {messages.map(message => (
                    <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[60%] rounded-2xl px-4 py-2 shadow-sm relative group ${message.role === "user" ? "bg-blue-500 text-white rounded-br-none" : message.feedback === "negative" ? "bg-red-100 dark:bg-red-900 rounded-bl-none" : message.feedback === "positive" ? "bg-green-100 dark:bg-green-900 rounded-bl-none" : "bg-white dark:bg-gray-800/30 rounded-bl-none"}`}>
                        {message.role === "agent" && (
                          <div className="absolute top-1/2 -translate-y-1/2 -right-28 flex space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-9 w-9 p-0 bg-white dark:bg-gray-700 rounded-full shadow-sm opacity-40 group-hover:opacity-100 transition-opacity ${speakingMessageId === message.id ? "text-blue-500 dark:text-blue-400 opacity-100" : "text-gray-500 dark:text-gray-400"}`}
                              onClick={() => playTextToSpeech(message.id, message.content)}
                              title="Listen to AI response"
                            >
                              <Volume2 className="h-5 w-5" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-9 w-9 p-0 bg-white dark:bg-gray-700 rounded-full shadow-sm opacity-40 group-hover:opacity-100 transition-opacity ${message.feedback === "negative" ? "text-red-500 dark:text-red-400 opacity-100" : "text-gray-500 dark:text-gray-400"}`}
                              onClick={() => handleOpenCorrection(message.id)}
                              title="Correct this response"
                            >
                              <AlertCircle className="h-5 w-5" />
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
                                className="min-h-[80px] text-sm border border-gray-300 dark:border-gray-700"
                                placeholder="Enter the correct response..."
                              />
                              <div className="flex justify-end space-x-2">
                                <Button variant="ghost" size="sm" onClick={handleCancelEditing}>
                                  Cancel
                                </Button>
                                <Button variant="default" size="sm" onClick={handleSubmitCorrection}>
                                  Submit Correction
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-lg leading-relaxed">{message.content}</p>
                            
                            {message.correction && (
                              <div className="mt-2 p-2 bg-white dark:bg-gray-950 rounded border border-green-300 dark:border-green-700">
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Corrected to:</p>
                                <p className="text-sm leading-relaxed text-green-700 dark:text-green-400">{message.correction}</p>
                              </div>
                            )}
                            
                            <div className="flex justify-end mt-1">
                              <div className={`text-[10px] ${message.role === "user" ? "text-blue-100" : "text-gray-500 dark:text-gray-400"}`}>
                                {new Date(message.timestamp).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit"
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
                      <div className="max-w-[50%] rounded-2xl px-4 py-2 bg-white dark:bg-gray-800/30 rounded-bl-none">
                        <div className="flex space-x-1 h-5 items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></div>
                          <div
                            className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"
                            style={{
                              animationDelay: "150ms"
                            }}
                          ></div>
                          <div
                            className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"
                            style={{
                              animationDelay: "300ms"
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
              <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 p-4 transition-transform duration-300 transform translate-y-0 z-20">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-medium">How should the AI have responded?</h3>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCancelCorrectionSlider}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <Textarea
                  value={correctionInput}
                  onChange={e => setCorrectionInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="min-h-[100px] text-sm border border-gray-300 dark:border-gray-700 mb-3"
                  placeholder="Enter the correct response the AI should have given..."
                  autoFocus
                />
                <div className="flex justify-end space-x-2">
                  <Button variant="ghost" size="sm" onClick={handleCancelCorrectionSlider}>
                    Cancel
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSubmitCorrectionFromSlider}
                    disabled={!correctionInput.trim()}
                  >
                    Submit Correction
                  </Button>
                </div>
              </div>
            )}

            <div className={`p-4 border-t bg-white dark:bg-gray-950 ${showCorrectionSlider ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-200`}>
              {!editingMessageId && (
                <div className="relative flex items-center">
                  <Textarea
                    placeholder="Type your message..."
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="min-h-[40px] h-10 max-h-[100px] resize-none pr-3 rounded-md border-gray-300 dark:border-gray-700 focus-visible:outline-none focus-visible:ring-0 text-sm py-2 shadow-sm flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!userInput.trim() || isTyping}
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
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="examples" className="flex-1 overflow-hidden p-0 m-0 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-gray-900/90">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Saved Training Examples</h3>
                {!isAddingExample && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setIsAddingExample(true)}
                    className="flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add Example
                  </Button>
                )}
              </div>
              
              {isLoadingExamples ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : (
                <>
                  {isAddingExample && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg border p-4 mb-4 space-y-3">
                      <h4 className="font-medium text-sm mb-2">New Training Example</h4>
                      
                      <div>
                        <Label htmlFor="user-message" className="text-xs mb-1 block">User Message</Label>
                        <Textarea
                          id="user-message"
                          placeholder="What the user says..."
                          value={newExampleUserMessage}
                          onChange={e => setNewExampleUserMessage(e.target.value)}
                          className="min-h-[80px] text-sm"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="ai-response" className="text-xs mb-1 block">AI Response</Label>
                        <Textarea
                          id="ai-response"
                          placeholder="The AI's response that needs correction..."
                          value={newExampleAiResponse}
                          onChange={e => setNewExampleAiResponse(e.target.value)}
                          className="min-h-[80px] text-sm"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="correction" className="text-xs mb-1 block">Corrected Response</Label>
                        <Textarea
                          id="correction"
                          placeholder="How the AI should have responded..."
                          value={newExampleCorrection}
                          onChange={e => setNewExampleCorrection(e.target.value)}
                          className="min-h-[80px] text-sm"
                        />
                      </div>
                      
                      <div className="flex justify-end gap-2 mt-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={handleCancelAddExample}
                        >
                          Cancel
                        </Button>
                        <Button 
                          variant="default" 
                          size="sm" 
                          onClick={handleAddNewExample}
                        >
                          Save Example
                        </Button>
                      </div>
                    </div>
                  )}
                
                  {trainingExamples.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <p>No training examples yet. Add some or create them while chatting with the agent.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {trainingExamples.map((example) => (
                        <div 
                          key={example.id} 
                          className="bg-white dark:bg-gray-800 rounded-lg border p-4 space-y-3"
                        >
                          {editingExampleId === example.id ? (
                            <>
                              <div>
                                <Label htmlFor={`edit-user-${example.id}`} className="text-xs mb-1 block">User Message</Label>
                                <Textarea
                                  id={`edit-user-${example.id}`}
                                  value={example.user_message}
                                  onChange={e => updateExampleField(example.id, 'user_message', e.target.value)}
                                  className="min-h-[60px] text-sm"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor={`edit-ai-${example.id}`} className="text-xs mb-1 block">AI Response</Label>
                                <Textarea
                                  id={`edit-ai-${example.id}`}
                                  value={example.ai_response}
                                  onChange={e => updateExampleField(example.id, 'ai_response', e.target.value)}
                                  className="min-h-[60px] text-sm"
                                />
                              </div>
                              
                              <div>
                                <Label htmlFor={`edit-correction-${example.id}`} className="text-xs mb-1 block">Corrected Response</Label>
                                <Textarea
                                  id={`edit-correction-${example.id}`}
                                  value={example.corrected_response}
                                  onChange={e => updateExampleField(example.id, 'corrected_response', e.target.value)}
                                  className="min-h-[60px] text-sm"
                                />
                              </div>
                              
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => setEditingExampleId(null)}
                                >
                                  Cancel
                                </Button>
                                <Button 
                                  variant="default" 
                                  size="sm" 
                                  onClick={() => handleSaveExampleEdit(example.id)}
                                >
                                  Save Changes
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">User Message:</p>
                                <p className="text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded border">{example.user_message}</p>
                              </div>
                              
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">AI Response:</p>
                                <p className="text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded border">{example.ai_response}</p>
                              </div>
                              
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Corrected Response:</p>
                                <p className="text-sm bg-green-50 dark:bg-green-900/20 p-2 rounded border">{example.corrected_response}</p>
                              </div>
                              
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => handleDeleteExample(example.id)}
                                  className="h-8 w-8 text-red-500 hover:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => setEditingExampleId(example.id)}
                                  className="h-8 w-8"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div className="p-4 border-t bg-white dark:bg-gray-950">
              <div className="flex justify-between items-center">
                <p className="text-xs text-gray-500">Training examples help improve agent responses</p>
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
