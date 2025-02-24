
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
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
import { Settings, Search } from "lucide-react";

type AgentSettingsProps = {
  agentId: string;
  currentVoice?: string;
  currentLanguage?: string;
  onUpdateSettings: (settings: { voiceId?: string; language?: string; humorLevel?: number }) => Promise<void>;
};

const languages = [
  { code: "ar", name: "Arabic", flag: "🇸🇦" },
  { code: "bn", name: "Bengali", flag: "🇧🇩" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "nl", name: "Dutch", flag: "🇳🇱" },
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "hi", name: "Hindi", flag: "🇮🇳" },
  { code: "id", name: "Indonesian", flag: "🇮🇩" },
  { code: "it", name: "Italian", flag: "🇮🇹" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "sw", name: "Swahili", flag: "🇹🇿" },
  { code: "tr", name: "Turkish", flag: "🇹🇷" },
  { code: "ur", name: "Urdu", flag: "🇵🇰" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳" }
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
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search languages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                {filteredLanguages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code}>
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </span>
                  </SelectItem>
                ))}
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
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Serious</span>
                <span>Playful</span>
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
