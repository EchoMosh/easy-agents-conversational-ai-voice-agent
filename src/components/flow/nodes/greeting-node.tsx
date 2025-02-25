
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

export function GreetingNode({
  data,
  id
}: {
  data: GreetingNodeData;
  id: string;
}) {
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
      {/* Background Light Particles */}
      <div className="absolute inset-0 overflow-hidden rounded-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-white/10" />
        <div className="absolute w-32 h-32 -left-16 -top-16 bg-blue-200/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute w-32 h-32 -right-16 -bottom-16 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute w-24 h-24 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/5 rounded-full blur-2xl animate-pulse delay-500" />
      </div>

      {/* Glass Card Content */}
      <div className="relative backdrop-blur-xl bg-white/10 border border-white/20 rounded-xl shadow-lg px-6 py-5 min-w-[320px]">
        {/* Content */}
        <div className="flex flex-col gap-5">
          {/* Header */}
          <div className="flex items-center gap-3">
            <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/70 shadow-sm backdrop-blur-sm">
              <MessageCircle className="h-4 w-4" />
            </span>
            <span className="font-medium text-white/90">Greeting</span>
          </div>

          <GreetingInput value={greeting} onChange={setGreeting} />

          <div className="flex flex-col gap-3 mt-1">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-normal text-white/50">
                Possible outcomes ({outcomes.length}/5)
              </Label>
              {!showOutcomeInput && outcomes.length < 5 && !editingIndex && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-white/40 hover:text-white/90 hover:bg-white/10 rounded-lg"
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

            <div className="space-y-2">
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
      </div>
      
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-4 !bg-white/30 rounded-sm border-none !left-[-8px] transition-all duration-300 hover:!bg-white/50"
      />

      {outcomes.length === 0 && (
        <Handle
          type="source"
          position={Position.Right}
          id="default"
          className="w-2 h-4 !bg-white/30 rounded-sm border-none !right-[-8px] transition-all duration-300 hover:!bg-white/50"
        />
      )}
    </div>
  );
}
