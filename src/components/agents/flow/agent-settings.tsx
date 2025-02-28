
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings } from "lucide-react";
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

// Voices data for the dropdown select
const voices = [
  { id: "alloy", name: "Alloy - Balanced" },
  { id: "echo", name: "Echo - Baritone" },
  { id: "fable", name: "Fable - British" },
  { id: "onyx", name: "Onyx - Deep" },
  { id: "nova", name: "Nova - Warm" },
  { id: "shimmer", name: "Shimmer - Clear" },
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
  const [voice, setVoice] = React.useState(currentVoice || "");
  const [language, setLanguage] = React.useState(currentLanguage || "en-US");
  const [knowledgeBase, setKnowledgeBase] = React.useState("none");
  const [humorLevel, setHumorLevel] = React.useState(currentHumorLevel);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  
  // Fetch knowledge documents with refetch capability
  const { data: knowledgeDocuments, isLoading: isLoadingDocuments, refetch } = useQuery({
    queryKey: ['knowledgeDocuments'],
    queryFn: fetchDocuments,
    staleTime: 0, // Always consider data stale to ensure fresh fetches
  });
  
  // Refetch documents when dialog opens
  React.useEffect(() => {
    if (open) {
      refetch();
      
      // Also fetch current agent data to get the currently selected knowledge base
      const fetchAgentData = async () => {
        try {
          const { data, error } = await supabase
            .from('agents')
            .select('knowledge_ids')
            .eq('id', agentId)
            .single();
            
          if (error) throw error;
          
          // If the agent has a knowledge base, set it in the state
          if (data && data.knowledge_ids && data.knowledge_ids.length > 0) {
            setKnowledgeBase(data.knowledge_ids[0]);
          } else {
            setKnowledgeBase("none");
          }
        } catch (error) {
          console.error("Error fetching agent data:", error);
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
      // First update the agent in Supabase
      const updateData: any = {
        voice_id: voice || null,
        language: language,
        humor_level: humorLevel,
      };
      
      // Handle knowledge base linking
      if (knowledgeBase && knowledgeBase !== "none") {
        // Save the knowledge ID in the agent's knowledge_ids array
        updateData.knowledge_ids = [knowledgeBase];
      } else {
        // Clear the knowledge base association
        updateData.knowledge_ids = [];
      }
      
      const { error } = await supabase
        .from('agents')
        .update(updateData)
        .eq('id', agentId);
      
      if (error) throw error;
      
      // Call the onUpdateSettings prop to maintain component API compatibility
      await onUpdateSettings({
        voiceId: voice,
        language,
        knowledgeBaseId: knowledgeBase === "none" ? null : knowledgeBase,
        humorLevel: humorLevel,
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
        description: "Failed to update agent settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
              <Select onValueChange={setVoice} defaultValue={voice}>
                <SelectTrigger>
                  <SelectValue placeholder="Select voice" />
                </SelectTrigger>
                <SelectContent>
                  {voices.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Choose the voice for your agent
              </p>
            </div>
            <div className="space-y-3">
              <Label htmlFor="language">Language</Label>
              <Select onValueChange={setLanguage} defaultValue={language}>
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
                defaultValue={[humorLevel]}
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
