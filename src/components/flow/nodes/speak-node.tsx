
import { Handle, Position } from '@xyflow/react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, X, Pencil, MessageSquare } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { VariableSelector } from './variable-mention/variable-selector';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type SpeakNodeData = {
  message: string;
  outcomes?: string[];
};

export function SpeakNode({ data, id }: { data: SpeakNodeData; id: string }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState(data.message || "");
  const [showOutcomeDialog, setShowOutcomeDialog] = useState(false);
  const [newOutcome, setNewOutcome] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [outcomes, setOutcomes] = useState(data.outcomes || []);

  // Sync message with data when it changes from the parent
  useEffect(() => {
    if (data.message !== undefined && data.message !== message) {
      setMessage(data.message);
    }
  }, [data.message]);

  // Sync outcomes with data when it changes from the parent
  useEffect(() => {
    setOutcomes(data.outcomes || []);
  }, [data.outcomes]);

  // Send update event when message changes
  useEffect(() => {
    // Only trigger update if the message has actually changed from the initial data
    if (message !== data.message && message !== undefined) {
      console.log("Emitting node update for message change:", message);
      const evt = new CustomEvent('nodeupdate', {
        detail: {
          id,
          data: {
            ...data,
            message
          }
        }
      });
      window.dispatchEvent(evt);
    }
  }, [message, id, data]);

  const addOutcome = () => {
    if (outcomes.length >= 5) return;
    if (!newOutcome.trim()) return;
    
    const newOutcomes = [...outcomes, newOutcome];
    setOutcomes(newOutcomes);
    setNewOutcome('');
    setShowOutcomeDialog(false);
    
    // Send update event with new outcomes
    const evt = new CustomEvent('nodeupdate', {
      detail: {
        id,
        data: {
          ...data,
          outcomes: newOutcomes
        }
      }
    });
    window.dispatchEvent(evt);
  };

  const removeOutcome = (index: number) => {
    const newOutcomes = outcomes.filter((_, i) => i !== index);
    setOutcomes(newOutcomes);
    
    // Send update event with remaining outcomes
    const evt = new CustomEvent('nodeupdate', {
      detail: {
        id,
        data: {
          ...data,
          outcomes: newOutcomes
        }
      }
    });
    window.dispatchEvent(evt);
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setNewOutcome(outcomes[index]);
    setShowOutcomeDialog(true);
  };

  const saveEdit = () => {
    if (!newOutcome.trim() || editingIndex === null) return;
    
    const updatedOutcomes = [...outcomes];
    updatedOutcomes[editingIndex] = newOutcome;
    setOutcomes(updatedOutcomes);
    setEditingIndex(null);
    setNewOutcome('');
    setShowOutcomeDialog(false);
    
    // Send update event with updated outcomes
    const evt = new CustomEvent('nodeupdate', {
      detail: {
        id,
        data: {
          ...data,
          outcomes: updatedOutcomes
        }
      }
    });
    window.dispatchEvent(evt);
  };

  const cancelEdit = () => {
    setShowOutcomeDialog(false);
    setEditingIndex(null);
    setNewOutcome('');
  };

  const openNewOutcomeDialog = () => {
    setEditingIndex(null);
    setNewOutcome('');
    setShowOutcomeDialog(true);
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    console.log("SpeakNode handleMessageChange:", newValue);
    setMessage(newValue);
  };

  const highlightVariables = (text: string) => {
    if (!text) return '';
    return text.replace(
      /{{([^}]+)}}/g,
      '<span class="bg-indigo-100/80 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded-md font-medium">{{$1}}</span>'
    );
  };

  return (
    <div className="group relative">
      {/* Glowing background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Main container */}
      <div className="relative backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 rounded-2xl border border-indigo-200/50 dark:border-indigo-800/50 shadow-[0_8px_16px_-6px_rgba(79,70,229,0.2)] dark:shadow-[0_8px_16px_-6px_rgba(79,70,229,0.3)] p-5 min-w-[320px] transition-all duration-500 hover:translate-y-[-2px] hover:shadow-[0_20px_40px_-12px_rgba(79,70,229,0.4)] dark:hover:shadow-[0_20px_40px_-12px_rgba(79,70,229,0.5)]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="relative flex h-8 w-8 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-lg bg-indigo-400 opacity-20" />
            <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg">
              <MessageSquare className="h-4 w-4" />
            </span>
          </span>
          <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Speak</span>
        </div>

        {/* Message input */}
        <div className="space-y-2 mb-6">
          <Label className="text-xs font-medium text-indigo-600/75 dark:text-indigo-300/75">
            Message
          </Label>
          <div className="relative rounded-xl overflow-hidden backdrop-blur-sm bg-white/40 dark:bg-gray-900/40 border border-indigo-100/50 dark:border-indigo-800/50 shadow-[0_2px_4px_-2px_rgba(79,70,229,0.1)]">
            <Textarea 
              ref={textareaRef}
              value={message}
              onChange={handleMessageChange}
              className="nodrag text-sm resize-y min-h-[100px] bg-transparent border-none focus-visible:ring-1 focus-visible:ring-indigo-500/50 text-transparent caret-indigo-500"
              placeholder="Type @ to insert a variable..."
            />
            <div 
              className="absolute inset-0 pointer-events-none p-[9px] text-sm whitespace-pre-wrap text-gray-900 dark:text-white"
              dangerouslySetInnerHTML={{ 
                __html: highlightVariables(message)
                  .split('\n')
                  .map(line => line || '&#8203;')
                  .join('<br/>') 
              }}
            />
          </div>
          <VariableSelector
            text={message}
            onTextChange={(text) => {
              console.log("VariableSelector onTextChange:", text);
              setMessage(text);
            }}
            textareaRef={textareaRef}
          />
        </div>

        {/* Outcomes section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-indigo-600/75 dark:text-indigo-300/75">
              Possible outcomes ({outcomes.length}/5)
            </Label>
            {outcomes.length < 5 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-900/50 rounded-lg"
                onClick={openNewOutcomeDialog}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Outcomes list */}
          <div className="space-y-2">
            {outcomes.map((outcome, index) => (
              <div key={index} className="group relative animate-fade-in">
                <div className="flex items-center gap-2">
                  <div className="flex-1 backdrop-blur-sm bg-white/40 dark:bg-gray-900/40 rounded-xl py-2.5 px-4 text-sm border border-indigo-100/50 dark:border-indigo-800/50 shadow-sm">
                    {outcome}
                  </div>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 bg-white/80 dark:bg-gray-900/80 shadow-sm hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-lg"
                      onClick={() => startEditing(index)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 bg-white/80 dark:bg-gray-900/80 shadow-sm hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg"
                      onClick={() => removeOutcome(index)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`outcome-${index}`}
                    className="!w-2 !h-4 !bg-indigo-400 rounded-sm border-none !right-[-8px] transition-all duration-300 hover:!bg-indigo-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Input handle */}
      <Handle 
        type="target" 
        position={Position.Left}
        className="!w-2 !h-4 !bg-indigo-400 rounded-sm border-none !left-[-8px] transition-all duration-300 hover:!bg-indigo-500"
      />
      
      {/* Default output handle */}
      {(!outcomes || outcomes.length === 0) && (
        <Handle
          type="source"
          position={Position.Right}
          id="default"
          className="!w-2 !h-4 !bg-indigo-400 rounded-sm border-none !right-[-8px] transition-all duration-300 hover:!bg-indigo-500"
        />
      )}

      {/* Outcome Dialog */}
      <Dialog open={showOutcomeDialog} onOpenChange={setShowOutcomeDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? 'Edit Outcome' : 'Add New Outcome'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={newOutcome}
              onChange={(e) => setNewOutcome(e.target.value)}
              placeholder="Enter possible response..."
              className="text-sm"
            />
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={cancelEdit}
              >
                Cancel
              </Button>
              <Button 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                onClick={() => editingIndex !== null ? saveEdit() : addOutcome()}
              >
                {editingIndex !== null ? 'Save Changes' : 'Add Outcome'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
