
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Agent, BackgroundSound, FirstMessageMode } from '@/types/agent-types';
import { AlertCircle, VolumeX, Volume2 } from 'lucide-react';

export interface AgentSettingsProps {
  agent: Agent;
  onUpdateSettings: (settings: {
    voiceId?: string;
    language?: string;
    humorLevel?: number;
    maxDurationSeconds?: number;
    first_message?: string;
    first_message_mode?: FirstMessageMode;
    end_call_message?: string;
    background_sound?: BackgroundSound;
    background_denoising_enabled?: boolean;
  }) => Promise<void>;
}

export function AgentSettings({ agent, onUpdateSettings }: AgentSettingsProps) {
  // Basic settings
  const [language, setLanguage] = useState(agent.language || 'en');
  const [voiceId, setVoiceId] = useState(agent.voice_id || '');
  
  // Call behavior
  const [maxDurationSeconds, setMaxDurationSeconds] = useState(agent.maxDurationSeconds || 300);
  const [firstMessage, setFirstMessage] = useState(agent.first_message || '');
  const [firstMessageMode, setFirstMessageMode] = useState<FirstMessageMode>(
    agent.first_message_mode || 'assistant-speaks-first'
  );
  const [endCallMessage, setEndCallMessage] = useState(agent.end_call_message || '');
  
  // Audio settings
  const [backgroundSound, setBackgroundSound] = useState<BackgroundSound>(
    agent.background_sound || 'off'
  );
  const [denoising, setDenoising] = useState(agent.background_denoising_enabled || false);
  
  // Handle saving settings
  const handleSave = async () => {
    try {
      await onUpdateSettings({
        language,
        voiceId,
        maxDurationSeconds,
        first_message: firstMessage,
        first_message_mode: firstMessageMode,
        end_call_message: endCallMessage,
        background_sound: backgroundSound,
        background_denoising_enabled: denoising
      });
    } catch (error) {
      console.error('Failed to update agent settings:', error);
    }
  };

  return (
    <div className="p-1 max-w-4xl mx-auto">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="voice">Voice & Audio</TabsTrigger>
          <TabsTrigger value="behavior">Call Behavior</TabsTrigger>
        </TabsList>
        
        {/* General Settings */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Settings</CardTitle>
              <CardDescription>
                Configure fundamental settings for your agent
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select 
                    value={language} 
                    onValueChange={(value) => setLanguage(value)}
                  >
                    <SelectTrigger id="language">
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="it">Italian</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Voice & Audio Settings */}
        <TabsContent value="voice" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Voice Settings</CardTitle>
              <CardDescription>
                Customize how your agent sounds during calls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="voice">Voice ID</Label>
                <Select 
                  value={voiceId} 
                  onValueChange={(value) => setVoiceId(value)}
                >
                  <SelectTrigger id="voice">
                    <SelectValue placeholder="Select voice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Default</SelectItem>
                    <SelectItem value="adam">Adam (Male)</SelectItem>
                    <SelectItem value="bella">Bella (Female)</SelectItem>
                    <SelectItem value="charlie">Charlie (Male)</SelectItem>
                    <SelectItem value="daisy">Daisy (Female)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 pt-4">
                <Label>Background Sound</Label>
                <Select
                  value={backgroundSound}
                  onValueChange={(value: string) => setBackgroundSound(value as BackgroundSound)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose background sound" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="off">
                      <div className="flex items-center gap-2">
                        <VolumeX className="h-4 w-4" />
                        <span>Off (No background)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="office">
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4" />
                        <span>Office Ambience</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="cafe">
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4" />
                        <span>Café Ambience</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="nature">
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4" />
                        <span>Nature Sounds</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2 pt-4">
                <Switch
                  id="denoising"
                  checked={denoising} 
                  onCheckedChange={(checked: boolean) => setDenoising(checked)}
                />
                <Label htmlFor="denoising">Background Noise Reduction</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Call Behavior Settings */}
        <TabsContent value="behavior" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Call Flow Settings</CardTitle>
              <CardDescription>
                Configure how your agent handles the beginning and end of calls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="maxDuration">Max Call Duration (seconds)</Label>
                <Input
                  id="maxDuration"
                  type="number"
                  value={maxDurationSeconds}
                  onChange={(e) => setMaxDurationSeconds(Number(e.target.value))}
                  min={60}
                  max={3600}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum length of call in seconds (60-3600)
                </p>
              </div>
              
              <div className="space-y-2 pt-2">
                <Label htmlFor="firstMessage">Initial Greeting</Label>
                <Textarea
                  id="firstMessage"
                  value={firstMessage}
                  onChange={(e) => setFirstMessage(e.target.value)}
                  placeholder="Hello, thanks for calling..."
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="space-y-2 pt-2">
                <Label htmlFor="firstMessageMode">Conversation Starter</Label>
                <Select
                  value={firstMessageMode}
                  onValueChange={(value: string) => setFirstMessageMode(value as FirstMessageMode)}
                >
                  <SelectTrigger id="firstMessageMode">
                    <SelectValue placeholder="Who speaks first" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="assistant-speaks-first">Agent speaks first</SelectItem>
                    <SelectItem value="user-speaks-first">Wait for caller to speak</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 pt-2">
                <Label htmlFor="endCallMessage">End Call Message</Label>
                <Textarea
                  id="endCallMessage"
                  value={endCallMessage}
                  onChange={(e) => setEndCallMessage(e.target.value)}
                  placeholder="Thank you for calling, goodbye..."
                  className="min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end mt-6">
        <Button onClick={handleSave} className="px-6">
          Save Settings
        </Button>
      </div>
    </div>
  );
}
