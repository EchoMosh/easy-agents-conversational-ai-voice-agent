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
import { 
  Play, 
  Pause,
  X,
  Info,
  Plus
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { fetchDocuments } from "@/utils/knowledge-api";
import { supabase } from "@/integrations/supabase/client";
import { Agent } from "@/types/agent";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  uploadFileToVapi, 
  createVapiKnowledgeBase, 
  updateAgentKnowledgeBase,
  VapiFile 
} from '@/utils/vapi-knowledge-api';
import { Upload, FileText, Loader2 } from 'lucide-react';

// Type for voice preview cache
interface VoicePreview {
  voice_id: string;
  voice_name: string;
  preview_url: string;
}

// Helper function to convert country code to flag emoji
const getFlagEmoji = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) return '';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

// Type for ElevenLabs Voice
interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  labels: {
    gender: string;
    accent: string;
  };
  samples: { sample_id: string }[];
}

// Updated languages data with correct language codes
const languages = [
  { id: "en", name: "English" },
  { id: "zh", name: "Chinese" },
  { id: "es", name: "Spanish" },
  { id: "hi", name: "Hindi" },
  { id: "pt", name: "Portuguese" },
  { id: "fr", name: "French" },
  { id: "de", name: "German" },
  { id: "ja", name: "Japanese" },
  { id: "ar", name: "Arabic" },
  { id: "ko", name: "Korean" },
  { id: "id", name: "Indonesian" },
  { id: "it", name: "Italian" },
  { id: "nl", name: "Dutch" },
  { id: "tr", name: "Turkish" },
  { id: "pl", name: "Polish" },
  { id: "ru", name: "Russian" },
  { id: "sv", name: "Swedish" },
  { id: "ms", name: "Malay" },
  { id: "ro", name: "Romanian" },
  { id: "uk", name: "Ukrainian" },
  { id: "el", name: "Greek" },
  { id: "cs", name: "Czech" },
  { id: "da", name: "Danish" },
  { id: "fi", name: "Finnish" },
  { id: "bg", name: "Bulgarian" },
  { id: "hr", name: "Croatian" },
  { id: "sk", name: "Slovak" },
  { id: "ta", name: "Tamil" },
  { id: "vi", name: "Vietnamese" },
  { id: "no", name: "Norwegian" },
  { id: "hu", name: "Hungarian" },
  { id: "pt-br", name: "Portuguese (Brazil)" },
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
    humorLevel?: number;
    maxDurationSeconds?: number;
  }) => Promise<void>;
}

export function AgentSettings({
  agentId,
  currentVoice,
  currentLanguage,
  children,
  onUpdateSettings,
}: AgentSettingsProps) {
  const [open, setOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("voice");
  const [voices, setVoices] = React.useState<ElevenLabsVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = React.useState(currentVoice);
  const [language, setLanguage] = React.useState(currentLanguage || "en");
  const [knowledgeBase, setKnowledgeBase] = React.useState("none");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPreviewingVoice, setIsPreviewingVoice] = React.useState(false);
  const [audioElement, setAudioElement] = React.useState<HTMLAudioElement | null>(null);
  
  // Advanced settings
  const [maxDurationSeconds, setMaxDurationSeconds] = React.useState(600);
  const [silenceTimeoutSeconds, setSilenceTimeoutSeconds] = React.useState(30);
  const [backgroundSound, setBackgroundSound] = React.useState(false);
  const [startSpeakingDelay, setStartSpeakingDelay] = React.useState(0.4);
  const [smartEndpointing, setSmartEndpointing] = React.useState(false);
  const [acknowledgementPhrases, setAcknowledgementPhrases] = React.useState<string[]>([
    "I understand", "I see", "got it"
  ]);
  const [vapiAgentId, setVapiAgentId] = React.useState<string | null>(null);
  const [firstMessage, setFirstMessage] = React.useState<string>("");
  const [mermaidChart, setMermaidChart] = React.useState<string>("");
  
  // Vapi Knowledge Base states
  const [vapiFiles, setVapiFiles] = React.useState<VapiFile[]>([]);
  const [isUploadingFile, setIsUploadingFile] = React.useState(false);
  const [isCreatingKnowledgeBase, setIsCreatingKnowledgeBase] = React.useState(false);
  const [kbSearchType, setKbSearchType] = React.useState<'semantic' | 'fulltext' | 'hybrid'>('semantic');
  const [kbTopK, setKbTopK] = React.useState(3);
  const [kbScoreThreshold, setKbScoreThreshold] = React.useState(0.7);
  const [vapiKnowledgeBaseId, setVapiKnowledgeBaseId] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const { toast } = useToast();
  
  const { data: knowledgeDocuments, isLoading: isLoadingDocuments, refetch } = useQuery({
    queryKey: ['knowledgeDocuments'],
    queryFn: fetchDocuments,
    staleTime: 0,
  });
  
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio();
      
      audio.onended = () => {
        setIsPreviewingVoice(false);
      };
      
      audio.onerror = (e) => {
        setIsPreviewingVoice(false);
        toast({
          title: "Error",
          description: "Audio playback failed",
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
    const fetchVoices = async () => {
      try {
        // Use Supabase Edge Function to get voices
        const { data, error } = await supabase.functions.invoke('get-elevenlabs-voices');
        
        if (error) {
          console.error("Error fetching voices via edge function:", error);
          throw error;
        }
        
        if (data && data.voices && Array.isArray(data.voices)) {
          setVoices(data.voices);
          if (!selectedVoice && data.voices.length > 0) {
            setSelectedVoice(data.voices[0].voice_id);
          }
        } else {
          throw new Error("Invalid response format from voices API");
        }
      } catch (error) {
        console.error("Error fetching ElevenLabs voices:", error);
        // Use fallback voices on any error
        const fallbackVoices = [
          {
            voice_id: "uYXf8XasLslADfZ2MB4u",
            name: "Laura",
            labels: { gender: "female", accent: "american" },
            samples: []
          },
          {
            voice_id: "pNInz6obpgDQGcFmaJgB",
            name: "Adam",
            labels: { gender: "male", accent: "american" },
            samples: []
          }
        ];
        setVoices(fallbackVoices);
        if (!selectedVoice) {
          setSelectedVoice(fallbackVoices[0].voice_id);
        }
        toast({
          title: "Warning",
          description: "Using fallback voices. Please check your ElevenLabs API configuration.",
          variant: "destructive",
        });
      }
    };

    if (open) {
      fetchVoices();
      refetch();
      
      const fetchAgentData = async () => {
        try {
          const { data, error } = await supabase
            .from('agents')
            .select('*')
            .eq('id', agentId)
            .maybeSingle();
            
          if (error) throw error;
          
          if (data) {
            const agentData = data as unknown as Agent;
            
            if (agentData.voice_id) {
              setSelectedVoice(agentData.voice_id);
            }
            
            if (agentData.language) {
              setLanguage(agentData.language);
            }
            
            if (agentData.knowledge_ids && agentData.knowledge_ids.length > 0) {
              setKnowledgeBase(agentData.knowledge_ids[0]);
            } else {
              setKnowledgeBase("none");
            }
            
            if (agentData.max_duration_seconds) {
              setMaxDurationSeconds(agentData.max_duration_seconds);
            }
            
            if (agentData.call_timing?.silenceTimeoutSeconds) {
              setSilenceTimeoutSeconds(agentData.call_timing.silenceTimeoutSeconds);
            }
            
            if (agentData.background_sound && agentData.background_sound !== "off") {
              setBackgroundSound(true);
            }
            
            if (agentData.speaking_behavior?.startSpeakingDelay) {
              setStartSpeakingDelay(agentData.speaking_behavior.startSpeakingDelay);
            }
            
            if (agentData.speaking_behavior?.smartEndpointingEnabled !== undefined) {
              setSmartEndpointing(agentData.speaking_behavior.smartEndpointingEnabled);
            }
            
            if (agentData.speaking_behavior?.acknowledgementPhrases) {
              setAcknowledgementPhrases(agentData.speaking_behavior.acknowledgementPhrases);
            }
            
            if (agentData.v_agent_id) {
              setVapiAgentId(agentData.v_agent_id);
            }
            
            if (agentData.first_message) {
              setFirstMessage(agentData.first_message);
            }
            
            if (agentData.mermaid_chart) {
              setMermaidChart(agentData.mermaid_chart);
            }
            
            if (agentData.vapi_knowledge_base_id) {
              setVapiKnowledgeBaseId(agentData.vapi_knowledge_base_id);
            }
            
            if (agentData.vapi_file_ids && agentData.vapi_file_ids.length > 0) {
              // Note: We're storing file IDs but not fetching full file info from Vapi API
              // In a production app, you might want to fetch and display file details
              setVapiFiles(agentData.vapi_file_ids.map(id => ({ 
                id, 
                name: 'Uploaded file', 
                size: 0, 
                createdAt: '', 
                updatedAt: '' 
              })));
            }
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

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Only update fields that exist in the agents table
      const updateData = {
        voice_id: selectedVoice,
        language: language,
        knowledge_ids: knowledgeBase && knowledgeBase !== "none" ? [knowledgeBase] : [],
        vapi_knowledge_base_id: vapiKnowledgeBaseId,
        vapi_file_ids: vapiFiles.map(f => f.id)
      } as any;
      
      const { error } = await supabase
        .from('agents')
        .update(updateData)
        .eq('id', agentId);
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      // Update Vapi agent if v_agent_id exists
      if (vapiAgentId) {
        try {
          const response = await supabase.functions.invoke('update-vapi-agent', {
            body: {
              agent_id: agentId,
              v_agent_id: vapiAgentId,
              voice_id: selectedVoice,
              language: language,
              first_message: firstMessage || `Hello! This is an AI assistant. How can I help you today?`,
              mermaid_chart: mermaidChart || "",
              max_duration_seconds: maxDurationSeconds,
              background_sound: backgroundSound ? "office" : "off",
              knowledge_base_id: vapiKnowledgeBaseId
            }
          });
          
          if (response.error) {
            console.error('Failed to update voice agent:', response.error);
            toast({
              title: "Warning",
              description: "Agent settings saved but voice service update failed. The agent may not reflect all changes.",
              variant: "destructive",
            });
          } else {
            console.log('Voice agent updated successfully');
          }
        } catch (vapiError) {
          console.error('Error updating voice agent:', vapiError);
          toast({
            title: "Warning",
            description: "Agent settings saved but voice service update failed. The agent may not reflect all changes.",
            variant: "destructive",
          });
        }
      }
      
      await onUpdateSettings({
        voiceId: selectedVoice,
        language,
        maxDurationSeconds: maxDurationSeconds,
      });
      
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

      const voice = voices.find(v => v.voice_id === selectedVoice);
      const voiceName = voice?.name || 'this voice';
      const previewText = `Hello! This is a preview of ${voiceName}. I'm ready to assist you with your needs.`;
      
      console.log('Generating voice preview for:', voiceName);
      
      // Use Supabase Edge Function for voice sample
      const { data, error } = await supabase.functions.invoke('get-elevenlabs-voice-sample', {
        body: {
          voice_id: selectedVoice,
          text: previewText
        }
      });

      if (error) {
        console.error('Voice preview error:', error);
        throw new Error(`Failed to generate voice preview: ${error.message}`);
      }

      if (!data?.audioUrl) {
        throw new Error('No audio URL received from voice preview service');
      }

      // Play the audio from the returned URL
      audioElement.src = data.audioUrl;
      
      // Clean up when done
      audioElement.onended = () => {
        setIsPreviewingVoice(false);
      };

      // Play the audio
      audioElement.load();
      await audioElement.play();

    } catch (error) {
      console.error('Error previewing voice:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to preview voice. Please check your ElevenLabs configuration.",
        variant: "destructive",
      });
      setIsPreviewingVoice(false);
    }
  };

  const addAcknowledgementPhrase = (phrase: string) => {
    if (phrase.trim() && !acknowledgementPhrases.includes(phrase.trim())) {
      setAcknowledgementPhrases([...acknowledgementPhrases, phrase.trim()]);
    }
  };

  const removeAcknowledgementPhrase = (index: number) => {
    setAcknowledgementPhrases(acknowledgementPhrases.filter((_, i) => i !== index));
  };

  const [newPhrase, setNewPhrase] = React.useState("");

  const handleFileUpload = async (files: FileList) => {
    setIsUploadingFile(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Check file size (Vapi recommends < 300KB)
        if (file.size > 300 * 1024) {
          toast({
            title: "Warning",
            description: `${file.name} is larger than 300KB. This may affect performance.`,
            variant: "destructive",
          });
        }
        
        const vapiFile = await uploadFileToVapi(file);
        return vapiFile;
      });
      
      const uploadedFiles = await Promise.all(uploadPromises);
      setVapiFiles(prev => [...prev, ...uploadedFiles]);
      
      toast({
        title: "Success",
        description: `Uploaded ${uploadedFiles.length} file(s) successfully`,
      });
    } catch (error) {
      console.error('Error uploading files:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload files",
        variant: "destructive",
      });
    } finally {
      setIsUploadingFile(false);
    }
  };

  const createKnowledgeBase = async () => {
    if (vapiFiles.length === 0) {
      toast({
        title: "Error",
        description: "Please upload at least one file",
        variant: "destructive",
      });
      return;
    }
    
    setIsCreatingKnowledgeBase(true);
    try {
      const kb = await createVapiKnowledgeBase(
        `${agentId}-knowledge-base`,
        vapiFiles.map(f => f.id),
        agentId,
        {
          searchType: kbSearchType,
          topK: kbTopK,
          scoreThreshold: kbScoreThreshold,
        }
      );
      
      setVapiKnowledgeBaseId(kb.id);
      await updateAgentKnowledgeBase(agentId, kb.id, vapiFiles.map(f => f.id));
      
      toast({
        title: "Success",
        description: "Knowledge base created successfully",
      });
    } catch (error) {
      console.error('Error creating knowledge base:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create knowledge base",
        variant: "destructive",
      });
    } finally {
      setIsCreatingKnowledgeBase(false);
    }
  };

  return (
    <TooltipProvider>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>{children}</DialogTrigger>
        <DialogContent className="p-0 max-w-3xl rounded-2xl overflow-hidden border shadow-2xl bg-background">
          {/* Enhanced Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20 border-b">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-semibold text-foreground">Agent Voice & Behavior</DialogTitle>
                  <DialogDescription className="mt-1 text-sm text-muted-foreground">
                    Configure how your agent sounds and behaves during conversations
                  </DialogDescription>
                </div>
                {/* The explicit X button was here, removed to prevent duplication with Dialog's default close button */}
              </div>
            </DialogHeader>
          </div>
          
          {/* Tab Navigation */}
          <div className="px-6 pt-4 pb-2 border-b">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab("voice")}
                className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-all ${
                  activeTab === "voice"
                    ? "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-b-2 border-blue-500"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                Voice
              </button>
              <button
                onClick={() => setActiveTab("behavior")}
                className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-all ${
                  activeTab === "behavior"
                    ? "bg-purple-50 dark:bg-purple-950/30 text-purple-600 dark:text-purple-400 border-b-2 border-purple-500"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                Behavior
              </button>
              <button
                onClick={() => setActiveTab("knowledge")}
                className={`px-4 py-2 rounded-t-lg font-medium text-sm transition-all ${
                  activeTab === "knowledge"
                    ? "bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border-b-2 border-green-500"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                Knowledge & Phrases
              </button>
            </div>
          </div>
          
          {/* Tab Content */}
          <div className="px-6 py-5 min-h-[350px]">
            {/* Voice Settings Tab */}
            {activeTab === "voice" && (
              <section className="space-y-4 animate-in fade-in duration-200">
              
              <div className="grid gap-4">
                {/* Voice Selection with Preview */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Voice</Label>
                  <div className="flex items-center gap-2">
                    <Select 
                      value={selectedVoice} 
                      onValueChange={setSelectedVoice}
                    >
                      <SelectTrigger className="flex-1 h-11 rounded-lg border-input bg-background hover:bg-accent/50 transition-colors">
                        <SelectValue>
                          {(() => {
                            const v = voices.find(voice => voice.voice_id === selectedVoice);
                            if (!v) return null;
                            return (
                              <span className="flex items-center gap-3">
                                <span className="font-medium">{v.name}</span>
                              </span>
                            );
                          })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        {voices.map((voice) => (
                          <SelectItem key={voice.voice_id} value={voice.voice_id} className="py-2.5 px-3 rounded-md">
                            <div className="flex items-center gap-3">
                              <span className="font-medium">{voice.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="default"
                      onClick={previewVoice}
                      className="px-4 h-11 rounded-lg border-input hover:bg-accent hover:border-accent-foreground/20 transition-all flex items-center gap-2"
                    >
                      {isPreviewingVoice ? (
                        <>
                          <Pause className="h-4 w-4" />
                          <span>Stop</span>
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          <span>Preview</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Language */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Language</Label>
                  <Select onValueChange={setLanguage} value={language}>
                    <SelectTrigger className="h-11 rounded-lg border-input bg-background hover:bg-accent/50 transition-colors">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg max-h-[300px]">
                      {languages.map((l) => (
                        <SelectItem key={l.id} value={l.id} className="py-2 rounded-md">
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </section>
            )}

            {/* Behavior Settings Tab */}
            {activeTab === "behavior" && (
              <section className="space-y-4 animate-in fade-in duration-200">
              
              <div className="grid gap-4 pl-3">
                {/* Call Duration Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                      Duration (sec)
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">Maximum duration for the call before it automatically ends</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input 
                      type="number" 
                      min={60} 
                      max={3600} 
                      value={maxDurationSeconds} 
                      onChange={(e) => setMaxDurationSeconds(parseInt(e.target.value))} 
                      className="h-11 rounded-lg border-input bg-background hover:bg-accent/50 transition-colors"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                      Silence Timeout (sec)
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">How long to wait during silence before ending the call</p>
                        </TooltipContent>
                      </Tooltip>
                    </Label>
                    <Input 
                      type="number" 
                      min={5} 
                      max={60} 
                      value={silenceTimeoutSeconds} 
                      onChange={(e) => setSilenceTimeoutSeconds(parseInt(e.target.value))} 
                      className="h-11 rounded-lg border-input bg-background hover:bg-accent/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Speaking Delay */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                    Speaking Delay (sec)
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <p className="text-sm">Time to wait before the agent starts speaking after user stops</p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                    <Input 
                      type="number" 
                      min={0} 
                      max={2} 
                      step={0.1}
                      value={startSpeakingDelay} 
                      onChange={(e) => setStartSpeakingDelay(parseFloat(e.target.value))} 
                      className="h-11 rounded-lg border-input bg-background hover:bg-accent/50 transition-colors"
                    />
                </div>

                {/* Toggle Settings */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="smart-endpointing" className="text-sm font-medium text-foreground cursor-pointer">
                        Smart endpointing
                      </Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">Intelligently detects when the user has finished speaking</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch 
                      id="smart-endpointing" 
                      checked={smartEndpointing} 
                      onCheckedChange={setSmartEndpointing}
                      className="data-[state=checked]:bg-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="background-sound" className="text-sm font-medium text-foreground cursor-pointer">
                        Background Sound
                      </Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-sm">Add ambient background sounds to make calls feel more natural</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Switch 
                      id="background-sound" 
                      checked={backgroundSound} 
                      onCheckedChange={setBackgroundSound}
                      className="data-[state=checked]:bg-purple-500"
                    />
                  </div>
                </div>
              </div>
            </section>
            )}

            {/* Knowledge & Phrases Tab */}
            {activeTab === "knowledge" && (
            <section className="space-y-4 animate-in fade-in duration-200">
              
              <div className="space-y-4">
                {/* Knowledge Base */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-foreground">Knowledge Base</Label>
                    {vapiKnowledgeBaseId && (
                      <Badge variant="outline" className="text-xs">
                        Knowledge Base Active
                      </Badge>
                    )}
                  </div>
                  
                  {/* File Upload Area */}
                  <div 
                    className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-600 transition-colors cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files.length > 0) {
                        handleFileUpload(e.dataTransfer.files);
                      }
                    }}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".txt,.pdf,.docx,.doc,.csv,.md"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleFileUpload(e.target.files);
                        }
                      }}
                    />
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {isUploadingFile ? "Uploading..." : "Click or drag files here to upload"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supports: TXT, PDF, DOCX, DOC, CSV, MD (< 300KB recommended)
                    </p>
                  </div>
                  
                  {/* Uploaded Files */}
                  {vapiFiles.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">Uploaded Files</Label>
                      <div className="space-y-1">
                        {vapiFiles.map((file) => (
                          <div key={file.id} className="flex items-center gap-2 p-2 bg-accent/30 rounded-lg">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm flex-1 truncate">{file.name}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setVapiFiles(prev => prev.filter(f => f.id !== file.id))}
                              className="h-6 w-6 p-0"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Knowledge Base Configuration */}
                  {vapiFiles.length > 0 && !vapiKnowledgeBaseId && (
                    <div className="space-y-3 p-4 bg-accent/20 rounded-lg">
                      <Label className="text-sm font-medium">Knowledge Base Configuration</Label>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Search Type</Label>
                          <Select value={kbSearchType} onValueChange={(v: any) => setKbSearchType(v)}>
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="semantic">Semantic</SelectItem>
                              <SelectItem value="fulltext">Full Text</SelectItem>
                              <SelectItem value="hybrid">Hybrid</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Top K Results</Label>
                          <Input 
                            type="number" 
                            min={1} 
                            max={10} 
                            value={kbTopK} 
                            onChange={(e) => setKbTopK(parseInt(e.target.value))}
                            className="h-9"
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Score Threshold</Label>
                          <Input 
                            type="number" 
                            min={0} 
                            max={1} 
                            step={0.1}
                            value={kbScoreThreshold} 
                            onChange={(e) => setKbScoreThreshold(parseFloat(e.target.value))}
                            className="h-9"
                          />
                        </div>
                      </div>
                      
                      <Button
                        onClick={createKnowledgeBase}
                        disabled={isCreatingKnowledgeBase}
                        className="w-full"
                      >
                        {isCreatingKnowledgeBase ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating Knowledge Base...
                          </>
                        ) : (
                          "Create Knowledge Base"
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Acknowledgement Phrases */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-foreground">Acknowledgement Phrases</Label>
                  
                  {/* Phrase Pills */}
                  <div className="flex flex-wrap gap-2">
                    {acknowledgementPhrases.map((phrase, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="px-3 py-1.5 text-sm bg-accent hover:bg-accent/80 flex items-center gap-2 rounded-full"
                      >
                        {phrase}
                        <button
                          onClick={() => removeAcknowledgementPhrase(index)}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Add New Phrase */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add new phrase..."
                      value={newPhrase}
                      onChange={(e) => setNewPhrase(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addAcknowledgementPhrase(newPhrase);
                          setNewPhrase("");
                        }
                      }}
                      className="h-10 rounded-lg border-input bg-background hover:bg-accent/50 transition-colors"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        addAcknowledgementPhrase(newPhrase);
                        setNewPhrase("");
                      }}
                      className="h-10 px-4 rounded-lg hover:bg-accent"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </section>
            )}
          </div>
          
          {/* Enhanced Footer */}
          <DialogFooter className="px-6 py-4 border-t bg-muted/30">
            <div className="flex gap-3 w-full justify-end">
              <Button 
                variant="outline" 
                onClick={() => setOpen(false)}
                className="h-10 px-5 rounded-lg hover:bg-accent"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isLoading}
                className="h-10 px-5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isLoading ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
