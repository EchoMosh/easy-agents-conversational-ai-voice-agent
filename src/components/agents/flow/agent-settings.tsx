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
  X
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
  { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura", gender: "female", image: "/voice-characters/laura.png", countryCode: "US" },
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
  
  // Advanced settings
  const [maxDurationSeconds, setMaxDurationSeconds] = React.useState(600);
  const [silenceTimeoutSeconds, setSilenceTimeoutSeconds] = React.useState(30);
  const [backgroundSound, setBackgroundSound] = React.useState<"off" | "office" | "cafe" | "nature">("off");
  const [startSpeakingDelay, setStartSpeakingDelay] = React.useState(0.4);
  const [smartEndpointing, setSmartEndpointing] = React.useState(false);
  const [acknowledgementPhrases, setAcknowledgementPhrases] = React.useState<string[]>([
    "I understand", "I see", "got it"
  ]);
  
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
            
            if (agentData.maxDurationSeconds) {
              setMaxDurationSeconds(agentData.maxDurationSeconds);
            }
            
            if (agentData.call_timing?.silenceTimeoutSeconds) {
              setSilenceTimeoutSeconds(agentData.call_timing.silenceTimeoutSeconds);
            }
            
            if (agentData.background_sound) {
              setBackgroundSound(agentData.background_sound);
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
      const updateData = {
        voice_id: selectedVoice,
        language: language,
        knowledge_ids: knowledgeBase && knowledgeBase !== "none" ? [knowledgeBase] : [],
        maxDurationSeconds: maxDurationSeconds,
        background_sound: backgroundSound,
        
        call_timing: {
          silenceTimeoutSeconds: silenceTimeoutSeconds,
          maxDurationSeconds: maxDurationSeconds
        },
        
        speaking_behavior: {
          startSpeakingDelay: startSpeakingDelay,
          smartEndpointingEnabled: smartEndpointing,
          acknowledgementPhrases: acknowledgementPhrases
        }
      };
      
      const { error } = await supabase
        .from('agents')
        .update(updateData)
        .eq('id', agentId);
      
      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }
      
      await onUpdateSettings({
        voiceId: selectedVoice,
        language,
        knowledgeBaseId: knowledgeBase === "none" ? null : knowledgeBase,
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
      
      const previewText = "Hello, this is a preview of my voice.";
      
      const payload = { 
        text: previewText,
        voice_id: selectedVoice,
        model_id: "eleven_multilingual_v2"
      };
      
      const response = await supabase.functions.invoke('text-to-speech', {
        method: 'POST',
        body: payload,
      });
      
      if (response.error) {
        throw new Error(`Failed to generate voice preview: ${response.error}`);
      }
      
      if (!response.data?.audio_content) {
        throw new Error('No audio content received');
      }
      
      const binaryData = atob(response.data.audio_content);
      const bytes = new Uint8Array(binaryData.length);
      for (let i = 0; i < binaryData.length; i++) {
        bytes[i] = binaryData.charCodeAt(i);
      }
      
      const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      audioElement.src = audioUrl;
      audioElement.load();
      
      await audioElement.play();
      
      audioElement.onended = () => {
        setIsPreviewingVoice(false);
        URL.revokeObjectURL(audioUrl);
      };
    } catch (error) {
      console.error('Error previewing voice:', error);
      toast({
        title: "Error",
        description: "Failed to preview voice",
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="p-0 max-w-2xl rounded-xl overflow-hidden border shadow-2xl bg-card">
        {/* Compact Header */}
        <div className="px-5 py-3 border-b border-border/50">
          <DialogHeader className="pb-0">
            <DialogTitle className="text-lg font-semibold text-foreground">Agent Voice & Behavior</DialogTitle>
            <DialogDescription className="sr-only">Configure voice, messaging, and call behavior settings for the agent.</DialogDescription>
          </DialogHeader>
        </div>
        
        {/* Main Content - 2 Column Layout */}
        <div className="p-5 max-h-[55vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              {/* Voice Selection */}
              <div>
                <Label className="mb-2 block text-sm font-medium text-muted-foreground">Voice</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <Select 
                      value={selectedVoice} 
                      onValueChange={setSelectedVoice}
                    >
                      <SelectTrigger className="w-full h-10 rounded-lg px-3 bg-background border-border">
                        <SelectValue>
                          {(() => {
                            const v = voices.find(voice => voice.id === selectedVoice);
                            if (!v) return null;
                            return (
                              <span className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarImage src={v.image} alt={v.name} className="object-cover object-top" />
                                  <AvatarFallback className="text-xs">{v.name.substring(0, 1)}</AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{getFlagEmoji(v.countryCode)}</span>
                                <span className="font-medium text-sm">{v.name}</span>
                              </span>
                            );
                          })()}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {voices.map((voice) => (
                          <SelectItem key={voice.id} value={voice.id} className="py-2 px-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={voice.image} alt={voice.name} className="object-cover object-top" />
                                <AvatarFallback className="text-xs">{voice.name.substring(0,1)}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm">{getFlagEmoji(voice.countryCode)}</span>
                              <span className="font-medium text-sm">{voice.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={previewVoice}
                    className="px-3 h-10 rounded-lg border-border bg-background hover:bg-muted flex items-center gap-1"
                  >
                    {isPreviewingVoice ? (
                      <Pause className="h-3 w-3" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                    <span className="text-xs">Preview</span>
                  </Button>
                </div>
              </div>

              {/* Language */}
              <div>
                <Label className="mb-2 block text-sm text-muted-foreground">Language</Label>
                <Select onValueChange={setLanguage} value={language}>
                  <SelectTrigger className="h-10 rounded-lg bg-background border-border">
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
              
              {/* Knowledge Base */}
              <div>
                <Label className="mb-2 block text-sm text-muted-foreground">Knowledge Base</Label>
                <Select onValueChange={setKnowledgeBase} value={knowledgeBase}>
                  <SelectTrigger className="h-10 rounded-lg bg-background border-border">
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
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Call Timing */}
              <div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="mb-2 block text-sm text-muted-foreground">Duration (sec)</Label>
                    <Input 
                      type="number" 
                      min={60} 
                      max={3600} 
                      value={maxDurationSeconds} 
                      onChange={(e) => setMaxDurationSeconds(parseInt(e.target.value))} 
                      className="h-10 rounded-lg border-border bg-background"
                    />
                  </div>
                  <div>
                    <Label className="mb-2 block text-sm text-muted-foreground">Silence Timeout (sec)</Label>
                    <Input 
                      type="number" 
                      min={5} 
                      max={60} 
                      value={silenceTimeoutSeconds} 
                      onChange={(e) => setSilenceTimeoutSeconds(parseInt(e.target.value))} 
                      className="h-10 rounded-lg border-border bg-background"
                    />
                  </div>
                </div>
              </div>

              {/* Speaking Behavior */}
              <div className="space-y-3">
                <div>
                  <Label className="mb-2 block text-sm text-muted-foreground">Speaking Delay (sec)</Label>
                  <Input 
                    type="number" 
                    min={0} 
                    max={2} 
                    step={0.1}
                    value={startSpeakingDelay} 
                    onChange={(e) => setStartSpeakingDelay(parseFloat(e.target.value))} 
                    className="h-10 rounded-lg border-border bg-background"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="smart-endpointing" className="text-sm text-muted-foreground">Smart endpointing</Label> 
                  <Switch 
                    id="smart-endpointing" 
                    checked={smartEndpointing} 
                    onCheckedChange={setSmartEndpointing}
                  />
                </div>
              </div>

              {/* Background Sound Toggle */}
              <div className="flex items-center justify-between">
                <Label htmlFor="background-sound" className="text-sm text-muted-foreground">Background Sound</Label>
                <Switch 
                  id="background-sound" 
                  checked={backgroundSound !== "off"} 
                  onCheckedChange={(checked) => setBackgroundSound(checked ? "office" : "off")}
                />
              </div>
            </div>
          </div>

          {/* Acknowledgement Phrases - Full Width */}
          <div className="mt-6 pt-4 border-t border-border/50">
            <Label className="mb-3 block text-sm text-muted-foreground">Acknowledgement Phrases</Label>
            
            {/* Phrase Pills */}
            <div className="flex flex-wrap gap-2 mb-3">
              {acknowledgementPhrases.map((phrase, index) => (
                <Badge 
                  key={index} 
                  variant="secondary" 
                  className="px-3 py-1 text-xs bg-muted hover:bg-muted/80 flex items-center gap-1"
                >
                  {phrase}
                  <button
                    onClick={() => removeAcknowledgementPhrase(index)}
                    className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
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
                className="h-9 text-sm rounded-lg border-border bg-background"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  addAcknowledgementPhrase(newPhrase);
                  setNewPhrase("");
                }}
                className="h-9 px-3 text-xs rounded-lg"
              >
                Add
              </Button>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <DialogFooter className="px-5 py-3 border-t border-border/50 bg-muted/20">
          <div className="flex gap-2 w-full justify-end">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="h-9 px-4 text-sm rounded-lg"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isLoading}
              className="h-9 px-4 text-sm rounded-lg"
            >
              {isLoading ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
