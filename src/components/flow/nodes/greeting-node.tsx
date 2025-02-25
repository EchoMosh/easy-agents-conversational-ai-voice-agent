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
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.02] to-transparent dark:from-blue-500/[0.05] rounded-2xl pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100" />
      
      <Handle 
        type="target" 
        position={Position.Left}
      />
      
      <Handle 
        type="source" 
        position={Position.Right}
      />
      
      <div className="flex flex-col gap-4">
        <div className="node-header">
          <span className="node-icon">
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
              <OutcomeListItem
                key={index}
                outcome={outcome}
                index={index}
                onEdit={startEditing}
                onRemove={removeOutcome}
              />
            ))}
          </div>
        </div>
      </div>
      
      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-blue-500/[0.03] pointer-events-none" />
    </div>
  );
}
