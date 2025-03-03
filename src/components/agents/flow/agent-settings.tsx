
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Agent, TrainingExample } from '@/types/agent';
import { voicesData } from '@/components/agents/utils/voices-data';
import { languagesData } from '@/components/agents/utils/languages-data';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';

export interface AgentSettingsProps {
  agent: Agent;
  onUpdate: (settings: {
    voice_id?: string;
    language?: string;
    humor_level?: number;
    maxDurationSeconds?: number;
    knowledge_ids?: string[];
  }) => Promise<void>;
}

export function AgentSettings({ agent, onUpdate }: AgentSettingsProps) {
  const [tab, setTab] = useState('general');
  const [voiceId, setVoiceId] = useState(agent.voice_id || '');
  const [language, setLanguage] = useState(agent.language || 'en');
  const [humorLevel, setHumorLevel] = useState(
    typeof agent.humor_level === 'number'
      ? agent.humor_level
      : typeof agent.humorLevel === 'number'
      ? agent.humorLevel
      : 0
  );
  const [knowledgeIds, setKnowledgeIds] = useState<string[]>(agent.knowledge_ids || []);
  const [trainingExamples, setTrainingExamples] = useState<TrainingExample[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // For editing training examples
  const [editingExample, setEditingExample] = useState<TrainingExample | null>(null);
  const [userMessage, setUserMessage] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [correctedResponse, setCorrectedResponse] = useState('');
  
  const { toast } = useToast();

  useEffect(() => {
    fetchTrainingExamples();
  }, [agent.id]);

  const fetchTrainingExamples = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('agent_training_examples')
        .select('*')
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching training examples:', error);
        toast({
          title: 'Failed to load training examples',
          description: error.message,
          variant: 'destructive',
        });
        return;
      }

      setTrainingExamples(data || []);
    } catch (err) {
      console.error('Error in fetchTrainingExamples:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceChange = (value: string) => {
    setVoiceId(value);
    onUpdate({ voice_id: value });
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    onUpdate({ language: value });
  };

  const handleHumorLevelChange = (value: number[]) => {
    const level = value[0];
    setHumorLevel(level);
    onUpdate({ humor_level: level });
  };

  const handleSaveTrainingExample = async () => {
    try {
      if (!userMessage || !aiResponse || !correctedResponse) {
        toast({
          title: 'Incomplete fields',
          description: 'Please fill in all fields for the training example',
          variant: 'destructive',
        });
        return;
      }

      setIsLoading(true);

      // Get the current user's ID from Supabase auth
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      if (editingExample) {
        // Update existing example
        const { error } = await supabase
          .from('agent_training_examples')
          .update({
            user_message: userMessage,
            ai_response: aiResponse,
            corrected_response: correctedResponse,
          })
          .eq('id', editingExample.id);

        if (error) throw error;

        toast({
          title: 'Example updated',
          description: 'Training example has been updated successfully',
        });
      } else {
        // Create new example
        const { error } = await supabase
          .from('agent_training_examples')
          .insert({
            agent_id: agent.id,
            user_id: user.id,
            user_message: userMessage,
            ai_response: aiResponse,
            corrected_response: correctedResponse,
          });

        if (error) throw error;

        toast({
          title: 'Example added',
          description: 'New training example has been added successfully',
        });
      }

      // Reset form and refresh examples
      setUserMessage('');
      setAiResponse('');
      setCorrectedResponse('');
      setEditingExample(null);
      await fetchTrainingExamples();
    } catch (error: any) {
      console.error('Error saving training example:', error);
      toast({
        title: 'Error saving example',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTrainingExample = async (id: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase
        .from('agent_training_examples')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTrainingExamples(trainingExamples.filter(example => example.id !== id));
      
      toast({
        title: 'Example deleted',
        description: 'Training example has been deleted successfully',
      });
      
      // If we were editing this example, reset the form
      if (editingExample && editingExample.id === id) {
        setEditingExample(null);
        setUserMessage('');
        setAiResponse('');
        setCorrectedResponse('');
      }
    } catch (error: any) {
      console.error('Error deleting training example:', error);
      toast({
        title: 'Error deleting example',
        description: error.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTrainingExample = (example: TrainingExample) => {
    setEditingExample(example);
    setUserMessage(example.user_message);
    setAiResponse(example.ai_response);
    setCorrectedResponse(example.corrected_response);
  };

  const filteredExamples = trainingExamples.filter(example => {
    if (!searchQuery) return true;
    const lowerCaseQuery = searchQuery.toLowerCase();
    return (
      example.user_message.toLowerCase().includes(lowerCaseQuery) ||
      example.ai_response.toLowerCase().includes(lowerCaseQuery) ||
      example.corrected_response.toLowerCase().includes(lowerCaseQuery)
    );
  });

  return (
    <div className="space-y-6 px-1 py-2">
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="general">General Settings</TabsTrigger>
          <TabsTrigger value="training">Training Examples</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-6 py-4">
          <div className="space-y-4">
            <div>
              <Label htmlFor="voice">Voice</Label>
              <Select value={voiceId} onValueChange={handleVoiceChange}>
                <SelectTrigger id="voice">
                  <SelectValue placeholder="Select a voice" />
                </SelectTrigger>
                <SelectContent>
                  {voicesData.map((voice) => (
                    <SelectItem key={voice.id} value={voice.id}>
                      {voice.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="language">Language</Label>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger id="language">
                  <SelectValue placeholder="Select a language" />
                </SelectTrigger>
                <SelectContent>
                  {languagesData.map((lang) => (
                    <SelectItem key={lang.code} value={lang.code}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label htmlFor="humor-level">Humor Level</Label>
                <span className="text-sm text-muted-foreground">{humorLevel}</span>
              </div>
              <Slider
                id="humor-level"
                defaultValue={[humorLevel]}
                max={10}
                step={1}
                onValueChange={handleHumorLevelChange}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="training" className="space-y-6 py-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search examples..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  setEditingExample(null);
                  setUserMessage('');
                  setAiResponse('');
                  setCorrectedResponse('');
                }}
                disabled={!editingExample}
              >
                <Plus className="h-4 w-4 mr-2" /> New Example
              </Button>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="user-message">User Message</Label>
                      <Textarea
                        id="user-message"
                        placeholder="What the user says..."
                        value={userMessage}
                        onChange={(e) => setUserMessage(e.target.value)}
                        className="min-h-[60px]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="ai-response">Original AI Response</Label>
                      <Textarea
                        id="ai-response"
                        placeholder="How the AI originally responded..."
                        value={aiResponse}
                        onChange={(e) => setAiResponse(e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="corrected-response">Corrected Response</Label>
                      <Textarea
                        id="corrected-response"
                        placeholder="How the AI should have responded..."
                        value={correctedResponse}
                        onChange={(e) => setCorrectedResponse(e.target.value)}
                        className="min-h-[80px]"
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleSaveTrainingExample}
                        disabled={isLoading || !userMessage || !aiResponse || !correctedResponse}
                      >
                        {editingExample ? 'Update Example' : 'Add Example'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Separator className="my-4" />
              
              {isLoading && filteredExamples.length === 0 ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading examples...</p>
                </div>
              ) : filteredExamples.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No training examples found.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredExamples.map((example) => (
                    <Card key={example.id} className="relative overflow-hidden">
                      <CardContent className="pt-6">
                        <div className="absolute top-2 right-2 flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditTrainingExample(example)}
                            className="h-8 w-8"
                          >
                            <svg 
                              xmlns="http://www.w3.org/2000/svg" 
                              width="15" 
                              height="15" 
                              viewBox="0 0 24 24" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="2" 
                              strokeLinecap="round" 
                              strokeLinejoin="round"
                            >
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                              <path d="m15 5 4 4"/>
                            </svg>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteTrainingExample(example.id || '')}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <Badge variant="outline" className="font-normal mb-1">User</Badge>
                            <p className="text-sm">{example.user_message}</p>
                          </div>
                          <div>
                            <Badge variant="outline" className="font-normal mb-1">Original AI</Badge>
                            <p className="text-sm">{example.ai_response}</p>
                          </div>
                          <div>
                            <Badge variant="outline" className="font-normal mb-1">Corrected</Badge>
                            <p className="text-sm">{example.corrected_response}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
