
import React, { useState, useEffect } from "react";
import { Edit, Trash2, Plus, X, Check } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Agent, TrainingExample } from "@/types/agent-types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TrainingExamplesManagerProps {
  agent: Agent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TrainingExamplesManager({
  agent,
  open,
  onOpenChange
}: TrainingExamplesManagerProps) {
  const [trainingExamples, setTrainingExamples] = useState<TrainingExample[]>([]);
  const [isLoadingExamples, setIsLoadingExamples] = useState(false);
  const [editingExampleId, setEditingExampleId] = useState<string | null>(null);
  const [newExampleUserMessage, setNewExampleUserMessage] = useState("");
  const [newExampleAiResponse, setNewExampleAiResponse] = useState("");
  const [newExampleCorrection, setNewExampleCorrection] = useState("");
  const [isAddingExample, setIsAddingExample] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && agent?.id) {
      fetchTrainingExamples();
    }
  }, [open, agent?.id]);

  const fetchTrainingExamples = async () => {
    if (!agent?.id) return;
    
    setIsLoadingExamples(true);
    try {
      const { data, error } = await supabase
        .from('agent_training_examples')
        .select('*')
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[TrainingExamplesManager] Error fetching training examples:', error);
        throw error;
      }
      
      setTrainingExamples(data || []);
    } catch (error) {
      console.error('[TrainingExamplesManager] Failed to fetch training examples:', error);
      toast({
        title: "Error",
        description: "Failed to load training examples",
        variant: "destructive",
      });
    } finally {
      setIsLoadingExamples(false);
    }
  };

  const saveTrainingExample = async (
    agentId: string, 
    userMessage: string, 
    aiResponse: string, 
    correctedResponse: string
  ) => {
    try {
      const { data, error } = await supabase
        .from('agent_training_examples')
        .insert({
          agent_id: agentId,
          user_message: userMessage,
          ai_response: aiResponse,
          corrected_response: correctedResponse,
          user_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select();

      if (error) {
        console.error('[TrainingExamplesManager] Error saving training example:', error);
        toast({
          title: "Error",
          description: "Failed to save training example",
          variant: "destructive",
        });
        return null;
      } else {
        console.log('[TrainingExamplesManager] Training example saved successfully:', data);
        toast({
          title: "Success",
          description: "Training example saved",
        });
        
        fetchTrainingExamples();
        return data[0];
      }
    } catch (error) {
      console.error('[TrainingExamplesManager] Error saving training example:', error);
      return null;
    }
  };

  const handleDeleteExample = async (exampleId: string) => {
    try {
      const { error } = await supabase
        .from('agent_training_examples')
        .delete()
        .eq('id', exampleId);
      
      if (error) {
        console.error('[TrainingExamplesManager] Error deleting training example:', error);
        toast({
          title: "Error",
          description: "Failed to delete training example",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Training example deleted",
        });
        
        fetchTrainingExamples();
      }
    } catch (error) {
      console.error('[TrainingExamplesManager] Error deleting training example:', error);
    }
  };

  const handleSaveExampleEdit = async (exampleId: string) => {
    const example = trainingExamples.find(ex => ex.id === exampleId);
    if (!example) return;
    
    try {
      const { error } = await supabase
        .from('agent_training_examples')
        .update({
          user_message: example.user_message,
          ai_response: example.ai_response,
          corrected_response: example.corrected_response
        })
        .eq('id', exampleId);
      
      if (error) {
        console.error('[TrainingExamplesManager] Error updating training example:', error);
        toast({
          title: "Error",
          description: "Failed to update training example",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Training example updated",
        });
        setEditingExampleId(null);
      }
    } catch (error) {
      console.error('[TrainingExamplesManager] Error updating training example:', error);
    }
  };

  const handleAddNewExample = async () => {
    if (!newExampleUserMessage || !newExampleAiResponse || !newExampleCorrection) {
      toast({
        title: "Error",
        description: "All fields are required to add a training example",
        variant: "destructive",
      });
      return;
    }
    
    const result = await saveTrainingExample(
      agent.id,
      newExampleUserMessage,
      newExampleAiResponse,
      newExampleCorrection
    );
    
    if (result) {
      setNewExampleUserMessage("");
      setNewExampleAiResponse("");
      setNewExampleCorrection("");
      setIsAddingExample(false);
    }
  };

  const handleCancelAddExample = () => {
    setIsAddingExample(false);
    setNewExampleUserMessage("");
    setNewExampleAiResponse("");
    setNewExampleCorrection("");
  };

  const updateExampleField = (exampleId: string, field: keyof TrainingExample, value: string) => {
    setTrainingExamples(examples => 
      examples.map(ex => 
        ex.id === exampleId ? { ...ex, [field]: value } : ex
      )
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] p-0 flex flex-col h-[750px] max-h-[85vh] overflow-hidden bg-background">
        <DialogHeader className="p-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-left">Training Examples</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-gray-900/90">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Saved Training Examples</h3>
            {!isAddingExample && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsAddingExample(true)}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                Add Example
              </Button>
            )}
          </div>
          
          {isLoadingExamples ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {isAddingExample && (
                <div className="bg-white dark:bg-gray-800 rounded-lg border p-4 mb-4 space-y-3">
                  <h4 className="font-medium text-sm mb-2">New Training Example</h4>
                  
                  <div>
                    <Label htmlFor="user-message" className="text-xs mb-1 block">User Message</Label>
                    <Textarea
                      id="user-message"
                      placeholder="What the user says..."
                      value={newExampleUserMessage}
                      onChange={e => setNewExampleUserMessage(e.target.value)}
                      className="min-h-[80px] text-sm"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="ai-response" className="text-xs mb-1 block">AI Response</Label>
                    <Textarea
                      id="ai-response"
                      placeholder="The AI's response that needs correction..."
                      value={newExampleAiResponse}
                      onChange={e => setNewExampleAiResponse(e.target.value)}
                      className="min-h-[80px] text-sm"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="correction" className="text-xs mb-1 block">Corrected Response</Label>
                    <Textarea
                      id="correction"
                      placeholder="How the AI should have responded..."
                      value={newExampleCorrection}
                      onChange={e => setNewExampleCorrection(e.target.value)}
                      className="min-h-[80px] text-sm"
                    />
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleCancelAddExample}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      onClick={handleAddNewExample}
                    >
                      Save Example
                    </Button>
                  </div>
                </div>
              )}
            
              {trainingExamples.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <p>No training examples yet. Add some or create them while chatting with the agent.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {trainingExamples.map((example) => (
                    <div 
                      key={example.id} 
                      className="bg-white dark:bg-gray-800 rounded-lg border p-4 space-y-3"
                    >
                      {editingExampleId === example.id ? (
                        <>
                          <div>
                            <Label htmlFor={`edit-user-${example.id}`} className="text-xs mb-1 block">User Message</Label>
                            <Textarea
                              id={`edit-user-${example.id}`}
                              value={example.user_message}
                              onChange={e => updateExampleField(example.id, 'user_message', e.target.value)}
                              className="min-h-[60px] text-sm"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`edit-ai-${example.id}`} className="text-xs mb-1 block">AI Response</Label>
                            <Textarea
                              id={`edit-ai-${example.id}`}
                              value={example.ai_response}
                              onChange={e => updateExampleField(example.id, 'ai_response', e.target.value)}
                              className="min-h-[60px] text-sm"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`edit-correction-${example.id}`} className="text-xs mb-1 block">Corrected Response</Label>
                            <Textarea
                              id={`edit-correction-${example.id}`}
                              value={example.corrected_response}
                              onChange={e => updateExampleField(example.id, 'corrected_response', e.target.value)}
                              className="min-h-[60px] text-sm"
                            />
                          </div>
                          
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setEditingExampleId(null)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              variant="default" 
                              size="sm" 
                              onClick={() => handleSaveExampleEdit(example.id)}
                            >
                              Save Changes
                            </Button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">User Message:</p>
                            <p className="text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded border">{example.user_message}</p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">AI Response:</p>
                            <p className="text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded border text-foreground">{example.ai_response}</p>
                          </div>
                          
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Corrected Response:</p>
                            <p className="text-sm bg-green-50 dark:bg-green-900/20 p-2 rounded border text-foreground">{example.corrected_response}</p>
                          </div>
                          
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleDeleteExample(example.id)}
                              className="h-8 w-8 text-red-500 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setEditingExampleId(example.id)}
                              className="h-8 w-8"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="p-4 border-t bg-white dark:bg-gray-950">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">Training examples help improve agent responses</p>
            <Button
              variant="default"
              size="sm"
              className="text-xs h-8 rounded-md"
              onClick={() => onOpenChange(false)}
            >
              <Check className="h-3 w-3 mr-1" />
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
