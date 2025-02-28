
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ArrowLeft, Settings } from 'lucide-react';
import { Agent } from '@/types/agent';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

// Voices data for the dropdown select
const voices = [
  { id: 'alloy', name: 'Alloy - Balanced' },
  { id: 'echo', name: 'Echo - Baritone' },
  { id: 'fable', name: 'Fable - British' },
  { id: 'onyx', name: 'Onyx - Deep' },
  { id: 'nova', name: 'Nova - Warm' },
  { id: 'shimmer', name: 'Shimmer - Clear' },
];

// Languages data for the dropdown select
const languages = [
  { id: 'en-US', name: 'English (US)' },
  { id: 'en-GB', name: 'English (UK)' },
  { id: 'es-ES', name: 'Spanish' },
  { id: 'fr-FR', name: 'French' },
  { id: 'de-DE', name: 'German' },
  { id: 'it-IT', name: 'Italian' },
  { id: 'pt-BR', name: 'Portuguese (Brazil)' },
  { id: 'nl-NL', name: 'Dutch' },
];

interface HeaderProps {
  agent: Agent;
  onBack: () => void;
  onUpdateSettings: (settings: { voiceId?: string; language?: string; knowledgeBaseId?: string }) => Promise<void>;
}

export function Header({ agent, onBack, onUpdateSettings }: HeaderProps) {
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(agent.voice_id || '');
  const [selectedLanguage, setSelectedLanguage] = useState(agent.language || 'en-US');
  const [selectedKnowledgeBase, setSelectedKnowledgeBase] = useState(agent.knowledge_base_id || '');
  const [knowledgeBases, setKnowledgeBases] = useState([
    { id: '', name: 'None' },
    { id: 'kb-1', name: 'Customer Support FAQ' },
    { id: 'kb-2', name: 'Product Documentation' },
    { id: 'kb-3', name: 'Company Policies' },
  ]);

  const handleSaveSettings = async () => {
    setIsUpdating(true);
    try {
      await onUpdateSettings({
        voiceId: selectedVoice,
        language: selectedLanguage,
        knowledgeBaseId: selectedKnowledgeBase === '' ? null : selectedKnowledgeBase,
      });
      toast({
        title: 'Settings updated',
        description: 'Agent settings have been updated successfully.',
      });
    } catch (error) {
      console.error('Error updating settings:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to update settings',
        description: 'There was an error updating the agent settings.',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-background/60 backdrop-blur-lg border-b p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {agent.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-lg font-semibold">{agent.name}</h1>
            <p className="text-sm text-muted-foreground">Flow Editor</p>
          </div>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Agent Settings</SheetTitle>
              <SheetDescription>
                Configure voice, language, and knowledge base for your agent.
              </SheetDescription>
            </SheetHeader>
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="voice">Voice</Label>
                  <Select
                    value={selectedVoice}
                    onValueChange={setSelectedVoice}
                  >
                    <SelectTrigger id="voice">
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
                  <p className="text-xs text-muted-foreground">
                    Choose a voice for your agent to use during conversations.
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={selectedLanguage}
                    onValueChange={setSelectedLanguage}
                  >
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((language) => (
                        <SelectItem key={language.id} value={language.id}>
                          {language.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Choose the language for your agent to use.
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="knowledge">Knowledge Base</Label>
                  <Select
                    value={selectedKnowledgeBase}
                    onValueChange={setSelectedKnowledgeBase}
                  >
                    <SelectTrigger id="knowledge">
                      <SelectValue placeholder="Select a knowledge base" />
                    </SelectTrigger>
                    <SelectContent>
                      {knowledgeBases.map((kb) => (
                        <SelectItem key={kb.id} value={kb.id}>
                          {kb.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Connect a knowledge base to your agent for more informed responses.
                  </p>
                </div>
              </div>
            </div>
            <SheetFooter>
              <SheetClose asChild>
                <Button variant="outline">Cancel</Button>
              </SheetClose>
              <Button 
                onClick={handleSaveSettings}
                disabled={isUpdating}
              >
                {isUpdating ? 'Saving...' : 'Save changes'}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
