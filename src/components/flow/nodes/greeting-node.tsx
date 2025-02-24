
import { Handle, Position } from '@xyflow/react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, X, Pencil } from 'lucide-react';
import { useState } from 'react';

type GreetingNodeData = {
  greeting: string;
  outcomes: string[];
};

export function GreetingNode({ data, id }: { data: GreetingNodeData; id: string }) {
  const [showOutcomeInput, setShowOutcomeInput] = useState(false);
  const [newOutcome, setNewOutcome] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleGreetingChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const evt = new CustomEvent('nodeupdate', {
      detail: { 
        id, 
        data: { 
          ...data,
          greeting: event.target.value 
        } 
      },
    });
    window.dispatchEvent(evt);
  };

  const addOutcome = () => {
    if (data.outcomes?.length >= 5) return;
    if (!newOutcome.trim()) return;

    const evt = new CustomEvent('nodeupdate', {
      detail: {
        id,
        data: {
          ...data,
          outcomes: [...(data.outcomes || []), newOutcome]
        }
      },
    });
    window.dispatchEvent(evt);
    setNewOutcome('');
    setShowOutcomeInput(false);
  };

  const removeOutcome = (index: number) => {
    const evt = new CustomEvent('nodeupdate', {
      detail: {
        id,
        data: {
          ...data,
          outcomes: data.outcomes.filter((_, i) => i !== index)
        }
      },
    });
    window.dispatchEvent(evt);
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setNewOutcome(data.outcomes[index]);
  };

  const saveEdit = (index: number) => {
    if (!newOutcome.trim()) return;
    
    const updatedOutcomes = [...data.outcomes];
    updatedOutcomes[index] = newOutcome;

    const evt = new CustomEvent('nodeupdate', {
      detail: {
        id,
        data: {
          ...data,
          outcomes: updatedOutcomes
        }
      },
    });
    window.dispatchEvent(evt);
    setEditingIndex(null);
    setNewOutcome('');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-4 min-w-[300px]">
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 rounded-full bg-gray-300 border-2 border-white dark:border-gray-800"
      />
      
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="text-blue-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
          </span>
          <span className="font-medium dark:text-white">Greeting</span>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`greeting-${id}`} className="text-xs text-muted-foreground dark:text-gray-400">
            Enter greeting message
          </Label>
          <Textarea 
            id={`greeting-${id}`}
            value={data.greeting}
            onChange={handleGreetingChange}
            className="nodrag text-sm resize-y min-h-[60px]"
            placeholder="Type your greeting message..."
          />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs text-muted-foreground dark:text-gray-400">
              Possible outcomes ({(data.outcomes || []).length}/5)
            </Label>
            {!showOutcomeInput && (data.outcomes || []).length < 5 && !editingIndex && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 hover:bg-blue-50 dark:hover:bg-blue-950"
                onClick={() => setShowOutcomeInput(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>

          {(showOutcomeInput || editingIndex !== null) && (
            <div className="flex gap-3 bg-accent/20 p-4 rounded-lg border border-accent/30">
              <Textarea
                value={newOutcome}
                onChange={(e) => setNewOutcome(e.target.value)}
                placeholder="Enter possible response..."
                className="nodrag text-sm resize-none min-h-[80px]"
              />
              <div className="flex flex-col gap-2">
                <Button 
                  size="sm" 
                  className="px-4"
                  onClick={() => {
                    if (editingIndex !== null) {
                      saveEdit(editingIndex);
                    } else {
                      addOutcome();
                    }
                  }}
                >
                  {editingIndex !== null ? 'Save' : 'Add'}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="px-4"
                  onClick={() => {
                    setShowOutcomeInput(false);
                    setEditingIndex(null);
                    setNewOutcome('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {(data.outcomes || []).map((outcome, index) => (
              <div key={index} className="flex items-start gap-2 group">
                <div className="flex-1 bg-white dark:bg-gray-900 rounded-lg p-3 text-sm relative border shadow-sm">
                  {outcome}
                  <div className="absolute -right-2 -top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 bg-white dark:bg-gray-900 shadow-sm hover:bg-blue-50 dark:hover:bg-blue-950"
                      onClick={() => startEditing(index)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 bg-white dark:bg-gray-900 shadow-sm hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={() => removeOutcome(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`outcome-${index}`}
                    className="w-3 h-3 rounded-full bg-gray-300 border-2 border-white dark:border-gray-800"
                    style={{ top: '50%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
