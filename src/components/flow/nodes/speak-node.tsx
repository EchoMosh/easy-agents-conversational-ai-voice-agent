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

export function SpeakNode({ data }: { data: SpeakNodeData; id: string }) {
  const [message, setMessage] = useState(data.message);
  const [showOutcomeInput, setShowOutcomeInput] = useState(false);
  const [newOutcome, setNewOutcome] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [outcomes, setOutcomes] = useState(data.outcomes || []);

  const addOutcome = () => {
    if (outcomes.length >= 5) return;
    if (!newOutcome.trim()) return;

    setOutcomes([...outcomes, newOutcome]);
    setNewOutcome('');
    setShowOutcomeInput(false);
  };

  const removeOutcome = (index: number) => {
    setOutcomes(outcomes.filter((_, i) => i !== index));
  };

  const startEditing = (index: number) => {
    setEditingIndex(index);
    setNewOutcome(outcomes[index]);
  };

  const saveEdit = () => {
    if (!newOutcome.trim() || editingIndex === null) return;
    
    const updatedOutcomes = [...outcomes];
    updatedOutcomes[editingIndex] = newOutcome;
    setOutcomes(updatedOutcomes);
    setEditingIndex(null);
    setNewOutcome('');
  };

  const cancelEdit = () => {
    setShowOutcomeInput(false);
    setEditingIndex(null);
    setNewOutcome('');
  };

  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.02] to-transparent dark:from-purple-500/[0.05] rounded-2xl pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100" />
      
      <Handle 
        type="target" 
        position={Position.Left}
      />
      
      <div className="flex flex-col gap-4">
        <div className="node-header">
          <span className="node-icon">
            <MessageCircle className="h-4 w-4" />
          </span>
          <span className="font-medium text-purple-700 dark:text-purple-300">Speak</span>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs font-medium text-purple-600/75 dark:text-purple-300/75">
            Message
          </Label>
          <Textarea 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="nodrag text-sm resize-y min-h-[80px] bg-white/80 dark:bg-gray-900/50 border-purple-100/50 dark:border-purple-800/50 shadow-sm rounded-lg focus-visible:ring-purple-500/50 focus-visible:border-purple-200"
            placeholder="Type your message..."
          />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-purple-600/75 dark:text-purple-300/75">
              Possible outcomes ({outcomes.length}/5)
            </Label>
            {!showOutcomeInput && outcomes.length < 5 && !editingIndex && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-300 dark:hover:bg-purple-900/50 rounded-md"
                onClick={() => setShowOutcomeInput(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>

          {(showOutcomeInput || editingIndex !== null) && (
            <div className="flex gap-3 bg-purple-50/30 dark:bg-purple-900/10 p-4 rounded-lg border border-purple-100/50 dark:border-purple-800/50">
              <Textarea
                value={newOutcome}
                onChange={(e) => setNewOutcome(e.target.value)}
                placeholder="Enter possible response..."
                className="nodrag text-sm resize-none min-h-[80px] bg-white/80 dark:bg-gray-900/80 border-purple-100/50 dark:border-purple-800/50"
              />
              <div className="flex flex-col gap-2">
                <Button 
                  size="sm" 
                  className="px-4 bg-purple-500 hover:bg-purple-600 text-white shadow-md"
                  onClick={() => editingIndex !== null ? saveEdit() : addOutcome()}
                >
                  {editingIndex !== null ? 'Save' : 'Add'}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="px-4 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-300 dark:hover:bg-purple-900/50"
                  onClick={cancelEdit}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2.5">
            {outcomes.map((outcome, index) => (
              <div key={index} className="group relative">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white/80 dark:bg-gray-900/50 rounded-lg py-2 px-3 text-sm border border-purple-100/50 dark:border-purple-800/50 shadow-sm">
                    {outcome}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 bg-white/80 dark:bg-gray-900/50 shadow-sm hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/50 rounded-md"
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
                    className="w-2 h-4 !bg-purple-400 rounded-sm border-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {(!outcomes || outcomes.length === 0) && (
        <Handle
          type="source"
          position={Position.Right}
          id="default"
        />
      )}
      
      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-purple-500/[0.03] pointer-events-none" />
    </div>
  );
}
