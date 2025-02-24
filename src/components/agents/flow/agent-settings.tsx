
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Settings } from "lucide-react";

type AgentSettingsProps = {
  agentId: string;
  currentVoice?: string;
  currentLanguage?: string;
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

export function AgentSettings({ agentId, currentVoice, currentLanguage, onUpdateSettings }: AgentSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(currentVoice || "");
  const [selectedLanguage, setSelectedLanguage] = useState(currentLanguage || "en");
  const [humorLevel, setHumorLevel] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");

  const voices = [
    { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel" },
    { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi" },
    { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella" },
    { id: "ThT5KcBeYPX3keUQqHPh", name: "Antoni" },
    { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh" },
  ];

  const filteredLanguages = languages.filter(lang => 
    lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lang.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Agent Settings</SheetTitle>
          <SheetDescription>
            Configure your AI agent's voice, language preferences, and personality.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <Label>Voice</Label>
            <Select value={selectedVoice} onValueChange={setSelectedVoice}>
              <SelectTrigger>
                <SelectValue placeholder="Select a voice" />
              </SelectTrigger>
              <SelectContent>
                {voices.map((voice) => (
                  <SelectItem key={voice.id} value={voice.id}>
                    {voice.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Language</Label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {filteredLanguages.map((lang) => (
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
            <Label>Humor Level</Label>
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

          <Button className="w-full" onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
