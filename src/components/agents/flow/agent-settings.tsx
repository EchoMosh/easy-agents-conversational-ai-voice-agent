
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
import { Play, Pause, Info, VolumeX, Volume2 } from "lucide-react";
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

// Single ElevenLabs voice
const voice = { id: "FGY2WhTYpPnrIDTdsKH5", name: "Laura" };

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
  const [language, setLanguage] = React.useState(currentLanguage || "en-US");
  const [knowledgeBase, setKnowledgeBase] = React.useState("none");
  const [humorLevel, setHumorLevel] = React.useState(currentHumorLevel);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPreviewingVoice, setIsPreviewingVoice] = React.useState(false);
  const [audioElement, setAudioElement] = React.useState<HTMLAudioElement | null>(null);
  const [showVoiceInfo, setShowVoiceInfo] = React.useState(false);
  const { toast } = useToast();
  
  // Fetch knowledge documents with refetch capability
  const { data: knowledgeDocuments, isLoading: isLoadingDocuments, refetch } = useQuery({
    queryKey: ['knowledgeDocuments'],
    queryFn: fetchDocuments,
    staleTime: 0, // Always consider data stale to ensure fresh fetches
  });
  
  // Initialize audio element for voice preview
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
  
  // Refetch documents when dialog opens
  React.useEffect(() => {
    if (open) {
      refetch();
      
      // Also fetch current agent data to get the currently selected knowledge base
      const fetchAgentData = async () => {
        try {
          const { data, error } = await supabase
            .from('agents')
            .select('knowledge_ids, voice_id, language, humor_level')
            .eq('id', agentId)
            .maybeSingle();
            
          if (error) throw error;
          
          if (data) {
            // Set language if exists
            if (data.language) {
              setLanguage(data.language);
            }
            
            // Set humor level if exists
            if (data.humor_level !== undefined && data.humor_level !== null) {
              setHumorLevel(data.humor_level);
            }
            
            // If the agent has a knowledge base, set it in the state
            if (data.knowledge_ids && data.knowledge_ids.length > 0) {
              setKnowledgeBase(data.knowledge_ids[0]);
            } else {
              setKnowledgeBase("none");
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
  
  // Format knowledge documents for dropdown
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
      console.log("Saving agent settings:", {
        agentId,
        voice: voice.id,
        language,
        humorLevel,
        knowledgeBase
      });
      
      // First update the agent in Supabase
      const updateData = {
        voice_id: voice.id,
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
      
      // Call the onUpdateSettings prop to maintain component API compatibility
      try {
        await onUpdateSettings({
          voiceId: voice.id,
          language,
          knowledgeBaseId: knowledgeBase === "none" ? null : knowledgeBase,
          humorLevel: humorLevel,
        });
      } catch (callbackError) {
        console.error("onUpdateSettings callback error:", callbackError);
        // We don't throw here because we already updated the database successfully
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

  // Preview voice function
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
    
    // If the voice is already playing, stop it
    if (isPreviewingVoice) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setIsPreviewingVoice(false);
      return;
    }
    
    try {
      setIsPreviewingVoice(true);
      
      console.log("Previewing voice:", voice.id);
      
      // Prepare the payload for the edge function
      const payload = { 
        text: "Hello, this is a preview of my voice.",
        voice_id: voice.id,
        model_id: "eleven_multilingual_v2"
      };
      
      console.log("Sending text-to-speech request with payload:", payload);
      
      // Call the text-to-speech edge function
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
      
      // Create a new audio source from the base64 audio content
      try {
        // Safe conversion of base64 to binary
        const binaryData = atob(response.data.audio_content);
        const bytes = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }
        
        const audioBlob = new Blob([bytes], { type: 'audio/mpeg' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        console.log("Created audio URL:", audioUrl);
        
        // Set the source and load the audio
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
        
        // Setup cleanup function
        audioElement.onended = () => {
          console.log("Audio playback ended");
          setIsPreviewingVoice(false);
          URL.revokeObjectURL(audioUrl);
        };
      } catch (blobError) {
        console.error('Error creating audio blob:', blobError);
        throw new Error(`Failed to create audio: ${blobError instanceof Error ? blobError.message : String(blobError)}`);
      }
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
            {/* Header with gradient background */}
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 text-white">
              <DialogTitle className="text-2xl font-bold tracking-tight mb-1">Agent Settings</DialogTitle>
              <DialogDescription className="text-white/90 text-sm">
                Configure your agent's voice, language, and knowledge settings
              </DialogDescription>
            </div>
            
            {/* Main content */}
            <div className="p-6 max-h-[calc(80vh-140px)] overflow-y-auto space-y-8">
              {/* Voice Section */}
              <div className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
                <h3 className="text-lg font-medium flex items-center gap-2 mb-4">
                  <Volume2 className="h-5 w-5 text-purple-500" /> 
                  Voice Settings
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="voice" className="text-sm font-medium mb-2 block">Voice</Label>
                    <div className="grid grid-cols-[1fr_auto_auto] gap-2">
                      <div className="border rounded-lg px-4 py-2.5 bg-gray-50 dark:bg-gray-900 flex items-center">
                        {voice.name}
                      </div>
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
                
              {/* Language and Humor Section */}
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
                
              {/* Knowledge Base Section */}
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
            </div>
            
            {/* Footer */}
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
      
      {/* Voice Information Sheet */}
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
              <h3 className="font-medium">Voice: {voice.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This is a premium voice from ElevenLabs designed to sound natural and expressive.
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
