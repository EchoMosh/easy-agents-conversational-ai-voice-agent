
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Settings, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type AgentSettingsProps = {
  agentId: string;
  currentVoice?: string;
  currentLanguage?: string;
  children?: React.ReactNode;
  onUpdateSettings: (settings: { voiceId?: string; language?: string; humorLevel?: number }) => Promise<void>;
};

const languages = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" }
];

const voices = [
  { id: "alloy", name: "Alloy", description: "Neutral and balanced" },
  { id: "echo", name: "Echo", description: "Warm and natural" },
  { id: "fable", name: "Fable", description: "British accent" },
  { id: "onyx", name: "Onyx", description: "Deep and authoritative" },
  { id: "nova", name: "Nova", description: "Energetic and engaging" },
  { id: "shimmer", name: "Shimmer", description: "Clear and expressive" },
];

export function AgentSettings({ agentId, currentVoice, currentLanguage, children, onUpdateSettings }: AgentSettingsProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(currentVoice || "alloy");
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage || "en");
  const [humorLevel, setHumorLevel] = useState(50);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);

  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoice(voiceId);
    onUpdateSettings({
      voiceId,
      language: selectedLanguage,
      humorLevel: humorLevel
    });
  };

  const playVoiceSample = async (e: React.MouseEvent, voiceId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      setIsPlayingVoice(true);
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: {
          text: "Hello! This is a sample of how I would sound as your AI assistant.",
          voice: voiceId
        }
      });

      if (error) throw error;

      const audio = new Audio(`data:audio/mp3;base64,${data.audioContent}`);
      await audio.play();

    } catch (error) {
      console.error('Error playing voice sample:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to play voice sample"
      });
    } finally {
      setIsPlayingVoice(false);
    }
  };

  const handleSave = async () => {
    await onUpdateSettings({
      voiceId: selectedVoice,
      language: selectedLanguage,
      humorLevel: humorLevel
    });
    setIsOpen(false);
  };

  const getHumorLabel = (value: number) => {
    if (value === 0) return "Neutral";
    if (value === 20) return "Slightly Playful";
    if (value === 40) return "Moderately Humorous";
    if (value === 60) return "Quite Humorous";
    if (value === 80) return "Very Humorous";
    if (value === 100) return "Maximum Humor";
    return "";
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => setIsOpen(true)}
        className="h-10 w-10 rounded-full hover:bg-gray-900/5 dark:hover:bg-white/5"
      >
        {children || <Settings className="h-5 w-5 text-gray-700 dark:text-gray-300" />}
      </Button>
      
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white dark:bg-gray-950 border-0 shadow-2xl rounded-xl">
        <div className="overflow-hidden">
          <DialogHeader className="pt-8 px-6 pb-4 bg-gradient-to-r from-gray-50 to-white dark:from-gray-900 dark:to-gray-950 border-b">
            <DialogTitle className="text-2xl font-light tracking-tight">Agent Settings</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-gray-400">
              Configure your AI agent's voice, language, and personality.
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Voice</Label>
              <Select value={selectedVoice} onValueChange={handleVoiceChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {voices.map((voice) => (
                      <div
                        key={voice.id}
                        className="flex items-center justify-between px-2 py-1.5 relative"
                        role="option"
                      >
                        <SelectItem value={voice.id} className="flex-1 p-0">
                          <div className="flex flex-col">
                            <span className="font-medium">{voice.name}</span>
                            <span className="text-sm text-muted-foreground">{voice.description}</span>
                          </div>
                        </SelectItem>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 p-0 hover:bg-accent hover:text-accent-foreground"
                          onClick={(e) => playVoiceSample(e, voice.id)}
                          disabled={isPlayingVoice}
                        >
                          <Volume2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Language</Label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {languages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <span className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Humor Level</Label>
              <div className="pt-2">
                <Slider
                  value={[humorLevel]}
                  onValueChange={(values) => setHumorLevel(values[0])}
                  max={100}
                  step={20}
                  className="mb-4"
                />
                <div className="text-sm text-center text-muted-foreground">
                  {getHumorLabel(humorLevel)}
                </div>
              </div>
            </div>

            <Button 
              className="w-full bg-black hover:bg-gray-900 text-white dark:bg-white dark:text-black dark:hover:bg-gray-200 transition-all" 
              onClick={handleSave}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
