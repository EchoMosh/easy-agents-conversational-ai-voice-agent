
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
      
      // Fetch current agent data
      const fetchAgentData = async () => {
        try {
          // First, get the agent's basic settings
          const { data: agentData, error: agentError } = await supabase
            .from('agents')
            .select('voice_id, language, humor_level')
            .eq('id', agentId)
            .maybeSingle();
            
          if (agentError) throw agentError;
          
          if (agentData) {
            // Set voice if exists
            if (agentData.voice_id) {
              setVoice(agentData.voice_id);
            }
            
            // Set language if exists
            if (agentData.language) {
              setLanguage(agentData.language);
            }
            
            // Set humor level if exists
            if (agentData.humor_level !== undefined && agentData.humor_level !== null) {
              setHumorLevel(agentData.humor_level);
            }
          }
          
          // Then get the knowledge base associations from the junction table
          const { data: knowledgeData, error: knowledgeError } = await supabase
            .from('agent_knowledge')
            .select('knowledge_id')
            .eq('agent_id', agentId)
            .limit(1)  // For now, just get the first one since UI only supports one
            .maybeSingle();
            
          if (knowledgeError) throw knowledgeError;
          
          // If the agent has a knowledge base, set it in the state
          if (knowledgeData) {
            setKnowledgeBase(knowledgeData.knowledge_id);
          } else {
            setKnowledgeBase("none");
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
        voice,
        language,
        humorLevel,
        knowledgeBase
      });
      
      // Start a transaction to update both tables
      // First update the agent settings
      const { error: agentError } = await supabase
        .from('agents')
        .update({
          voice_id: voice || null,
          language: language,
          humor_level: humorLevel,
        })
        .eq('id', agentId);
      
      if (agentError) {
        console.error("Supabase agent update error:", agentError);
        throw new Error(`Database error: ${agentError.message}`);
      }
      
      // Now handle the knowledge base relationship
      if (knowledgeBase === "none") {
        // If "none" is selected, remove any existing relationships
        const { error: deleteError } = await supabase
          .from('agent_knowledge')
          .delete()
          .eq('agent_id', agentId);
          
        if (deleteError) {
          console.error("Supabase knowledge relationship delete error:", deleteError);
          throw new Error(`Database error: ${deleteError.message}`);
        }
      } else {
        // Check if a relationship already exists
        const { data: existingRelation, error: checkError } = await supabase
          .from('agent_knowledge')
          .select('id, knowledge_id')
          .eq('agent_id', agentId);
          
        if (checkError) {
          console.error("Supabase check relationship error:", checkError);
          throw new Error(`Database error: ${checkError.message}`);
        }
        
        if (existingRelation && existingRelation.length > 0) {
          // If relationship exists, update it if different
          const existingRelationship = existingRelation[0];
          if (existingRelationship.knowledge_id !== knowledgeBase) {
            const { error: updateError } = await supabase
              .from('agent_knowledge')
              .update({ knowledge_id: knowledgeBase })
              .eq('id', existingRelationship.id);
              
            if (updateError) {
              console.error("Supabase update relationship error:", updateError);
              throw new Error(`Database error: ${updateError.message}`);
            }
          }
        } else {
          // If no relationship exists, create one
          const { error: insertError } = await supabase
            .from('agent_knowledge')
            .insert({
              agent_id: agentId,
              knowledge_id: knowledgeBase
            });
            
          if (insertError) {
            console.error("Supabase insert relationship error:", insertError);
            throw new Error(`Database error: ${insertError.message}`);
          }
        }
      }
      
      // Call the onUpdateSettings prop to maintain component API compatibility
      try {
        await onUpdateSettings({
          voiceId: voice,
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
              <Select onValueChange={setVoice} value={voice}>
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
