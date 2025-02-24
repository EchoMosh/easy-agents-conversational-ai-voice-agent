
import { Handle, Position } from '@xyflow/react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, X, Pencil, MessageCircle } from 'lucide-react';
import { useState } from 'react';

type SpeakNodeData = {
  message: string;
  outcomes?: string[];
};

export function SpeakNode({ data, id }: { data: SpeakNodeData; id: string }) {
  const [showOutcomeInput, setShowOutcomeInput] = useState(false);
  const [newOutcome, setNewOutcome] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleMessageChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const evt = new CustomEvent('nodeupdate', {
      detail: { 
        id,
        data: { 
          ...data,
          message: event.target.value 
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
          outcomes: data.outcomes?.filter((_, i) => i !== index) || []
        }
      },
    });
    window.dispatchEvent(evt);
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setNewOutcome(data.outcomes?.[index] || '');
  };

  const saveEdit = (index: number) => {
    if (!newOutcome.trim() || !data.outcomes) return;
    
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
    <div className="bg-gradient-to-br from-purple-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-xl border shadow-lg p-4 min-w-[320px]">
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-3 h-3 !bg-purple-400 border-2 border-white dark:border-gray-800" 
      />
      
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-2 border-b border-purple-100 dark:border-gray-700">
          <span className="text-purple-500 dark:text-purple-400">
            <MessageCircle className="h-5 w-5" />
          </span>
          <span className="font-medium text-purple-700 dark:text-purple-300">Speak</span>
        </div>
        
        <div className="flex flex-col gap-2">
          <Label htmlFor={`message-${id}`} className="text-xs font-medium text-purple-600 dark:text-purple-300">
            Message
          </Label>
          <Textarea 
            id={`message-${id}`}
            value={data.message}
            onChange={handleMessageChange}
            className="nodrag text-sm resize-y min-h-[80px] bg-white/50 dark:bg-gray-900/50 border-purple-100 dark:border-gray-700 shadow-sm rounded-lg focus-visible:ring-purple-500"
            placeholder="Type your message..."
          />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-purple-600 dark:text-purple-300">
              Possible outcomes ({(data.outcomes || []).length}/5)
            </Label>
            {!showOutcomeInput && (data.outcomes || []).length < 5 && !editingIndex && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-300 dark:hover:bg-purple-900/50"
                onClick={() => setShowOutcomeInput(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>

          {(showOutcomeInput || editingIndex !== null) && (
            <div className="flex gap-3 bg-purple-50/50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
              <Textarea
                value={newOutcome}
                onChange={(e) => setNewOutcome(e.target.value)}
                placeholder="Enter possible response..."
                className="nodrag text-sm resize-none min-h-[80px] bg-white dark:bg-gray-900 border-purple-100 dark:border-purple-800"
              />
              <div className="flex flex-col gap-2">
                <Button 
                  size="sm" 
                  className="px-4 bg-purple-600 hover:bg-purple-700 text-white"
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
                  className="px-4 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-300 dark:hover:bg-purple-900/50"
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

          <div className="space-y-3">
            {(data.outcomes || []).map((outcome, index) => (
              <div key={index} className="group relative">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white dark:bg-gray-900 rounded-lg p-3 text-sm border border-purple-100 dark:border-purple-800 shadow-sm">
                    {outcome}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 bg-white dark:bg-gray-900 shadow-sm hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/50"
                      onClick={() => startEditing(index)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 bg-white dark:bg-gray-900 shadow-sm hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50"
                      onClick={() => removeOutcome(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`outcome-${index}`}
                    className="w-3 h-3 !bg-purple-400 border-2 border-white dark:border-gray-800"
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
