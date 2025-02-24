import { Handle, Position } from '@xyflow/react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, X, Pencil, MessageCircle } from 'lucide-react';
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
    <div className="bg-gradient-to-br from-blue-50/90 to-white dark:from-gray-900 dark:to-gray-800 rounded-xl border border-blue-100/50 dark:border-gray-700/50 shadow-xl backdrop-blur-sm p-4 min-w-[320px]">
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-4 !bg-blue-400 rounded-sm border-none"
      />
      
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-3 border-b border-blue-100/50 dark:border-gray-700/50">
          <span className="text-blue-500 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/50 p-1.5 rounded-md">
            <MessageCircle className="h-4 w-4" />
          </span>
          <span className="font-medium text-blue-700 dark:text-blue-300">Greeting</span>
        </div>
        
        <div className="flex flex-col gap-2">
          <Label htmlFor={`greeting-${id}`} className="text-xs font-medium text-blue-600/75 dark:text-blue-300/75">
            Message
          </Label>
          <Textarea 
            id={`greeting-${id}`}
            value={data.greeting}
            onChange={handleGreetingChange}
            className="nodrag text-sm resize-y min-h-[80px] bg-white/80 dark:bg-gray-900/50 border-blue-100/50 dark:border-blue-800/50 shadow-sm rounded-lg focus-visible:ring-blue-500/50 focus-visible:border-blue-200"
            placeholder="Type your greeting message..."
          />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-blue-600/75 dark:text-blue-300/75">
              Possible outcomes ({(data.outcomes || []).length}/5)
            </Label>
            {!showOutcomeInput && (data.outcomes || []).length < 5 && !editingIndex && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-900/50 rounded-md"
                onClick={() => setShowOutcomeInput(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>

          {(showOutcomeInput || editingIndex !== null) && (
            <div className="flex gap-3 bg-blue-50/30 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100/50 dark:border-blue-800/50">
              <Textarea
                value={newOutcome}
                onChange={(e) => setNewOutcome(e.target.value)}
                placeholder="Enter possible response..."
                className="nodrag text-sm resize-none min-h-[80px] bg-white/80 dark:bg-gray-900/80 border-blue-100/50 dark:border-blue-800/50"
              />
              <div className="flex flex-col gap-2">
                <Button 
                  size="sm" 
                  className="px-4 bg-blue-500 hover:bg-blue-600 text-white shadow-md"
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
                  className="px-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-900/50"
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

          <div className="space-y-2.5">
            {(data.outcomes || []).map((outcome, index) => (
              <div key={index} className="group relative">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white/80 dark:bg-gray-900/50 rounded-lg py-2 px-3 text-sm border border-blue-100/50 dark:border-blue-800/50 shadow-sm">
                    {outcome}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 bg-white/80 dark:bg-gray-900/50 shadow-sm hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-md"
                      onClick={() => startEditing(index)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 bg-white/80 dark:bg-gray-900/50 shadow-sm hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-md"
                      onClick={() => removeOutcome(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`outcome-${index}`}
                    className="w-2 h-4 !bg-blue-400 rounded-sm border-none"
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
