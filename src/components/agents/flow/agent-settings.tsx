
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
import { Play, Pause } from "lucide-react";
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
      setAudioElement(new Audio());
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
  }, [open, agentId, refetch, toast]);
  
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
    if (!audioElement) return;
    
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
      
      // Use the Supabase Edge Function to generate a voice preview
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { 
          text: "Hello, this is a preview of my voice.",
          voice_id: voice.id,
          model_id: "eleven_multilingual_v2"  // Specify the model explicitly
        }
      });
      
      if (error) {
        console.error("Voice preview error:", error);
        throw new Error('Failed to generate voice preview');
      }
      
      if (!data?.audio_content) {
        console.error("Missing audio content in response:", data);
        throw new Error('No audio content received');
      }
      
      // Create a new audio source from the base64 audio content
      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audio_content), c => c.charCodeAt(0))], 
        { type: 'audio/mp3' }
      );
      const audioUrl = URL.createObjectURL(audioBlob);
      
      audioElement.src = audioUrl;
      audioElement.onended = () => {
        setIsPreviewingVoice(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audioElement.play();
      
      // Add error handling for play()
      audioElement.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsPreviewingVoice(false);
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Agent Settings</DialogTitle>
          <DialogDescription>
            Configure the agent's voice and language settings
          </DialogDescription>
        </DialogHeader>
        <div className="p-8 space-y-8 max-h-[75vh] overflow-y-auto bg-background/50">
          <div className="grid gap-6">
            <div className="space-y-3">
              <Label htmlFor="voice">Voice</Label>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <div className="border rounded-md px-3 py-2 bg-background flex items-center">
                  {voice.name}
                </div>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={previewVoice}
                  className="h-10 w-10"
                >
                  {isPreviewingVoice ? 
                    <Pause className="h-4 w-4" /> : 
                    <Play className="h-4 w-4" />
                  }
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Click the play button to preview the voice
              </p>
            </div>
            <div className="space-y-3">
              <Label htmlFor="language">Language</Label>
              <Select onValueChange={setLanguage} value={language}>
                <SelectTrigger>
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
              <p className="text-xs text-gray-500">
                Choose the language for your agent
              </p>
            </div>
            <div className="space-y-3">
              <Label htmlFor="humor">Humor Level: {humorLevel}%</Label>
              <Slider
                id="humor"
                min={0}
                max={100}
                step={10}
                value={[humorLevel]}
                onValueChange={(values) => setHumorLevel(values[0])}
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Serious</span>
                <span>Balanced</span>
                <span>Humorous</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Set how humorous the agent should be in conversations
              </p>
            </div>
            <div className="space-y-3">
              <Label htmlFor="knowledge">Knowledge Base</Label>
              <Select onValueChange={setKnowledgeBase} value={knowledgeBase}>
                <SelectTrigger>
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
              <p className="text-xs text-gray-500">
                Connect a knowledge base to your agent
              </p>
            </div>
          </div>
        </div>
        <DialogFooter className="px-6 py-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
