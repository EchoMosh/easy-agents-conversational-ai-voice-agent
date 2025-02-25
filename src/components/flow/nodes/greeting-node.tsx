
import { Handle, Position } from '@xyflow/react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { GreetingInput } from './greeting/greeting-input';
import { OutcomeInput } from './greeting/outcome-input';
import { OutcomeListItem } from './greeting/outcome-list-item';

type GreetingNodeData = {
  greeting: string;
  outcomes?: string[];
};

export function GreetingNode({ data, id }: { data: GreetingNodeData; id: string }) {
  const [showOutcomeInput, setShowOutcomeInput] = useState(false);
  const [newOutcome, setNewOutcome] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [greeting, setGreeting] = useState(data.greeting);
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
    <div className="relative group bg-gradient-to-br from-blue-50/90 to-white dark:from-gray-900 dark:to-gray-800 rounded-xl border border-blue-100/50 dark:border-gray-700/50 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.5),0_2px_4px_-2px_rgba(0,0,0,0.25)] backdrop-blur-xl p-4 min-w-[320px] transition-transform duration-300 bg-[length:200%_200%] animate-breathing">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] to-transparent dark:from-blue-500/[0.05] rounded-xl pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100" />
      
      {/* Input handle */}
      <Handle 
        type="target" 
        position={Position.Left} 
        id="target"
        className="w-2 h-4 !bg-blue-400 rounded-sm border-none transition-all duration-300 hover:!bg-blue-500" 
      />

      {/* Default output handle if no outcomes */}
      {outcomes.length === 0 && (
        <Handle
          type="source"
          position={Position.Right}
          id="default"
          className="w-2 h-4 !bg-blue-400 rounded-sm border-none transition-all duration-300 hover:!bg-blue-500"
        />
      )}
      
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-3 border-b border-blue-100/50 dark:border-gray-700/50">
          <span className="text-blue-500 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/50 p-1.5 rounded-md">
            <MessageCircle className="h-4 w-4" />
          </span>
          <span className="font-medium text-blue-700 dark:text-blue-300">Greeting</span>
        </div>
        
        <GreetingInput 
          value={greeting}
          onChange={setGreeting}
        />

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-blue-600/75 dark:text-blue-300/75">
              Possible outcomes ({outcomes.length}/5)
            </Label>
            {!showOutcomeInput && outcomes.length < 5 && !editingIndex && (
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
            <OutcomeInput
              value={newOutcome}
              onChange={setNewOutcome}
              onSave={() => editingIndex !== null ? saveEdit() : addOutcome()}
              onCancel={cancelEdit}
              isEditing={editingIndex !== null}
            />
          )}

          <div className="space-y-2.5">
            {outcomes.map((outcome, index) => (
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
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 bg-white/80 dark:bg-gray-900/50 shadow-sm hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-md"
                      onClick={() => removeOutcome(index)}
                    >
                      <Plus className="h-3 w-3" />
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
      
      <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-blue-500/[0.03] pointer-events-none" />
    </div>
  );
}
