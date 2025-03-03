
import React, { useState, useEffect } from "react";
import { X, Pencil, Plus, Trash2, Search, BookOpen, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
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
  const [examples, setExamples] = useState<TrainingExample[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingExample, setEditingExample] = useState<TrainingExample | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newUserMessage, setNewUserMessage] = useState("");
  const [newAIResponse, setNewAIResponse] = useState("");
  const [newCorrectedResponse, setNewCorrectedResponse] = useState("");
  const { toast } = useToast();

  // Load training examples
  useEffect(() => {
    if (open && agent?.id) {
      fetchTrainingExamples();
    }
  }, [open, agent?.id]);

  const fetchTrainingExamples = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agent_training_examples')
        .select('*')
        .eq('agent_id', agent.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching training examples:", error);
        toast({
          title: "Error",
          description: "Failed to load training examples",
          variant: "destructive",
        });
      } else {
        console.log("Fetched training examples:", data);
        setExamples(data || []);
      }
    } catch (error) {
      console.error("Error in fetchTrainingExamples:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveExample = async () => {
    try {
      if (editingExample) {
        // Update existing example
        const { error } = await supabase
          .from('agent_training_examples')
          .update({
            user_message: editingExample.user_message,
            ai_response: editingExample.ai_response,
            corrected_response: editingExample.corrected_response,
          })
          .eq('id', editingExample.id);

        if (error) {
          throw error;
        }

        setExamples(prev => 
          prev.map(ex => 
            ex.id === editingExample.id ? editingExample : ex
          )
        );
        
        toast({
          title: "Success",
          description: "Training example updated",
        });
      } else if (isCreatingNew) {
        // Create new example
        if (!newUserMessage.trim() || !newCorrectedResponse.trim()) {
          toast({
            title: "Error",
            description: "User message and corrected response are required",
            variant: "destructive",
          });
          return;
        }

        const { data, error } = await supabase
          .from('agent_training_examples')
          .insert({
            agent_id: agent.id,
            user_message: newUserMessage,
            ai_response: newAIResponse,
            corrected_response: newCorrectedResponse,
            user_id: (await supabase.auth.getUser()).data.user?.id
          })
          .select();

        if (error) {
          throw error;
        }

        if (data && data[0]) {
          setExamples(prev => [data[0], ...prev]);
        }
        
        toast({
          title: "Success",
          description: "New training example added",
        });
      }
    } catch (error) {
      console.error("Error saving training example:", error);
      toast({
        title: "Error",
        description: "Failed to save training example",
        variant: "destructive",
      });
    } finally {
      setEditingExample(null);
      setIsCreatingNew(false);
      resetNewExampleForm();
    }
  };

  const handleDeleteExample = async (id: string) => {
    try {
      const { error } = await supabase
        .from('agent_training_examples')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setExamples(prev => prev.filter(ex => ex.id !== id));
      
      toast({
        title: "Success",
        description: "Training example deleted",
      });
    } catch (error) {
      console.error("Error deleting training example:", error);
      toast({
        title: "Error",
        description: "Failed to delete training example",
        variant: "destructive",
      });
    }
  };

  const resetNewExampleForm = () => {
    setNewUserMessage("");
    setNewAIResponse("");
    setNewCorrectedResponse("");
  };

  const filteredExamples = examples.filter(example => {
    const query = searchQuery.toLowerCase();
    return (
      example.user_message.toLowerCase().includes(query) ||
      example.ai_response.toLowerCase().includes(query) ||
      example.corrected_response.toLowerCase().includes(query)
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <DialogTitle className="text-xl flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Training Examples
              </DialogTitle>
              <DialogDescription>
                Manage training examples for {agent.name}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex items-center gap-2 p-4 border-b">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search examples..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-none shadow-none focus-visible:ring-0"
          />
          <Button variant="outline" size="sm" onClick={() => {
            setIsCreatingNew(true);
            setEditingExample(null);
          }}>
            <Plus className="h-4 w-4 mr-1" />
            Add Example
          </Button>
        </div>

        {(isCreatingNew || editingExample) ? (
          <div className="p-4 overflow-auto flex-1">
            <h3 className="text-lg font-medium mb-4">
              {isCreatingNew ? "Add New Training Example" : "Edit Training Example"}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">User Message</label>
                <Textarea
                  value={isCreatingNew ? newUserMessage : editingExample?.user_message || ""}
                  onChange={(e) => isCreatingNew 
                    ? setNewUserMessage(e.target.value)
                    : setEditingExample(prev => prev ? { ...prev, user_message: e.target.value } : null)
                  }
                  placeholder="What the user asked..."
                  className="min-h-[80px]"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">AI Response</label>
                <Textarea
                  value={isCreatingNew ? newAIResponse : editingExample?.ai_response || ""}
                  onChange={(e) => isCreatingNew 
                    ? setNewAIResponse(e.target.value)
                    : setEditingExample(prev => prev ? { ...prev, ai_response: e.target.value } : null)
                  }
                  placeholder="How the AI responded..."
                  className="min-h-[80px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {isCreatingNew && "Optional for new examples."}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Corrected Response</label>
                <Textarea
                  value={isCreatingNew ? newCorrectedResponse : editingExample?.corrected_response || ""}
                  onChange={(e) => isCreatingNew 
                    ? setNewCorrectedResponse(e.target.value)
                    : setEditingExample(prev => prev ? { ...prev, corrected_response: e.target.value } : null)
                  }
                  placeholder="The correct response that should have been given..."
                  className="min-h-[120px]"
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => {
                  setIsCreatingNew(false);
                  setEditingExample(null);
                  resetNewExampleForm();
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSaveExample}>
                  {isCreatingNew ? "Add Example" : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 p-4">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : filteredExamples.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">No training examples found</h3>
                <p className="text-muted-foreground mt-1">
                  {searchQuery ? "Try a different search query or " : ""}
                  add your first training example to improve your agent's responses.
                </p>
                {searchQuery && (
                  <Button variant="outline" className="mt-4" onClick={() => setSearchQuery("")}>
                    Clear Search
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {filteredExamples.map((example) => (
                  <div key={example.id} className="border rounded-lg p-4 relative group">
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => {
                          setEditingExample(example);
                          setIsCreatingNew(false);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive" 
                        onClick={() => handleDeleteExample(example.id || "")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">User Message:</p>
                        <p className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-sm">
                          {example.user_message}
                        </p>
                      </div>
                      
                      {example.ai_response && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">AI Response:</p>
                          <p className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 p-2 rounded text-sm">
                            {example.ai_response}
                          </p>
                        </div>
                      )}
                      
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Corrected Response:</p>
                        <p className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-300 p-2 rounded text-sm">
                          {example.corrected_response}
                        </p>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        Added on {new Date(example.created_at || "").toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
