
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Agent } from "@/types/agent";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Info, Mic, Brain, Clock, MessageSquare, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AgentSettingsProps {
  agent: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateSettings: (settings: Partial<Agent>) => Promise<void>;
}

export function AgentSettings({ agent, open, onOpenChange, onUpdateSettings }: AgentSettingsProps) {
  const typedAgent = agent as Agent;
  const [name, setName] = useState(typedAgent.name);
  const [voiceId, setVoiceId] = useState(typedAgent.voice_id || '');
  const [language, setLanguage] = useState(typedAgent.language || 'en');
  const [maxDuration, setMaxDuration] = useState(typedAgent.maxDurationSeconds || typedAgent.call_timing?.maxDurationSeconds || 300);
  const [firstMessage, setFirstMessage] = useState(typedAgent.first_message || "Hello! How can I help you today?");
  const [firstMessageMode, setFirstMessageMode] = useState(typedAgent.first_message_mode || "assistant-speaks-first");
  const [endCallMessage, setEndCallMessage] = useState(typedAgent.end_call_message || "Thank you for calling. Have a great day!");
  const [silenceTimeoutMessage, setSilenceTimeoutMessage] = useState(
    typedAgent.silence_timeout_message || "I noticed you've been quiet for a while. Is there anything else I can help you with?"
  );
  
  // Voice config
  const [voiceProvider, setVoiceProvider] = useState(typedAgent.voice_config?.provider || "elevenlabs");
  const [voiceSpeed, setVoiceSpeed] = useState(typedAgent.voice_config?.speed || 1);
  
  // Model config
  const [modelProvider, setModelProvider] = useState(typedAgent.model_config?.provider || "openai");
  const [model, setModel] = useState(typedAgent.model_config?.model || "gpt-4");
  const [temperature, setTemperature] = useState(typedAgent.model_config?.temperature || 0.7);
  const [emotionRecognition, setEmotionRecognition] = useState(typedAgent.model_config?.emotionRecognitionEnabled || false);
  
  // Transcriber config
  const [transcriberProvider, setTranscriberProvider] = useState(typedAgent.transcriber_config?.provider || "assembly-ai");
  const [disablePartialTranscripts, setDisablePartialTranscripts] = useState(typedAgent.transcriber_config?.disablePartialTranscripts || false);
  const [endUtteranceSilenceThreshold, setEndUtteranceSilenceThreshold] = useState(
    typedAgent.transcriber_config?.endUtteranceSilenceThreshold || 0.8
  );
  
  // Speaking behavior
  const [startSpeakingDelay, setStartSpeakingDelay] = useState(typedAgent.speaking_behavior?.startSpeakingDelay || 0);
  const [smartEndpointing, setSmartEndpointing] = useState(typedAgent.speaking_behavior?.smartEndpointingEnabled || true);
  const [acknowledgementPhrases, setAcknowledgementPhrases] = useState(
    typedAgent.speaking_behavior?.acknowledgementPhrases?.join(", ") || "I see, I understand, Got it"
  );
  const [interruptionPhrases, setInterruptionPhrases] = useState(
    typedAgent.speaking_behavior?.interruptionPhrases?.join(", ") || "Stop, Wait, Hold on"
  );
  
  // Environment
  const [backgroundSound, setBackgroundSound] = useState(typedAgent.background_sound || "off");
  const [backgroundDenoising, setBackgroundDenoising] = useState(typedAgent.background_denoising_enabled || false);
  
  const handleSave = async () => {
    const acknowledgePhrasesArray = acknowledgementPhrases
      .split(",")
      .map(phrase => phrase.trim())
      .filter(phrase => phrase.length > 0);
      
    const interruptionPhrasesArray = interruptionPhrases
      .split(",")
      .map(phrase => phrase.trim())
      .filter(phrase => phrase.length > 0);
    
    const updatedSettings: Partial<Agent> = {
      name,
      voice_id: voiceId,
      language,
      maxDurationSeconds: maxDuration,
      first_message: firstMessage,
      first_message_mode: firstMessageMode as 'assistant-speaks-first' | 'user-speaks-first',
      end_call_message: endCallMessage,
      silence_timeout_message: silenceTimeoutMessage,
      voice_config: {
        provider: voiceProvider,
        voiceId: voiceId,
        speed: voiceSpeed,
      },
      model_config: {
        provider: modelProvider,
        model: model,
        temperature: temperature,
        emotionRecognitionEnabled: emotionRecognition,
      },
      transcriber_config: {
        provider: transcriberProvider,
        disablePartialTranscripts: disablePartialTranscripts,
        endUtteranceSilenceThreshold: endUtteranceSilenceThreshold,
      },
      speaking_behavior: {
        startSpeakingDelay: startSpeakingDelay,
        smartEndpointingEnabled: smartEndpointing,
        acknowledgementPhrases: acknowledgePhrasesArray,
        interruptionPhrases: interruptionPhrasesArray,
      },
      background_sound: backgroundSound as 'off' | 'office' | 'cafe' | 'nature',
      background_denoising_enabled: backgroundDenoising,
    };
    
    await onUpdateSettings(updatedSettings);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl">Agent Settings</DialogTitle>
          <DialogDescription>
            Configure how your AI agent behaves and responds during conversations
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="basics" className="w-full h-full">
          <div className="px-6 border-b">
            <TabsList className="h-12">
              <TabsTrigger value="basics" className="flex items-center gap-2 h-10">
                <Info className="h-4 w-4" />
                <span>Basics</span>
              </TabsTrigger>
              <TabsTrigger value="voice" className="flex items-center gap-2 h-10">
                <Mic className="h-4 w-4" />
                <span>Voice</span>
              </TabsTrigger>
              <TabsTrigger value="brain" className="flex items-center gap-2 h-10">
                <Brain className="h-4 w-4" />
                <span>Intelligence</span>
              </TabsTrigger>
              <TabsTrigger value="conversation" className="flex items-center gap-2 h-10">
                <MessageSquare className="h-4 w-4" />
                <span>Messages</span>
              </TabsTrigger>
              <TabsTrigger value="advanced" className="flex items-center gap-2 h-10">
                <Settings className="h-4 w-4" />
                <span>Advanced</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          <ScrollArea className="h-[60vh]">
            <TabsContent value="basics" className="p-6 pt-4">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Agent Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="max-w-md" />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <Select value={language} onValueChange={setLanguage}>
                      <SelectTrigger className="w-full">
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="duration">Max Call Duration (seconds)</Label>
                    <Input 
                      id="duration" 
                      type="number" 
                      value={maxDuration} 
                      onChange={(e) => setMaxDuration(Number(e.target.value))} 
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="voice" className="p-6 pt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Voice Settings</CardTitle>
                    <CardDescription>Configure how your agent sounds</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="voiceProvider">Voice Provider</Label>
                      <Select value={voiceProvider} onValueChange={setVoiceProvider}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="elevenlabs">ElevenLabs</SelectItem>
                          <SelectItem value="azure">Azure</SelectItem>
                          <SelectItem value="polly">Amazon Polly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="voiceId">Voice ID</Label>
                      <Select value={voiceId} onValueChange={setVoiceId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select voice" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daniel">Daniel</SelectItem>
                          <SelectItem value="emily">Emily</SelectItem>
                          <SelectItem value="michael">Michael</SelectItem>
                          <SelectItem value="rachel">Rachel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="speed">Voice Speed: {voiceSpeed}x</Label>
                      </div>
                      <Input 
                        id="speed" 
                        type="range" 
                        min="0.5" 
                        max="2" 
                        step="0.1" 
                        value={voiceSpeed} 
                        onChange={(e) => setVoiceSpeed(Number(e.target.value))} 
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Background & Environment</CardTitle>
                    <CardDescription>Control ambient sounds</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="backgroundSound">Background Sound</Label>
                      <Select value={backgroundSound} onValueChange={setBackgroundSound}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select background" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="off">Off</SelectItem>
                          <SelectItem value="office">Office</SelectItem>
                          <SelectItem value="cafe">Cafe</SelectItem>
                          <SelectItem value="nature">Nature</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center justify-between space-x-2 pt-2">
                      <Label htmlFor="backgroundDenoising">Background Noise Reduction</Label>
                      <Switch 
                        id="backgroundDenoising" 
                        checked={backgroundDenoising} 
                        onCheckedChange={setBackgroundDenoising} 
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="brain" className="p-6 pt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">AI Model</CardTitle>
                    <CardDescription>Configure the intelligence of your agent</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="modelProvider">Model Provider</Label>
                      <Select value={modelProvider} onValueChange={setModelProvider}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI</SelectItem>
                          <SelectItem value="anthropic">Anthropic</SelectItem>
                          <SelectItem value="mistral">Mistral AI</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="model">Model</Label>
                      <Select value={model} onValueChange={setModel}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gpt-4">GPT-4</SelectItem>
                          <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                          <SelectItem value="claude-3">Claude 3</SelectItem>
                          <SelectItem value="mistral-large">Mistral Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <Label htmlFor="temperature">Temperature: {temperature}</Label>
                      </div>
                      <Input 
                        id="temperature" 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.1" 
                        value={temperature} 
                        onChange={(e) => setTemperature(Number(e.target.value))} 
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>More focused</span>
                        <span>More creative</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between space-x-2 pt-2">
                      <Label htmlFor="emotionRecognition">Emotion Recognition</Label>
                      <Switch 
                        id="emotionRecognition" 
                        checked={emotionRecognition} 
                        onCheckedChange={setEmotionRecognition} 
                      />
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Transcription</CardTitle>
                    <CardDescription>Speech recognition settings</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="transcriberProvider">Speech Recognition Provider</Label>
                      <Select value={transcriberProvider} onValueChange={setTranscriberProvider}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select provider" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="assembly-ai">AssemblyAI</SelectItem>
                          <SelectItem value="azure">Azure</SelectItem>
                          <SelectItem value="deepgram">Deepgram</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="endUtteranceSilenceThreshold">
                        Silence Detection Threshold (seconds)
                      </Label>
                      <Input 
                        id="endUtteranceSilenceThreshold" 
                        type="number" 
                        min="0.1" 
                        max="2" 
                        step="0.1" 
                        value={endUtteranceSilenceThreshold} 
                        onChange={(e) => setEndUtteranceSilenceThreshold(Number(e.target.value))} 
                      />
                    </div>
                    
                    <div className="flex items-center justify-between space-x-2 pt-2">
                      <Label htmlFor="disablePartialTranscripts">Disable Partial Transcripts</Label>
                      <Switch 
                        id="disablePartialTranscripts" 
                        checked={disablePartialTranscripts} 
                        onCheckedChange={setDisablePartialTranscripts} 
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="conversation" className="p-6 pt-4">
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstMessageMode">Conversation Start Mode</Label>
                    <Select value={firstMessageMode} onValueChange={setFirstMessageMode}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select who speaks first" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="assistant-speaks-first">Agent Speaks First</SelectItem>
                        <SelectItem value="user-speaks-first">User Speaks First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="firstMessage">First Message</Label>
                    <Textarea 
                      id="firstMessage" 
                      value={firstMessage} 
                      onChange={(e) => setFirstMessage(e.target.value)} 
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endCallMessage">End Call Message</Label>
                    <Textarea 
                      id="endCallMessage" 
                      value={endCallMessage} 
                      onChange={(e) => setEndCallMessage(e.target.value)} 
                      rows={3}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="silenceTimeoutMessage">Silence Timeout Message</Label>
                    <Textarea 
                      id="silenceTimeoutMessage" 
                      value={silenceTimeoutMessage} 
                      onChange={(e) => setSilenceTimeoutMessage(e.target.value)} 
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="advanced" className="p-6 pt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Speaking Behavior</CardTitle>
                    <CardDescription>Fine-tune how your agent speaks</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="startSpeakingDelay">
                        Start Speaking Delay (seconds)
                      </Label>
                      <Input 
                        id="startSpeakingDelay" 
                        type="number" 
                        min="0" 
                        max="2" 
                        step="0.1" 
                        value={startSpeakingDelay} 
                        onChange={(e) => setStartSpeakingDelay(Number(e.target.value))} 
                      />
                    </div>
                    
                    <div className="flex items-center justify-between space-x-2">
                      <Label htmlFor="smartEndpointing">Smart Endpointing</Label>
                      <Switch 
                        id="smartEndpointing" 
                        checked={smartEndpointing} 
                        onCheckedChange={setSmartEndpointing} 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="acknowledgementPhrases">Acknowledgement Phrases</Label>
                      <Textarea 
                        id="acknowledgementPhrases" 
                        value={acknowledgementPhrases} 
                        onChange={(e) => setAcknowledgementPhrases(e.target.value)} 
                        placeholder="Comma separated phrases"
                        rows={2}
                      />
                      <p className="text-xs text-muted-foreground">
                        Phrases that the agent will use to acknowledge the user before continuing
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="interruptionPhrases">Interruption Phrases</Label>
                      <Textarea 
                        id="interruptionPhrases" 
                        value={interruptionPhrases} 
                        onChange={(e) => setInterruptionPhrases(e.target.value)} 
                        placeholder="Comma separated phrases"
                        rows={2}
                      />
                      <p className="text-xs text-muted-foreground">
                        Phrases that will cause the agent to stop speaking when detected
                      </p>
                    </div>
                  </CardContent>
                </Card>
                
                <div className="space-y-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Call Handling</CardTitle>
                      <CardDescription>Control how calls are managed</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label htmlFor="endCallPhrases">End Call Phrases</Label>
                        <Textarea 
                          id="endCallPhrases" 
                          value={typedAgent.end_call_phrases?.join(", ") || "goodbye, end call, hang up"} 
                          placeholder="Comma separated phrases"
                          rows={2}
                          readOnly
                        />
                        <p className="text-xs text-muted-foreground">
                          When these phrases are detected, the call will automatically end
                        </p>
                        <div className="pt-2">
                          <Badge variant="outline" className="mr-1 bg-muted/50">
                            Coming soon
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">System Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className="text-muted-foreground">Agent ID</div>
                          <div className="font-mono">{typedAgent.id.substring(0, 10)}...</div>
                          
                          <div className="text-muted-foreground">Created</div>
                          <div>
                            {typedAgent.created_at ? new Date(typedAgent.created_at).toLocaleDateString() : "N/A"}
                          </div>
                          
                          <div className="text-muted-foreground">Updated</div>
                          <div>
                            {typedAgent.updated_at ? new Date(typedAgent.updated_at).toLocaleDateString() : "N/A"}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
        
        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
