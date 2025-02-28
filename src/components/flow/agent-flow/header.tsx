
import { ArrowLeft, Check, Settings } from "lucide-react";
import { Agent } from "@/types/agent";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Agent as AgentType } from "@/types/agent";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

// Voice options
const voices = [
  { id: "alloy", name: "Alloy" },
  { id: "echo", name: "Echo" },
  { id: "fable", name: "Fable" },
  { id: "onyx", name: "Onyx" },
  { id: "nova", name: "Nova" },
  { id: "shimmer", name: "Shimmer" }
];

// Language options
const languages = [
  { id: "en", name: "English" },
  { id: "es", name: "Spanish" },
  { id: "fr", name: "French" },
  { id: "de", name: "German" },
  { id: "it", name: "Italian" },
  { id: "pt", name: "Portuguese" },
  { id: "nl", name: "Dutch" },
  { id: "ja", name: "Japanese" },
  { id: "zh", name: "Chinese" },
  { id: "ru", name: "Russian" }
];

interface HeaderProps {
  agent: AgentType;
  onBack: () => void;
  onUpdateSettings: (settings: { voiceId?: string; language?: string }) => void;
  mermaidChart?: string;
}

export function Header({ agent, onBack, onUpdateSettings, mermaidChart }: HeaderProps) {
  const [voiceId, setVoiceId] = useState<string>(agent.voice_id || '');
  const [language, setLanguage] = useState<string>(agent.language || 'en');
  const { toast } = useToast();
  const [showMermaid, setShowMermaid] = useState(false);

  const handleSaveSettings = async () => {
    try {
      await onUpdateSettings({
        voiceId,
        language
      });
      
      toast({
        title: "Settings updated",
        description: "Agent settings have been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        title: "Error",
        description: "Failed to update agent settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="border-b bg-white dark:bg-gray-950">
      <div className="flex h-16 items-center px-4 gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-medium">{agent.name}</h1>
          <p className="text-sm text-muted-foreground">
            {agent.role.replace(/_/g, ' ')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {mermaidChart && (
            <Button
              variant="outline"
              onClick={() => setShowMermaid(!showMermaid)}
            >
              {showMermaid ? "Hide Diagram" : "Show Diagram"}
            </Button>
          )}
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Agent Settings</SheetTitle>
                <SheetDescription>
                  Configure voice and language settings for your agent.
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6 py-6">
                <div className="space-y-2">
                  <Label htmlFor="voice">Voice</Label>
                  <Select value={voiceId} onValueChange={setVoiceId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Voices</SelectLabel>
                        {voices.map((voice) => (
                          <SelectItem key={voice.id} value={voice.id}>
                            {voice.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Languages</SelectLabel>
                        {languages.map((lang) => (
                          <SelectItem key={lang.id} value={lang.id}>
                            {lang.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full" onClick={handleSaveSettings}>
                  <Check className="mr-2 h-4 w-4" />
                  Save Settings
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      
      {showMermaid && mermaidChart && (
        <div className="p-4 border-t bg-gray-50 dark:bg-gray-900 overflow-auto max-h-96">
          <pre className="text-xs overflow-x-auto">{mermaidChart}</pre>
        </div>
      )}
    </div>
  );
}
