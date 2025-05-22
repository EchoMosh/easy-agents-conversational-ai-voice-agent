
import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription, // Added DialogDescription here
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
  VolumeX,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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

// Helper function to convert country code to flag emoji
const getFlagEmoji = (countryCode: string): string => {
  if (!countryCode || countryCode.length !== 2) return '';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

// Available voices data
const voices = [
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", gender: "female", image: "/voice-characters/laura.png", countryCode: "US" }, // Ensured Laura's image path
  { id: "UgBBYS2sOqTuMpoF3BR0", name: "Thomas", gender: "male", image: "/voice-characters/thomas.png", countryCode: "US" },
  { id: "pwMBn0SsmN1220Aorv15", name: "Michael", gender: "male", image: "/voice-characters/michael.png", countryCode: "US" },
  { id: "tempGabrielID12345", name: "Gabriel", gender: "male", image: "/voice-characters/gabriel.png", countryCode: "MX" }
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
  children,
  onUpdateSettings,
}: AgentSettingsProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedVoice, setSelectedVoice] = React.useState(currentVoice || voices[0].id);
  const [language, setLanguage] = React.useState(currentLanguage || "en");
  const [knowledgeBase, setKnowledgeBase] = React.useState("none");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPreviewingVoice, setIsPreviewingVoice] = React.useState(false);
  const [audioElement, setAudioElement] = React.useState<HTMLAudioElement | null>(null);
  const [showVoiceInfo, setShowVoiceInfo] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("voice");
  const [voiceDropdownOpen, setVoiceDropdownOpen] = React.useState(false);
  
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
            // Cast the data to our Agent type to access properties safely
            const agentData = data as unknown as Agent;
            
            // Basic settings
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
            
            // Advanced settings
            if (agentData.maxDurationSeconds) {
              setMaxDurationSeconds(agentData.maxDurationSeconds);
            }
            
            if (agentData.first_message) {
              setFirstMessage(agentData.first_message);
            }
            
            if (agentData.first_message_mode) {
              setFirstMessageMode(agentData.first_message_mode);
            }
            
            if (agentData.end_call_message) {
              setEndCallMessage(agentData.end_call_message);
            }
            
            if (agentData.silence_timeout_message) {
              setSilenceTimeoutMessage(agentData.silence_timeout_message);
            }
            
            if (agentData.call_timing?.silenceTimeoutSeconds) {
              setSilenceTimeoutSeconds(agentData.call_timing.silenceTimeoutSeconds);
            }
            
            if (agentData.background_sound) {
              setBackgroundSound(agentData.background_sound);
            }
            
            if (agentData.background_denoising_enabled !== undefined) {
              setBackgroundDenoising(agentData.background_denoising_enabled);
            }
            
            if (agentData.end_call_phrases) {
              setEndCallPhrases(agentData.end_call_phrases);
              setEndCallPhrasesText(agentData.end_call_phrases.join(', '));
            }
            
            // Voice config
            if (agentData.voice_config?.provider) {
              setVoiceProvider(agentData.voice_config.provider);
            }
            
            if (agentData.voice_config?.speed) {
              setVoiceSpeed(agentData.voice_config.speed);
            }
            
            // Model config
            if (agentData.model_config?.provider) {
              setModelProvider(agentData.model_config.provider);
            }
            
            if (agentData.model_config?.model) {
              setModel(agentData.model_config.model);
            }
            
            if (agentData.model_config?.temperature) {
              setTemperature(agentData.model_config.temperature);
            }
            
            if (agentData.model_config?.emotionRecognitionEnabled !== undefined) {
              setEmotionRecognitionEnabled(agentData.model_config.emotionRecognitionEnabled);
            }
            
            // Transcription config
            if (agentData.transcriber_config?.provider) {
              setTranscriptionProvider(agentData.transcriber_config.provider);
            }
            
            if (agentData.transcriber_config?.disablePartialTranscripts !== undefined) {
              setDisablePartialTranscripts(agentData.transcriber_config.disablePartialTranscripts);
            }
            
            if (agentData.transcriber_config?.endUtteranceSilenceThreshold) {
              setEndUtteranceSilenceThreshold(agentData.transcriber_config.endUtteranceSilenceThreshold);
            }
            
            // Speaking behavior
            if (agentData.speaking_behavior?.startSpeakingDelay) {
              setStartSpeakingDelay(agentData.speaking_behavior.startSpeakingDelay);
            }
            
            if (agentData.speaking_behavior?.smartEndpointingEnabled !== undefined) {
              setSmartEndpointing(agentData.speaking_behavior.smartEndpointingEnabled);
            }
            
            if (agentData.speaking_behavior?.acknowledgementPhrases) {
              setAcknowledgementPhrasesText(agentData.speaking_behavior.acknowledgementPhrases.join(', '));
            }
            
            if (agentData.speaking_behavior?.interruptionPhrases) {
              setInterruptionPhrasesText(agentData.speaking_behavior.interruptionPhrases.join(', '));
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
        knowledgeBase,
        maxDurationSeconds
      });
      
      const updateData = {
        // Basic settings
        voice_id: selectedVoice,
        language: language,
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
        ? "Nice to meet you! I'm your new AI voice, here to help you with your calls."
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
        <DialogContent className="p-0 max-w-4xl rounded-lg overflow-hidden border dark:border-gray-800 shadow-xl bg-background"> {/* Reduced max-width, adjusted rounding/shadow */}
          {/* Updated Dialog Header for monotone theme */}
          <div className="p-3 border-b border-border"> {/* Reduced padding */}
            <DialogHeader className="pb-0">
              <DialogTitle className="text-lg font-semibold text-foreground">Agent Voice & Behavior</DialogTitle> {/* Reduced font size */}
              <DialogDescription className="sr-only">Configure voice, messaging, and call behavior settings for the agent.</DialogDescription>
            </DialogHeader>
          </div>
          
          {/* Tabs removed, content will be displayed directly */}
          <div className="p-4 md:p-6 max-h-[calc(100vh-180px)] overflow-y-auto space-y-6"> {/* Added space-y-6 for spacing between sections */}
            {/* Voice Section */}
            {/* <TabsContent value="voice" className="mt-0"> */} {/* This line is commented out/removed */}
                <div className="space-y-4 md:space-y-6"> {/* Reduced spacing */}
                  {/* Section 1: Voice Character and Selection */}
                  <div className="bg-card text-card-foreground rounded-lg p-4 border border-border shadow-sm"> {/* Reduced padding */}
                    <h3 className="text-base font-semibold mb-4 flex items-center gap-2 text-foreground"> {/* Reduced font size and margin */}
                      <Mic className="h-4 w-4 text-primary" />
                      Configure Voice
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:gap-6">
                      {/* Voice Configuration Options Column */}
                      <div className="space-y-4 pt-0"> {/* Reduced spacing */}
                        <div>
                          <Label className="mb-2 block text-sm font-medium text-muted-foreground">Select a voice</Label>
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-row items-center gap-3">
                              <div className="flex-1">
                                <Select 
                                  value={selectedVoice} 
                                  onValueChange={setSelectedVoice}
                                >
                                  <SelectTrigger className="w-full h-14 rounded-xl px-4 text-lg font-medium bg-white border border-gray-200 shadow-none hover:border-gray-300 focus:ring-2 focus:ring-primary/20 transition">
                                    <SelectValue
                                      placeholder="Select a voice"
                                      className="flex items-center gap-3"
                                    >
                                      {(() => {
                                        const v = voices.find(voice => voice.id === selectedVoice);
                                        if (!v) return null;
                                        return (
                                          <span className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8">
                                              <AvatarImage src={v.image} alt={v.name} className="object-cover object-top" />
                                              <AvatarFallback>{v.name.substring(0, 1)}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-xl">{getFlagEmoji(v.countryCode)}</span>
                                            <span className="text-lg font-medium">{v.name}</span>
                                          </span>
                                        );
                                      })()}
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {voices.map((voice) => (
                                      <SelectItem key={voice.id} value={voice.id} className="py-3 px-2 text-lg">
                                        <div className="flex items-center gap-3">
                                          <Avatar className="h-8 w-8">
                                            <AvatarImage src={voice.image} alt={voice.name} className="object-cover object-top" />
                                            <AvatarFallback>{voice.name.substring(0,1)}</AvatarFallback>
                                          </Avatar>
                                          <span className="text-xl">{getFlagEmoji(voice.countryCode)}</span>
                                          <span className="text-lg font-medium">{voice.name}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                variant="ghost"
                                size="lg"
                                onClick={previewVoice}
                                className="ml-2 px-5 h-14 rounded-xl border border-gray-200 bg-white shadow-none hover:bg-gray-50 text-base font-medium flex items-center gap-2 transition"
                              >
                                {isPreviewingVoice ? (
                                  <>
                                    <Pause className="h-5 w-5" />
                                    <span>Stop</span>
                                  </>
                                ) : (
                                  <>
                                    <Play className="h-5 w-5" />
                                    <span>Preview</span>
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        {/* Voice Speed Removed as it's not in the new design image */}

                        {/* Divider within the right column - can be kept or removed based on overall layout */}
                        {/* <hr className="my-4 border-border" /> */}

                        {/* Language Selection - can be kept if still needed, or removed if voice implies language */}
                        <div>
                          <Label className="mb-1.5 block text-sm text-muted-foreground">Language</Label> {/* Reduced margin */}
                          <Select onValueChange={setLanguage} value={language}>
                            <SelectTrigger className="rounded-md bg-background border-border h-9"> {/* Reduced height */}
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
                        
                        {/* Knowledge Base Selection */}
                        <div>
                          <Label className="mb-1.5 block text-sm text-muted-foreground">Knowledge Base</Label> {/* Reduced margin */}
                          <Select onValueChange={setKnowledgeBase} value={knowledgeBase}>
                            <SelectTrigger className="rounded-md bg-background border-border h-9"> {/* Reduced height */}
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
                          <p className="text-xs text-muted-foreground mt-1.5"> {/* Reduced margin */}
                            Connect a knowledge base to provide your agent with specific information
                          </p>
                        </div>

                        {/* Background Sound Selection */}
                        <div>
                          <Label className="mb-1.5 block text-sm text-muted-foreground">Background Sound</Label> {/* Reduced margin */}
                          <Select onValueChange={(value: "off" | "office" | "cafe" | "nature") => setBackgroundSound(value)} value={backgroundSound}>
                            <SelectTrigger className="rounded-md bg-background border-border h-9"> {/* Reduced height */}
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
                        </div>
                        
                        {/* Background Denoising Switch Removed */}
                      </div>
                    </div>
                  </div>
                </div>
              {/* </TabsContent> */} {/* This line is commented out/removed */}
              
              {/* AI Model Tab Content Removed (If it was here, ensure it's handled or noted if removed previously) */}

              {/* Messaging Tab Content Removed */}
              
              {/* Call Behavior Section */}
              {/* <TabsContent value="behavior" className="mt-0"> */} {/* This line is commented out/removed */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"> {/* Reduced gap */}
                  {/* Card 6: Call Timing */}
                  <div className="bg-card text-card-foreground rounded-lg p-4 border border-border shadow-sm"> {/* Reduced padding */}
                    <h3 className="text-base font-semibold mb-3 flex items-center gap-2 text-foreground"> {/* Reduced margin */}
                      <Clock className="h-4 w-4 text-muted-foreground" /> 
                      Call Timing
                    </h3>
                    
                    <div className="space-y-4"> {/* Reduced spacing */}
                      <div>
                        <Label className="mb-1.5 block text-sm text-muted-foreground">Maximum Call Duration (seconds)</Label> {/* Reduced margin */}
                        <Input 
                          type="number" 
                          min={60} 
                          max={3600} 
                          value={maxDurationSeconds} 
                          onChange={(e) => setMaxDurationSeconds(parseInt(e.target.value))} 
                          className="rounded-md border-border bg-background h-9" /* Reduced height */
                        />
                      </div>
                      
                      <div>
                        <Label className="mb-1.5 block text-sm text-muted-foreground">Silence Timeout (seconds)</Label> {/* Reduced margin */}
                        <Input 
                          type="number" 
                          min={5} 
                          max={60} 
                          value={silenceTimeoutSeconds} 
                          onChange={(e) => setSilenceTimeoutSeconds(parseInt(e.target.value))} 
                          className="rounded-md border-border bg-background h-9" /* Reduced height */
                        />
                        <p className="text-xs text-muted-foreground mt-1.5"> {/* Reduced margin */}
                          How long to wait in silence before ending the call
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Card 7: Speaking Behavior */}
                  <div className="bg-card text-card-foreground rounded-lg p-4 border border-border shadow-sm"> {/* Reduced padding */}
                    <h3 className="text-base font-semibold mb-3 flex items-center gap-2 text-foreground"> {/* Reduced margin */}
                      <MessageSquare className="h-4 w-4 text-muted-foreground" /> 
                      Speaking Behavior
                    </h3>
                    
                    <div className="space-y-4"> {/* Reduced spacing */}
                      <div>
                        <Label className="mb-1.5 block text-sm text-muted-foreground">Start Speaking Delay (seconds)</Label> {/* Reduced margin */}
                        <Input 
                          type="number" 
                          min={0} 
                          max={2} 
                          step={0.1}
                          value={startSpeakingDelay} 
                          onChange={(e) => setStartSpeakingDelay(parseFloat(e.target.value))} 
                          className="rounded-md border-border bg-background h-9" /* Reduced height */
                        />
                        <p className="text-xs text-muted-foreground mt-1.5"> {/* Reduced margin */}
                          How long to pause before the agent starts speaking
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2"> {/* Reduced spacing */}
                        <Switch 
                          id="smart-endpointing" 
                          checked={smartEndpointing} 
                          onCheckedChange={setSmartEndpointing}
                          className="data-[state=checked]:bg-primary data-[state=unchecked]:bg-input" /* Adjusted switch style */
                        />
                        <Label htmlFor="smart-endpointing" className="text-sm text-muted-foreground">Enable smart endpointing</Label> 
                      </div>
                      
                      <div>
                        <Label className="mb-1.5 block text-sm text-muted-foreground">Acknowledgement Phrases</Label> {/* Reduced margin */}
                        <Textarea 
                          placeholder="I understand, I see, got it"
                          value={acknowledgementPhrasesText}
                          onChange={(e) => setAcknowledgementPhrasesText(e.target.value)}
                          className="rounded-md border-border bg-background min-h-[60px]" /* Reduced min-height */
                        />
                        <p className="text-xs text-muted-foreground mt-1.5"> {/* Reduced margin */}
                          Enter phrases separated by commas. These phrases are used to acknowledge user input.
                        </p>
                      </div>
                      
                      <div>
                        <Label className="mb-1.5 block text-sm text-muted-foreground">Interruption Phrases</Label> {/* Reduced margin */}
                        <Textarea 
                          placeholder="stop, wait, hold on"
                          value={interruptionPhrasesText}
                          onChange={(e) => setInterruptionPhrasesText(e.target.value)}
                          className="rounded-md border-border bg-background min-h-[60px]" /* Reduced min-height */
                        />
                        <p className="text-xs text-muted-foreground mt-1.5"> {/* Reduced margin */}
                          Enter phrases separated by commas. When the user says any of these phrases, the agent will stop speaking.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              {/* </TabsContent> */} {/* This line is commented out/removed */}
              
              {/* Advanced Tab Content Removed */}
          </div>
          
          <DialogFooter className="p-3 border-t border-border bg-muted/40 flex flex-row justify-end gap-2"> {/* Reduced padding */}
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isLoading}
              className="bg-primary text-primary-foreground hover:bg-primary/90" /* Standard primary button */
            >
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Sheet open={showVoiceInfo} onOpenChange={setShowVoiceInfo}>
        <SheetContent className="max-w-md p-0">
          <SheetHeader className="bg-gradient-to-r from-violet-500 to-indigo-600 p-4 text-white">
            <SheetTitle className="text-white">Voice Information</SheetTitle>
            <SheetDescription className="text-white/80">
              Details about the voice
            </SheetDescription>
          </SheetHeader>
          <div className="p-5 space-y-5">
            <div>
              <h3 className="font-medium mb-2">Voice: {currentVoiceObject.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This is a premium {currentVoiceObject.gender} voice designed to sound natural and expressive.
              </p>
            </div>
            <Button 
              onClick={previewVoice}
              className="w-full bg-gradient-to-r from-violet-500 to-indigo-600 text-white hover:from-violet-600 hover:to-indigo-700"
            >
              {isPreviewingVoice ? "Stop Preview" : "Preview Voice"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
