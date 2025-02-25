
import { Handle, Position } from '@xyflow/react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, MessagesSquare } from 'lucide-react';
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
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-500 via-blue-600 to-blue-700 rounded-2xl opacity-90 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Card content with glass effect */}
      <div className="relative backdrop-blur-xl rounded-2xl border border-white/20 shadow-[0_8px_16px_-6px_rgba(0,0,0,0.5)] p-5 min-w-[320px] transition-all duration-500 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.7)] hover:translate-y-[-2px]">
        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <div className="absolute h-[500px] w-[500px] -top-[250px] -left-[250px] bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute h-[400px] w-[400px] -bottom-[200px] -right-[200px] bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-white/20">
            <span className="relative flex h-10 w-10">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-lg bg-blue-300 opacity-20" />
              <span className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-xl text-white/90">
                <MessagesSquare className="h-5 w-5" />
              </span>
            </span>
            <span className="font-semibold text-lg bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">Greeting</span>
          </div>
          
          <GreetingInput value={greeting} onChange={setGreeting} />

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-white/70">
                Possible outcomes ({outcomes.length}/5)
              </Label>
              {!showOutcomeInput && outcomes.length < 5 && !editingIndex && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10 backdrop-blur-xl rounded-lg"
                  onClick={() => setShowOutcomeInput(true)}
                >
                  <Plus className="h-5 w-5" />
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
      </div>
      
      {/* Handles */}
      <Handle
        type="target"
        position={Position.Left}
        className="w-2 h-4 !bg-white/50 rounded-sm border-none !left-[-8px] transition-all duration-300 hover:!bg-white/70"
      />

      {outcomes.length === 0 && (
        <Handle
          type="source"
          position={Position.Right}
          id="default"
          className="w-2 h-4 !bg-white/50 rounded-sm border-none !right-[-8px] transition-all duration-300 hover:!bg-white/70"
        />
      )}
    </div>
  );
}
