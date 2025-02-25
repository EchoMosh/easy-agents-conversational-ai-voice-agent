
import { Handle, Position } from '@xyflow/react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, MessageCurlyIcon } from 'lucide-react';
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
      {/* Dynamic Wave Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl overflow-hidden">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f46e5,#0ea5e9)] mix-blend-multiply" />
          <div className="absolute w-[200%] aspect-[1/0.2] -top-[25%] left-[50%] -translate-x-[50%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_100%)] animate-[wave_15s_linear_infinite]" 
            style={{
              maskImage: "linear-gradient(to bottom, transparent 40%, black 60%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 40%, black 60%)"
            }}
          />
          <div className="absolute w-[200%] aspect-[1/0.2] -top-[15%] left-[50%] -translate-x-[50%] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.1)_0%,transparent_100%)] animate-[wave_12s_linear_infinite]"
            style={{
              maskImage: "linear-gradient(to bottom, transparent 30%, black 70%)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent 30%, black 70%)"
            }}
          />
        </div>
      </div>

      {/* Content Container */}
      <div className="relative backdrop-blur-md bg-white/10 rounded-xl border border-white/20 shadow-lg p-5 min-w-[320px]">
        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute h-32 w-32 -left-16 -top-16 bg-blue-300/20 rounded-full blur-2xl animate-pulse" />
          <div className="absolute h-32 w-32 -right-16 -bottom-16 bg-cyan-300/20 rounded-full blur-2xl animate-pulse delay-700" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-center gap-3 pb-4 border-b border-white/20">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-400/80 to-blue-500/80 text-white shadow-lg">
              <MessageCurlyIcon className="h-5 w-5" />
              <div className="absolute inset-0 rounded-lg bg-gradient-to-tr from-cyan-400/30 to-blue-500/30 blur-xl" />
            </span>
            <span className="font-semibold text-lg text-white">Greeting</span>
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
                  className="h-8 w-8 p-0 text-white/70 hover:text-white hover:bg-white/10 backdrop-blur-sm rounded-lg"
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
