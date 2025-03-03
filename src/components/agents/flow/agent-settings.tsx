
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Play, Pause, Info, VolumeX, Volume2, Book, Edit, Plus, Trash } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { fetchDocuments } from "@/utils/knowledge-api";
import { supabase } from "@/integrations/supabase/client";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TrainingExample } from "@/types/agent-types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Available voices data
const voices = [
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", gender: "female" },
  { id: "UgBBYS2sOqTuMpoF3BR0", name: "Thomas", gender: "male" },
  { id: "pwMBn0SsmN1220Aorv15", name: "Michael", gender: "male" }
];

// Languages data for the dropdown select
const languages = [
  { id: "en-US", name: "English (US)" },
  { id: "en-GB", name: "English (UK)" },
  { id: "es-ES", name: "Spanish" },
  { id: "fr-FR", name: "French" },
  { id: "de-DE", name: "German" },
  { id: "it-IT", name: "Italian" },
  { id: "pt-BR", name: "Portuguese (Brazil)" },
  { id: "nl-NL", name: "Dutch" },
];

interface AgentSettingsProps {
  agentId: string;
  currentVoice?: string;
  currentLanguage?: string;
  currentHumorLevel?: number;
  children: React.ReactNode;
  onUpdateSettings: (settings: {
    voiceId?: string;
    language?: string;
    knowledgeBaseId?: string;
    humorLevel?: number;
  }) => Promise<void>;
}

export function AgentSettings({
  agentId,
  currentVoice,
  currentLanguage,
  currentHumorLevel = 50,
  children,
  onUpdateSettings,
}: AgentSettingsProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedVoice, setSelectedVoice] = React.useState(currentVoice || voices[0].id);
  const [language, setLanguage] = React.useState(currentLanguage || "en-US");
  const [knowledgeBase, setKnowledgeBase] = React.useState("none");
  const [humorLevel, setHumorLevel] = React.useState(currentHumorLevel);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPreviewingVoice, setIsPreviewingVoice] = React.useState(false);
  const [audioElement, setAudioElement] = React.useState<HTMLAudioElement | null>(null);
  const [showVoiceInfo, setShowVoiceInfo] = React.useState(false);
  const { toast } = useToast();
  
  // Training examples section states
  const [trainingExamples, setTrainingExamples] = React.useState<TrainingExample[]>([]);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showExampleEditor, setShowExampleEditor] = React.useState(false);
  const [currentExample, setCurrentExample] = React.useState<TrainingExample | null>(null);
  const [isAddingExample, setIsAddingExample] = React.useState(false);

  // New training example form state
  const [userMessage, setUserMessage] = React.useState("");
  const [aiResponse, setAiResponse] = React.useState("");
  const [correctedResponse, setCorrectedResponse] = React.useState("");
  
  const currentVoiceObject = React.useMemo(() => 
    voices.find(v => v.id === selectedVoice) || voices[0],
  [selectedVoice]);
  
  const { data: knowledgeDocuments, isLoading: isLoadingDocuments, refetch } = useQuery({
    queryKey: ['knowledgeDocuments'],
    queryFn: fetchDocuments,
    staleTime: 0,
  });
  
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio();
      
      audio.onended = () => {
        console.log("Audio playback ended naturally");
        setIsPreviewingVoice(false);
      };
      
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        console.error('Audio error code:', audio.error?.code);
        console.error('Audio error message:', audio.error?.message);
        setIsPreviewingVoice(false);
        toast({
          title: "Error",
          description: `Audio playback failed: ${audio.error?.message || 'Unknown error'}`,
          variant: "destructive",
        });
      };
      
      setAudioElement(audio);
    }
    
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.src = '';
      }
    };
  }, []);
  
  React.useEffect(() => {
    if (open) {
      refetch();
      
      const fetchAgentData = async () => {
        try {
          // Fetch agent settings
          const { data: agentData, error: agentError } = await supabase
            .from('agents')
            .select('knowledge_ids, voice_id, language, humor_level')
            .eq('id', agentId)
            .maybeSingle();
            
          if (agentError) throw agentError;
          
          if (agentData) {
            if (agentData.voice_id) {
              setSelectedVoice(agentData.voice_id);
            }
            
            if (agentData.language) {
              setLanguage(agentData.language);
            }
            
            if (agentData.humor_level !== undefined && agentData.humor_level !== null) {
              setHumorLevel(agentData.humor_level);
            }
            
            if (agentData.knowledge_ids && agentData.knowledge_ids.length > 0) {
              setKnowledgeBase(agentData.knowledge_ids[0]);
            } else {
              setKnowledgeBase("none");
            }
          }
          
          // Fetch training examples from the dedicated table
          const { data: examplesData, error: examplesError } = await supabase
            .from('agent_training_examples')
            .select('id, user_message, ai_response, corrected_response, created_at')
            .eq('agent_id', agentId)
            .order('created_at', { ascending: false });
            
          if (examplesError) throw examplesError;
          
          if (examplesData) {
            // Convert to the TrainingExample format
            const examples: TrainingExample[] = examplesData.map(ex => ({
              id: ex.id,
              user_message: ex.user_message,
              ai_response: ex.ai_response,
              corrected_response: ex.corrected_response,
              created_at: ex.created_at
            }));
            
            setTrainingExamples(examples);
          } else {
            setTrainingExamples([]);
          }
        } catch (error) {
          console.error("Error fetching agent data:", error);
          toast({
            title: "Error",
            description: "Failed to fetch agent data",
            variant: "destructive",
          });
        }
      };
      
      fetchAgentData();
    }
  }, [open, agentId, refetch]);
  
  const knowledgeBases = React.useMemo(() => {
    const documents = knowledgeDocuments || [];
    return [
      { id: "none", name: "None" },
      ...documents.map(doc => ({ id: doc.id, name: doc.title })),
    ];
  }, [knowledgeDocuments]);

  const filteredExamples = React.useMemo(() => {
    if (!searchQuery) return trainingExamples;
    
    const query = searchQuery.toLowerCase();
    return trainingExamples.filter(example => 
      example.user_message.toLowerCase().includes(query) ||
      example.ai_response.toLowerCase().includes(query) ||
      example.corrected_response.toLowerCase().includes(query)
    );
  }, [trainingExamples, searchQuery]);

  const handleSaveExample = async () => {
    if (!userMessage || !aiResponse || !correctedResponse) {
      toast({
        title: "Validation Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      if (isAddingExample) {
        // Insert new example into the database
        const { error: insertError } = await supabase
          .from('agent_training_examples')
          .insert({
            agent_id: agentId,
            user_id: (await supabase.auth.getUser()).data.user?.id,
            user_message: userMessage,
            ai_response: aiResponse,
            corrected_response: correctedResponse
          });
          
        if (insertError) throw insertError;
      } else if (currentExample?.id) {
        // Update existing example
        const { error: updateError } = await supabase
          .from('agent_training_examples')
          .update({
            user_message: userMessage,
            ai_response: aiResponse,
            corrected_response: correctedResponse
          })
          .eq('id', currentExample.id);
          
        if (updateError) throw updateError;
      }
      
      // Refresh the training examples list
      const { data: refreshedData, error: refreshError } = await supabase
        .from('agent_training_examples')
        .select('id, user_message, ai_response, corrected_response, created_at')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });
        
      if (refreshError) throw refreshError;
      
      if (refreshedData) {
        setTrainingExamples(refreshedData.map(ex => ({
          id: ex.id,
          user_message: ex.user_message,
          ai_response: ex.ai_response,
          corrected_response: ex.corrected_response,
          created_at: ex.created_at
        })));
      }
      
      setUserMessage("");
      setAiResponse("");
      setCorrectedResponse("");
      setShowExampleEditor(false);
      setIsAddingExample(false);
      setCurrentExample(null);
      
      toast({
        title: "Success",
        description: isAddingExample ? "Example added successfully" : "Example updated successfully",
      });
    } catch (error) {
      console.error("Error saving training example:", error);
      toast({
        title: "Error",
        description: `Failed to save training example: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteExample = async (exampleId: string) => {
    try {
      setIsLoading(true);
      
      // Delete the example from the database
      const { error: deleteError } = await supabase
        .from('agent_training_examples')
        .delete()
        .eq('id', exampleId);
        
      if (deleteError) throw deleteError;
      
      // Update the local state
      setTrainingExamples(prev => prev.filter(ex => ex.id !== exampleId));
      
      toast({
        title: "Success",
        description: "Example deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting training example:", error);
      toast({
        title: "Error",
        description: `Failed to delete training example: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditExample = (example: TrainingExample) => {
    setCurrentExample(example);
    setUserMessage(example.user_message);
    setAiResponse(example.ai_response);
    setCorrectedResponse(example.corrected_response);
    setIsAddingExample(false);
    setShowExampleEditor(true);
  };

  const handleAddExample = () => {
    setCurrentExample(null);
    setUserMessage("");
    setAiResponse("");
    setCorrectedResponse("");
    setIsAddingExample(true);
    setShowExampleEditor(true);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      console.log("Saving agent settings:", {
        agentId,
        voice: selectedVoice,
        language,
        humorLevel,
        knowledgeBase
      });
      
      const updateData = {
        voice_id: selectedVoice,
        language: language,
        humor_level: humorLevel,
        knowledge_ids: knowledgeBase && knowledgeBase !== "none" ? [knowledgeBase] : []
      };
      
      console.log("Updating agent with data:", updateData);
      
      const { data, error } = await supabase
        .from('agents')
        .update(updateData)
        .eq('id', agentId)
        .select();
      
      if (error) {
        console.error("Supabase update error:", error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log("Supabase update result:", data);
      
      try {
        await onUpdateSettings({
          voiceId: selectedVoice,
          language,
          knowledgeBaseId: knowledgeBase === "none" ? null : knowledgeBase,
          humorLevel: humorLevel,
        });
      } catch (callbackError) {
        console.error("onUpdateSettings callback error:", callbackError);
      }
      
      toast({
        title: "Success",
        description: "Agent settings updated",
      });
      setOpen(false);
    } catch (error) {
      console.error("Error updating agent settings:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update agent settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const previewVoice = async () => {
    if (!audioElement) {
      console.error('Audio element not initialized');
      toast({
        title: "Error",
        description: "Audio player not initialized. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    if (isPreviewingVoice) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setIsPreviewingVoice(false);
      return;
    }
    
    try {
      setIsPreviewingVoice(true);
      
      console.log("Previewing voice:", selectedVoice);
      
      const previewText = selectedVoice === "UgBBYS2sOqTuMpoF3BR0" 
        ? "Nice to meet you! I'm your new AI voice, here to perform CPR on whatever the heck died on this page you're calling a script."
        : (selectedVoice === "pwMBn0SsmN1220Aorv15"
          ? "I'm Michael, your new AI voice assistant, ready to make your app sound amazing."
          : "Hello, this is a preview of my voice.");
      
      const payload = { 
        text: previewText,
        voice_id: selectedVoice,
        model_id: "eleven_multilingual_v2"
      };
      
      console.log("Sending text-to-speech request with payload:", payload);
      
      const response = await supabase.functions.invoke('text-to-speech', {
        method: 'POST',
        body: payload,
      });
      
      console.log("Received response from edge function:", response);
      
      if (response.error) {
        throw new Error(`Failed to generate voice preview: ${response.error}`);
      }
      
      if (!response.data) {
        throw new Error('No data returned from the edge function');
      }
      
      if (!response.data.audio_content) {
        if (response.data.error) {
          throw new Error(`ElevenLabs API error: ${response.data.error}`);
        }
        throw new Error('No audio content received from the text-to-speech function');
      }
      
      console.log("Received audio content, length:", response.data.audio_content.length);
      
      const binaryData = atob(response.data.audio_content);
      const bytes = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i);
      }
      
      const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      console.log("Created audio URL:", audioUrl);
      
      audioElement.src = audioUrl;
      audioElement.load();
      
      console.log("Starting audio playback");
      
      try {
        await audioElement.play();
        console.log("Audio playback started successfully");
      } catch (playError) {
        console.error('Error playing audio:', playError);
        setIsPreviewingVoice(false);
        URL.revokeObjectURL(audioUrl);
        throw new Error(`Failed to play audio: ${playError.message}`);
      }
      
      audioElement.onended = () => {
        console.log("Audio playback ended");
        setIsPreviewingVoice(false);
        URL.revokeObjectURL(audioUrl);
      };
    } catch (error) {
      console.error('Error previewing voice:', error);
      toast({
        title: "Error",
        description: "Failed to preview voice: " + (error instanceof Error ? error.message : String(error)),
        variant: "destructive",
      });
      setIsPreviewingVoice(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 border-0 shadow-xl">
          <div className="relative">
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 text-white">
              <DialogTitle className="text-2xl font-bold tracking-tight mb-1">Agent Settings</DialogTitle>
              <DialogDescription className="text-white/90 text-sm">
                Configure your agent's voice, language, and knowledge settings
              </DialogDescription>
            </div>
            
            <div className="p-6 max-h-[calc(80vh-140px)] overflow-y-auto space-y-8">
              <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
                <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                  <Volume2 className="h-5 w-5 text-purple-500" /> 
                  Voice Settings
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="voice" className="text-sm font-medium mb-2 block">Voice</Label>
                    <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                      <Select onValueChange={setSelectedVoice} value={selectedVoice}>
                        <SelectTrigger className="w-full bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-lg">
                          <SelectValue placeholder="Select voice" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-gray-900">
                          {voices.map((voice) => (
                            <SelectItem key={voice.id} value={voice.id} className="focus:bg-gray-100 dark:focus:bg-gray-800">
                              {voice.name} ({voice.gender})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={previewVoice}
                        className="h-10 w-10 rounded-lg border-gray-200 dark:border-gray-700"
                      >
                        {isPreviewingVoice ? 
                          <Pause className="h-4 w-4 text-gray-700 dark:text-gray-300" /> : 
                          <Play className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                        }
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setShowVoiceInfo(!showVoiceInfo)}
                        className="h-10 w-10 rounded-lg border-gray-200 dark:border-gray-700"
                      >
                        <Info className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                      </Button>
                    </div>
                  </div>
                  
                  {showVoiceInfo && (
                    <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-sm text-gray-600 dark:text-gray-400 animate-fade-in">
                      <p>This voice is provided by ElevenLabs and is optimized for natural-sounding speech in multiple languages.</p>
                    </div>
                  )}
                </div>
              </div>
                
              <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="language" className="text-sm font-medium mb-1 block">Language</Label>
                  <Select onValueChange={setLanguage} value={language}>
                    <SelectTrigger className="w-full bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-lg">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-900">
                      {languages.map((l) => (
                        <SelectItem key={l.id} value={l.id} className="focus:bg-gray-100 dark:focus:bg-gray-800">
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between mb-1">
                    <Label htmlFor="humor" className="text-sm font-medium">Humor Level</Label>
                    <span className="text-sm font-medium text-purple-600 dark:text-purple-400">{humorLevel}%</span>
                  </div>
                  <Slider
                    id="humor"
                    min={0}
                    max={100}
                    step={10}
                    value={[humorLevel]}
                    onValueChange={(values) => setHumorLevel(values[0])}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Serious</span>
                    <span>Balanced</span>
                    <span>Humorous</span>
                  </div>
                </div>
              </div>
                
              <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
                <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                  <Info className="h-5 w-5 text-blue-500" /> 
                  Knowledge Settings
                </h3>
                
                <div className="space-y-3">
                  <Label htmlFor="knowledge" className="text-sm font-medium mb-1 block">Knowledge Base</Label>
                  <Select onValueChange={setKnowledgeBase} value={knowledgeBase}>
                    <SelectTrigger className="w-full bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-lg">
                      <SelectValue placeholder={isLoadingDocuments ? "Loading..." : "Select knowledge base"} />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-900">
                      {knowledgeBases.map((kb) => (
                        <SelectItem key={kb.id} value={kb.id} className="focus:bg-gray-100 dark:focus:bg-gray-800">
                          {kb.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Connect a knowledge base to your agent to provide it with specific information
                  </p>
                </div>
              </div>
              
              <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
                <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                  <Book className="h-5 w-5 text-emerald-500" /> 
                  Training Examples
                </h3>
                
                {!showExampleEditor ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="relative flex-1 mr-2">
                        <Input
                          type="text"
                          placeholder="Search examples..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-lg pr-8"
                        />
                      </div>
                      <Button 
                        onClick={handleAddExample}
                        variant="outline"
                        className="h-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 rounded-lg flex items-center gap-1"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add</span>
                      </Button>
                    </div>
                    
                    {filteredExamples.length === 0 ? (
                      <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                        {searchQuery ? "No examples match your search" : "No training examples yet"}
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {filteredExamples.map((example, index) => (
                          <Card key={example.id || index} className="border border-gray-200 dark:border-gray-700 shadow-sm">
                            <CardHeader className="p-3 pb-0">
                              <CardTitle className="text-sm font-medium flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400">User Message</span>
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleEditExample(example)}
                                    className="h-7 w-7 rounded-full"
                                  >
                                    <Edit className="h-3.5 w-3.5 text-gray-500" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteExample(example.id || index.toString())}
                                    className="h-7 w-7 rounded-full"
                                  >
                                    <Trash className="h-3.5 w-3.5 text-gray-500" />
                                  </Button>
                                </div>
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-3 pt-1">
                              <p className="text-sm truncate">{example.user_message}</p>
                              
                              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">AI Response:</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{example.ai_response}</p>
                              </div>
                              
                              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                                <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Corrected Response:</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{example.corrected_response}</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {isAddingExample ? "Add New Example" : "Edit Example"}
                    </h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="userMessage" className="text-xs">User Message</Label>
                      <Textarea 
                        id="userMessage"
                        placeholder="What the user asked..."
                        value={userMessage}
                        onChange={(e) => setUserMessage(e.target.value)}
                        className="h-20 resize-none bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="aiResponse" className="text-xs">AI Response</Label>
                      <Textarea 
                        id="aiResponse"
                        placeholder="How the AI responded initially..."
                        value={aiResponse}
                        onChange={(e) => setAiResponse(e.target.value)}
                        className="h-20 resize-none bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="correctedResponse" className="text-xs">Corrected Response</Label>
                      <Textarea 
                        id="correctedResponse"
                        placeholder="The corrected response you want the AI to learn from..."
                        value={correctedResponse}
                        onChange={(e) => setCorrectedResponse(e.target.value)}
                        className="h-20 resize-none bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                      />
                    </div>
                    
                    <div className="flex justify-end gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowExampleEditor(false)}
                        className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={handleSaveExample}
                        disabled={isLoading}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        {isLoading ? "Saving..." : "Save Example"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <DialogFooter className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} className="border-gray-300 dark:border-gray-700">
                Cancel
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={isLoading}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
              >
                {isLoading ? "Saving..." : "Save changes"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
      
      <Sheet open={showVoiceInfo} onOpenChange={setShowVoiceInfo}>
        <SheetContent className="w-full sm:max-w-md bg-white dark:bg-gray-900 p-0">
          <SheetHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-white">
            <SheetTitle className="text-white">Voice Information</SheetTitle>
            <SheetDescription className="text-white/90">
              Details about the ElevenLabs voice
            </SheetDescription>
          </SheetHeader>
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <h3 className="font-medium">Voice: {currentVoiceObject.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This is a premium {currentVoiceObject.gender} voice from ElevenLabs designed to sound natural and expressive.
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Capabilities</h3>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <li>Natural intonation and prosody</li>
                <li>Multilingual support</li>
                <li>Emotional expression</li>
                <li>Variable speaking styles</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium">Usage tips</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Adjust the humor level to make the voice sound more serious or more playful depending on your agent's purpose.
              </p>
            </div>
            <Button 
              onClick={previewVoice}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              {isPreviewingVoice ? (
                <>
                  <Pause className="mr-2 h-4 w-4" /> Stop Preview
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" /> Preview Voice
                </>
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
