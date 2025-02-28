
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
import { useToast } from "@/hooks/use-toast";

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

// Knowledge base data for dropdown select
const knowledgeBases = [
  { id: "", name: "None" },
  { id: "kb-1", name: "Customer Support FAQ" },
  { id: "kb-2", name: "Product Documentation" },
  { id: "kb-3", name: "Company Policies" },
];

interface AgentSettingsProps {
  agentId: string;
  currentVoice?: string;
  currentLanguage?: string;
  children: React.ReactNode;
  onUpdateSettings: (settings: {
    voiceId?: string;
    language?: string;
    knowledgeBaseId?: string;
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
  const [voice, setVoice] = React.useState(currentVoice || "");
  const [language, setLanguage] = React.useState(currentLanguage || "en-US");
  const [knowledgeBase, setKnowledgeBase] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onUpdateSettings({
        voiceId: voice,
        language,
        knowledgeBaseId: knowledgeBase,
      });
      toast({
        title: "Success",
        description: "Agent settings updated",
      });
      setOpen(false);
    } catch (error) {
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agent Settings</DialogTitle>
          <DialogDescription>
            Configure the agent's voice and language settings
          </DialogDescription>
        </DialogHeader>
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
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
            <div className="space-y-2">
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
            <div className="space-y-2">
              <Label htmlFor="knowledge">Knowledge Base</Label>
              <Select onValueChange={setKnowledgeBase} defaultValue={knowledgeBase}>
                <SelectTrigger>
                  <SelectValue placeholder="Select knowledge base" />
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
        <DialogFooter>
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
