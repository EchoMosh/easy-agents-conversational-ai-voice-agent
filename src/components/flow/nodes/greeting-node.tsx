import { Handle, Position } from '@xyflow/react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, Pencil, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { GreetingInput } from './greeting/greeting-input';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  const [showOutcomeDialog, setShowOutcomeDialog] = useState(false);
  const [newOutcome, setNewOutcome] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [greeting, setGreeting] = useState(data.greeting);
  const [outcomes, setOutcomes] = useState(data.outcomes || []);

  // Sync outcomes with data when it changes from the parent
  useEffect(() => {
    setOutcomes(data.outcomes || []);
  }, [data.outcomes]);

  // Send update event when greeting changes
  useEffect(() => {
    // Only trigger update if the greeting has actually changed from the initial data
    if (greeting !== data.greeting) {
      console.log("Emitting node update for greeting change:", greeting);
      const evt = new CustomEvent('nodeupdate', {
        detail: {
          id,
          data: {
            ...data,
            greeting
          }
        }
      });
      window.dispatchEvent(evt);
    }
  }, [greeting, id, data]);
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
  const handleGreetingChange = (value: string) => {
    setGreeting(value);
  };
  return <div className="group relative">
      {/* Glowing background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-sky-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Main container */}
      <div className="relative backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 rounded-2xl border border-blue-200/50 dark:border-blue-800/50 shadow-[0_8px_16px_-6px_rgba(59,130,246,0.2)] dark:shadow-[0_8px_16px_-6px_rgba(59,130,246,0.3)] p-5 min-w-[320px] transition-all duration-500 hover:translate-y-[-2px] hover:shadow-[0_20px_40px_-12px_rgba(59,130,246,0.4)] dark:hover:shadow-[0_20px_40px_-12px_rgba(59,130,246,0.5)]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="relative flex h-8 w-8 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-lg bg-blue-400 opacity-20" />
            <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-sky-500 text-white shadow-lg">
              <MessageSquare className="h-4 w-4" />
            </span>
          </span>
          <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-sky-500">Speak</span>
        </div>

        {/* Message input */}
        <div className="space-y-2 mb-6">
          <Label className="text-xs font-medium text-blue-600/75 dark:text-blue-300/75">
            Message
          </Label>
          <GreetingInput value={greeting} onChange={handleGreetingChange} />
        </div>

        {/* Outcomes section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-blue-600/75 dark:text-blue-300/75">
              Possible outcomes ({outcomes.length}/5)
            </Label>
            {outcomes.length < 5 && <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-900/50 rounded-lg" onClick={openNewOutcomeDialog}>
                <Plus className="h-4 w-4" />
              </Button>}
          </div>

          <div className="space-y-2">
            {outcomes.map((outcome, index) => <div key={index} className="group relative animate-fade-in">
                <div className="flex items-center gap-2">
                  <div className="flex-1 backdrop-blur-sm bg-white/40 dark:bg-gray-900/40 rounded-xl py-2.5 px-4 text-sm border border-blue-100/50 dark:border-blue-800/50 shadow-sm text-gray-900 dark:text-white/90">
                    {outcome}
                  </div>
                  <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-7 w-7 bg-white/80 dark:bg-gray-900/80 shadow-sm hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg" onClick={() => startEditing(index)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 bg-white/80 dark:bg-gray-900/80 shadow-sm hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg" onClick={() => removeOutcome(index)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Handle type="source" position={Position.Right} id={`outcome-${index}`} className="!w-2 !h-4 !bg-blue-400 rounded-sm border-none !right-[-8px] transition-all duration-300 hover:!bg-blue-500" />
                </div>
              </div>)}
          </div>
        </div>
      </div>

      {/* Input handle */}
      <Handle type="target" position={Position.Left} className="!w-2 !h-4 !bg-blue-400 rounded-sm border-none !left-[-8px] transition-all duration-300 hover:!bg-blue-500" />
      
      {/* Default output handle */}
      {(!outcomes || outcomes.length === 0) && <Handle type="source" position={Position.Right} id="default" className="!w-2 !h-4 !bg-blue-400 rounded-sm border-none !right-[-8px] transition-all duration-300 hover:!bg-blue-500" />}

      {/* Outcome Dialog */}
      <Dialog open={showOutcomeDialog} onOpenChange={setShowOutcomeDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? 'Edit Outcome' : 'Add New Outcome'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input value={newOutcome} onChange={e => setNewOutcome(e.target.value)} placeholder="Enter possible response..." className="text-sm" />
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button className="bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white" onClick={() => editingIndex !== null ? saveEdit() : addOutcome()}>
                {editingIndex !== null ? 'Save Changes' : 'Add Outcome'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
}