
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { 
  Info, 
  Play, 
  Pause, 
  Volume2, 
  Clock, 
  MessageSquare, 
  Settings as SettingsIcon, 
  Mic, 
  Brain, 
  VolumeX
} from "lucide-react";
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
} from "@/components/ui/sheet";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Agent } from "@/types/agent";
import { Switch } from "@/components/ui/switch";

// Available voices data
const voices = [
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", gender: "female" },
  { id: "UgBBYS2sOqTuMpoF3BR0", name: "Thomas", gender: "male" },
  { id: "pwMBn0SsmN1220Aorv15", name: "Michael", gender: "male" }
];

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

// Model providers
const modelProviders = [
  { id: "openai", name: "OpenAI" },
  { id: "anthropic", name: "Anthropic" },
  { id: "anyscale", name: "Anyscale" },
  { id: "mistral", name: "Mistral AI" },
  { id: "cohere", name: "Cohere" },
];

// Voice providers
const voiceProviders = [
  { id: "elevenlabs", name: "ElevenLabs" },
  { id: "azure", name: "Azure" },
  { id: "google", name: "Google" },
  { id: "amazon", name: "Amazon Polly" },
];

// Transcription providers
const transcriptionProviders = [
  { id: "assembly-ai", name: "Assembly AI" },
  { id: "deepgram", name: "Deepgram" },
  { id: "whisper", name: "OpenAI Whisper" },
];

// Background sound options
const backgroundSoundOptions = [
  { id: "off", name: "Off" },
  { id: "office", name: "Office" },
  { id: "cafe", name: "Cafe" },
  { id: "nature", name: "Nature" },
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
    maxDurationSeconds?: number;
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
  const [language, setLanguage] = React.useState(currentLanguage || "en");
  const [knowledgeBase, setKnowledgeBase] = React.useState("none");
  const [humorLevel, setHumorLevel] = React.useState(currentHumorLevel);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPreviewingVoice, setIsPreviewingVoice] = React.useState(false);
  const [audioElement, setAudioElement] = React.useState<HTMLAudioElement | null>(null);
  const [showVoiceInfo, setShowVoiceInfo] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("basic");
  
  // Advanced settings
  const [firstMessage, setFirstMessage] = React.useState("");
  const [firstMessageMode, setFirstMessageMode] = React.useState<"assistant-speaks-first" | "user-speaks-first">("assistant-speaks-first");
  const [maxDurationSeconds, setMaxDurationSeconds] = React.useState(600);
  const [silenceTimeoutSeconds, setSilenceTimeoutSeconds] = React.useState(30);
  const [backgroundSound, setBackgroundSound] = React.useState<"off" | "office" | "cafe" | "nature">("off");
  const [backgroundDenoising, setBackgroundDenoising] = React.useState(false);
  const [endCallMessage, setEndCallMessage] = React.useState("");
  const [silenceTimeoutMessage, setSilenceTimeoutMessage] = React.useState("");
  const [endCallPhrases, setEndCallPhrases] = React.useState<string[]>([]);
  
  // Voice configuration
  const [voiceProvider, setVoiceProvider] = React.useState("elevenlabs");
  const [voiceSpeed, setVoiceSpeed] = React.useState(1.0);
  
  // Model configuration
  const [modelProvider, setModelProvider] = React.useState("openai");
  const [model, setModel] = React.useState("");
  const [temperature, setTemperature] = React.useState(0.7);
  const [emotionRecognitionEnabled, setEmotionRecognitionEnabled] = React.useState(false);
  
  // Transcription configuration
  const [transcriptionProvider, setTranscriptionProvider] = React.useState("assembly-ai");
  const [disablePartialTranscripts, setDisablePartialTranscripts] = React.useState(false);
  const [endUtteranceSilenceThreshold, setEndUtteranceSilenceThreshold] = React.useState(1.0);
  
  // Speaking behavior
  const [startSpeakingDelay, setStartSpeakingDelay] = React.useState(0.4);
  const [smartEndpointing, setSmartEndpointing] = React.useState(false);
  const [acknowledgementPhrasesText, setAcknowledgementPhrasesText] = React.useState("");
  const [interruptionPhrasesText, setInterruptionPhrasesText] = React.useState("");
  
  const { toast } = useToast();
  
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
          const { data, error } = await supabase
            .from('agents')
            .select('*')
            .eq('id', agentId)
            .maybeSingle();
            
          if (error) throw error;
          
          if (data) {
            // Basic settings
            if (data.voice_id) {
              setSelectedVoice(data.voice_id);
            }
            
            if (data.language) {
              setLanguage(data.language);
            }
            
            if (data.humor_level !== undefined && data.humor_level !== null) {
              setHumorLevel(data.humor_level);
            }
            
            if (data.knowledge_ids && data.knowledge_ids.length > 0) {
              setKnowledgeBase(data.knowledge_ids[0]);
            } else {
              setKnowledgeBase("none");
            }
            
            // Advanced settings
            if (data.maxDurationSeconds) {
              setMaxDurationSeconds(data.maxDurationSeconds);
            }
            
            if (data.first_message) {
              setFirstMessage(data.first_message);
            }
            
            if (data.first_message_mode) {
              setFirstMessageMode(data.first_message_mode);
            }
            
            if (data.end_call_message) {
              setEndCallMessage(data.end_call_message);
            }
            
            if (data.silence_timeout_message) {
              setSilenceTimeoutMessage(data.silence_timeout_message);
            }
            
            if (data.call_timing?.silenceTimeoutSeconds) {
              setSilenceTimeoutSeconds(data.call_timing.silenceTimeoutSeconds);
            }
            
            if (data.background_sound) {
              setBackgroundSound(data.background_sound);
            }
            
            if (data.background_denoising_enabled !== undefined) {
              setBackgroundDenoising(data.background_denoising_enabled);
            }
            
            if (data.end_call_phrases) {
              setEndCallPhrases(data.end_call_phrases);
              setEndCallPhrasesText(data.end_call_phrases.join(', '));
            }
            
            // Voice config
            if (data.voice_config?.provider) {
              setVoiceProvider(data.voice_config.provider);
            }
            
            if (data.voice_config?.speed) {
              setVoiceSpeed(data.voice_config.speed);
            }
            
            // Model config
            if (data.model_config?.provider) {
              setModelProvider(data.model_config.provider);
            }
            
            if (data.model_config?.model) {
              setModel(data.model_config.model);
            }
            
            if (data.model_config?.temperature) {
              setTemperature(data.model_config.temperature);
            }
            
            if (data.model_config?.emotionRecognitionEnabled !== undefined) {
              setEmotionRecognitionEnabled(data.model_config.emotionRecognitionEnabled);
            }
            
            // Transcription config
            if (data.transcriber_config?.provider) {
              setTranscriptionProvider(data.transcriber_config.provider);
            }
            
            if (data.transcriber_config?.disablePartialTranscripts !== undefined) {
              setDisablePartialTranscripts(data.transcriber_config.disablePartialTranscripts);
            }
            
            if (data.transcriber_config?.endUtteranceSilenceThreshold) {
              setEndUtteranceSilenceThreshold(data.transcriber_config.endUtteranceSilenceThreshold);
            }
            
            // Speaking behavior
            if (data.speaking_behavior?.startSpeakingDelay) {
              setStartSpeakingDelay(data.speaking_behavior.startSpeakingDelay);
            }
            
            if (data.speaking_behavior?.smartEndpointingEnabled !== undefined) {
              setSmartEndpointing(data.speaking_behavior.smartEndpointingEnabled);
            }
            
            if (data.speaking_behavior?.acknowledgementPhrases) {
              setAcknowledgementPhrasesText(data.speaking_behavior.acknowledgementPhrases.join(', '));
            }
            
            if (data.speaking_behavior?.interruptionPhrases) {
              setInterruptionPhrasesText(data.speaking_behavior.interruptionPhrases.join(', '));
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

  // State for handling end call phrases text input
  const [endCallPhrasesText, setEndCallPhrasesText] = React.useState('');

  // Parse comma-separated phrases into array
  const parsePhrasesText = (text: string): string[] => {
    return text.split(',')
      .map(phrase => phrase.trim())
      .filter(phrase => phrase.length > 0);
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Parse phrases from text inputs
      const parsedEndCallPhrases = parsePhrasesText(endCallPhrasesText);
      const parsedAcknowledgementPhrases = parsePhrasesText(acknowledgementPhrasesText);
      const parsedInterruptionPhrases = parsePhrasesText(interruptionPhrasesText);
      
      console.log("Saving agent settings:", {
        agentId,
        voice: selectedVoice,
        language,
        humorLevel,
        knowledgeBase,
        maxDurationSeconds
      });
      
      const updateData = {
        // Basic settings
        voice_id: selectedVoice,
        language: language,
        humor_level: humorLevel,
        knowledge_ids: knowledgeBase && knowledgeBase !== "none" ? [knowledgeBase] : [],
        
        // Advanced settings
        maxDurationSeconds: maxDurationSeconds,
        first_message: firstMessage,
        first_message_mode: firstMessageMode,
        end_call_message: endCallMessage,
        silence_timeout_message: silenceTimeoutMessage,
        background_sound: backgroundSound,
        background_denoising_enabled: backgroundDenoising,
        end_call_phrases: parsedEndCallPhrases,
        
        // Configuration objects
        voice_config: {
          provider: voiceProvider,
          voiceId: selectedVoice,
          speed: voiceSpeed
        },
        
        model_config: {
          provider: modelProvider,
          model: model,
          temperature: temperature,
          emotionRecognitionEnabled: emotionRecognitionEnabled
        },
        
        transcriber_config: {
          provider: transcriptionProvider,
          language: language,
          disablePartialTranscripts: disablePartialTranscripts,
          endUtteranceSilenceThreshold: endUtteranceSilenceThreshold
        },
        
        call_timing: {
          silenceTimeoutSeconds: silenceTimeoutSeconds,
          maxDurationSeconds: maxDurationSeconds
        },
        
        speaking_behavior: {
          startSpeakingDelay: startSpeakingDelay,
          smartEndpointingEnabled: smartEndpointing,
          acknowledgementPhrases: parsedAcknowledgementPhrases,
          interruptionPhrases: parsedInterruptionPhrases
        }
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
          maxDurationSeconds: maxDurationSeconds,
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
        <DialogContent className="p-0 max-w-4xl rounded-xl overflow-hidden border-0 shadow-xl">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4">
            <DialogHeader className="pb-0">
              <DialogTitle className="text-xl font-semibold text-white">Agent Settings</DialogTitle>
            </DialogHeader>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-gray-200 dark:border-gray-800">
              <TabsList className="bg-transparent h-14 px-6">
                <TabsTrigger
                  value="basic"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-purple-500 data-[state=active]:shadow-none rounded-none py-3"
                >
                  Basic Settings
                </TabsTrigger>
                <TabsTrigger
                  value="voice"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-purple-500 data-[state=active]:shadow-none rounded-none py-3"
                >
                  Voice & Language
                </TabsTrigger>
                <TabsTrigger
                  value="model"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-purple-500 data-[state=active]:shadow-none rounded-none py-3"
                >
                  AI Model
                </TabsTrigger>
                <TabsTrigger
                  value="behavior"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-purple-500 data-[state=active]:shadow-none rounded-none py-3"
                >
                  Call Behavior
                </TabsTrigger>
                <TabsTrigger
                  value="advanced"
                  className="data-[state=active]:border-b-2 data-[state=active]:border-purple-500 data-[state=active]:shadow-none rounded-none py-3"
                >
                  Advanced
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <TabsContent value="basic" className="mt-0">
                <div className="space-y-6">
                  {/* Humor Level */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium">Humor Level</h3>
                      <span className="text-sm font-medium text-purple-600 dark:text-purple-400">{humorLevel}%</span>
                    </div>
                    <Slider
                      min={0}
                      max={100}
                      step={10}
                      value={[humorLevel]}
                      onValueChange={(values) => setHumorLevel(values[0])}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>Serious</span>
                      <span>Balanced</span>
                      <span>Humorous</span>
                    </div>
                  </div>
                  
                  {/* Knowledge Base */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium flex items-center gap-2">
                      <Info className="h-4 w-4 text-blue-500" /> 
                      Knowledge Base
                    </h3>
                    <Select onValueChange={setKnowledgeBase} value={knowledgeBase}>
                      <SelectTrigger className="rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                        <SelectValue placeholder={isLoadingDocuments ? "Loading..." : "Select knowledge base"} />
                      </SelectTrigger>
                      <SelectContent>
                        {knowledgeBases.map((kb) => (
                          <SelectItem key={kb.id} value={kb.id}>
                            {kb.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-slate-500">
                      Connect a knowledge base to provide your agent with specific information
                    </p>
                  </div>
                  
                  {/* First Message */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-green-500" /> 
                      First Message
                    </h3>
                    <Textarea 
                      placeholder="Hello! How can I help you today?"
                      value={firstMessage}
                      onChange={(e) => setFirstMessage(e.target.value)}
                      className="min-h-24 rounded-lg border-slate-200 dark:border-slate-700"
                    />
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Who speaks first?</Label>
                      <Select 
                        value={firstMessageMode} 
                        onValueChange={(value: "assistant-speaks-first" | "user-speaks-first") => setFirstMessageMode(value)}
                      >
                        <SelectTrigger className="rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                          <SelectValue placeholder="Select who speaks first" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="assistant-speaks-first">Assistant speaks first</SelectItem>
                          <SelectItem value="user-speaks-first">User speaks first</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="voice" className="mt-0">
                <div className="space-y-6">
                  {/* Voice Provider */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium">Voice Provider</h3>
                    <Select onValueChange={setVoiceProvider} value={voiceProvider}>
                      <SelectTrigger className="rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                        <SelectValue placeholder="Select voice provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {voiceProviders.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Voice Selection */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium flex items-center gap-2">
                      <Volume2 className="h-4 w-4 text-purple-500" /> 
                      Voice
                    </h3>
                    
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      <Select onValueChange={setSelectedVoice} value={selectedVoice}>
                        <SelectTrigger className="rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                          <SelectValue placeholder="Select voice" />
                        </SelectTrigger>
                        <SelectContent>
                          {voices.map((voice) => (
                            <SelectItem key={voice.id} value={voice.id}>
                              {voice.name} ({voice.gender})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={previewVoice}
                        className="h-10 w-10 rounded-lg"
                      >
                        {isPreviewingVoice ? 
                          <Pause className="h-4 w-4" /> : 
                          <Play className="h-4 w-4" />
                        }
                      </Button>
                    </div>
                  </div>
                  
                  {/* Voice Speed */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium">Voice Speed</h3>
                      <span className="text-sm font-medium text-purple-600 dark:text-purple-400">{voiceSpeed.toFixed(1)}x</span>
                    </div>
                    <Slider
                      min={0.5}
                      max={2.0}
                      step={0.1}
                      value={[voiceSpeed]}
                      onValueChange={(values) => setVoiceSpeed(values[0])}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>Slower</span>
                      <span>Normal</span>
                      <span>Faster</span>
                    </div>
                  </div>
                  
                  {/* Language */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium">Language</h3>
                    <Select onValueChange={setLanguage} value={language}>
                      <SelectTrigger className="rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                        <SelectValue placeholder="Select language" />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Background Sound */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium flex items-center gap-2">
                      <VolumeX className="h-4 w-4 text-orange-500" /> 
                      Background Sound
                    </h3>
                    <Select onValueChange={(value: "off" | "office" | "cafe" | "nature") => setBackgroundSound(value)} value={backgroundSound}>
                      <SelectTrigger className="rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                        <SelectValue placeholder="Select background sound" />
                      </SelectTrigger>
                      <SelectContent>
                        {backgroundSoundOptions.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="background-denoising" 
                        checked={backgroundDenoising} 
                        onCheckedChange={setBackgroundDenoising}
                      />
                      <Label htmlFor="background-denoising">Background denoising</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="model" className="mt-0">
                <div className="space-y-6">
                  {/* Model Provider */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium flex items-center gap-2">
                      <Brain className="h-4 w-4 text-indigo-500" /> 
                      Model Provider
                    </h3>
                    <Select onValueChange={setModelProvider} value={modelProvider}>
                      <SelectTrigger className="rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                        <SelectValue placeholder="Select model provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {modelProviders.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {/* Model Name */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium">Model Name</h3>
                    <Input 
                      placeholder="e.g., gpt-4o, claude-3-opus"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="rounded-lg border-slate-200 dark:border-slate-700"
                    />
                  </div>
                  
                  {/* Temperature */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-medium">Temperature</h3>
                      <span className="text-sm font-medium text-purple-600 dark:text-purple-400">{temperature.toFixed(1)}</span>
                    </div>
                    <Slider
                      min={0}
                      max={1}
                      step={0.1}
                      value={[temperature]}
                      onValueChange={(values) => setTemperature(values[0])}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>More deterministic</span>
                      <span>More creative</span>
                    </div>
                  </div>
                  
                  {/* Emotion Recognition */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="emotion-recognition" 
                        checked={emotionRecognitionEnabled} 
                        onCheckedChange={setEmotionRecognitionEnabled}
                      />
                      <Label htmlFor="emotion-recognition">Enable emotion recognition</Label>
                    </div>
                    <p className="text-xs text-slate-500">
                      When enabled, the agent will attempt to recognize and respond to emotions in user responses
                    </p>
                  </div>
                  
                  {/* Transcription Provider */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium flex items-center gap-2">
                      <Mic className="h-4 w-4 text-red-500" /> 
                      Transcription Provider
                    </h3>
                    <Select onValueChange={setTranscriptionProvider} value={transcriptionProvider}>
                      <SelectTrigger className="rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700">
                        <SelectValue placeholder="Select transcription provider" />
                      </SelectTrigger>
                      <SelectContent>
                        {transcriptionProviders.map((provider) => (
                          <SelectItem key={provider.id} value={provider.id}>
                            {provider.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center space-x-2">
                      <Switch 
                        id="disable-partial-transcripts" 
                        checked={disablePartialTranscripts} 
                        onCheckedChange={setDisablePartialTranscripts}
                      />
                      <Label htmlFor="disable-partial-transcripts">Disable partial transcripts</Label>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="behavior" className="mt-0">
                <div className="space-y-6">
                  {/* Call Duration */}
                  <div className="space-y-3">
                    <h3 className="text-base font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" /> 
                      Call Timing
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="max-duration" className="text-sm">Maximum Call Duration (seconds)</Label>
                        <Input 
                          id="max-duration"
                          type="number" 
                          min={60} 
                          max={3600} 
                          value={maxDurationSeconds} 
                          onChange={(e) => setMaxDurationSeconds(parseInt(e.target.value))} 
                          className="rounded-lg border-slate-200 dark:border-slate-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="silence-timeout" className="text-sm">Silence Timeout (seconds)</Label>
                        <Input 
                          id="silence-timeout"
                          type="number" 
                          min={5} 
                          max={60} 
                          value={silenceTimeoutSeconds} 
                          onChange={(e) => setSilenceTimeoutSeconds(parseInt(e.target.value))} 
                          className="rounded-lg border-slate-200 dark:border-slate-700"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* End Call Configuration */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium">End Call Configuration</h3>
                    <div className="space-y-2">
                      <Label htmlFor="end-call-message" className="text-sm">End Call Message</Label>
                      <Input 
                        id="end-call-message"
                        placeholder="Thank you for your time, goodbye!"
                        value={endCallMessage}
                        onChange={(e) => setEndCallMessage(e.target.value)}
                        className="rounded-lg border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="silence-timeout-message" className="text-sm">Silence Timeout Message</Label>
                      <Input 
                        id="silence-timeout-message"
                        placeholder="I haven't heard from you in a while..."
                        value={silenceTimeoutMessage}
                        onChange={(e) => setSilenceTimeoutMessage(e.target.value)}
                        className="rounded-lg border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-call-phrases" className="text-sm">End Call Trigger Phrases (comma separated)</Label>
                      <Textarea 
                        id="end-call-phrases"
                        placeholder="goodbye, end call, hang up"
                        value={endCallPhrasesText}
                        onChange={(e) => setEndCallPhrasesText(e.target.value)}
                        className="rounded-lg border-slate-200 dark:border-slate-700"
                      />
                      <p className="text-xs text-slate-500">
                        When the user says any of these phrases, the call will end automatically
                      </p>
                    </div>
                  </div>
                  
                  {/* Speaking Behavior */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium">Speaking Behavior</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start-speaking-delay" className="text-sm">Start Speaking Delay (seconds)</Label>
                        <Input 
                          id="start-speaking-delay"
                          type="number" 
                          min={0} 
                          max={2} 
                          step={0.1}
                          value={startSpeakingDelay} 
                          onChange={(e) => setStartSpeakingDelay(parseFloat(e.target.value))} 
                          className="rounded-lg border-slate-200 dark:border-slate-700"
                        />
                      </div>
                      <div className="space-y-2 flex items-end">
                        <div className="flex items-center space-x-2 h-10">
                          <Switch 
                            id="smart-endpointing" 
                            checked={smartEndpointing} 
                            onCheckedChange={setSmartEndpointing}
                          />
                          <Label htmlFor="smart-endpointing">Smart endpointing</Label>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="acknowledgement-phrases" className="text-sm">Acknowledgement Phrases (comma separated)</Label>
                      <Textarea 
                        id="acknowledgement-phrases"
                        placeholder="I understand, I see, got it"
                        value={acknowledgementPhrasesText}
                        onChange={(e) => setAcknowledgementPhrasesText(e.target.value)}
                        className="rounded-lg border-slate-200 dark:border-slate-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="interruption-phrases" className="text-sm">Interruption Phrases (comma separated)</Label>
                      <Textarea 
                        id="interruption-phrases"
                        placeholder="stop, wait, hold on"
                        value={interruptionPhrasesText}
                        onChange={(e) => setInterruptionPhrasesText(e.target.value)}
                        className="rounded-lg border-slate-200 dark:border-slate-700"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="advanced" className="mt-0">
                <div className="space-y-6">
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="transcription-advanced">
                      <AccordionTrigger className="text-base font-medium">Transcription Advanced Settings</AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="utterance-silence-threshold" className="text-sm">End Utterance Silence Threshold (seconds)</Label>
                          <Input 
                            id="utterance-silence-threshold"
                            type="number" 
                            min={0.1} 
                            max={2} 
                            step={0.1}
                            value={endUtteranceSilenceThreshold} 
                            onChange={(e) => setEndUtteranceSilenceThreshold(parseFloat(e.target.value))} 
                            className="rounded-lg border-slate-200 dark:border-slate-700"
                          />
                          <p className="text-xs text-slate-500">
                            How much silence is needed before considering an utterance complete
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="voice-output-advanced">
                      <AccordionTrigger className="text-base font-medium">Voice Output Advanced Settings</AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-4">
                        <p className="text-sm text-slate-500">
                          Advanced voice configuration options will be available in a future update
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="model-advanced">
                      <AccordionTrigger className="text-base font-medium">Model Advanced Settings</AccordionTrigger>
                      <AccordionContent className="space-y-4 pt-4">
                        <p className="text-sm text-slate-500">
                          Advanced model configuration options will be available in a future update
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </TabsContent>
            </div>
          </Tabs>
          
          <DialogFooter className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isLoading}
              className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700"
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Sheet open={showVoiceInfo} onOpenChange={setShowVoiceInfo}>
        <SheetContent className="max-w-md p-0">
          <SheetHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 text-white">
            <SheetTitle className="text-white">Voice Information</SheetTitle>
            <SheetDescription className="text-white/80">
              Details about the ElevenLabs voice
            </SheetDescription>
          </SheetHeader>
          <div className="p-5 space-y-5">
            <div>
              <h3 className="font-medium mb-2">Voice: {currentVoiceObject.name}</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                This is a premium {currentVoiceObject.gender} voice from ElevenLabs designed to sound natural and expressive.
              </p>
            </div>
            <Button 
              onClick={previewVoice}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700"
            >
              {isPreviewingVoice ? "Stop Preview" : "Preview Voice"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
