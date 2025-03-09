
import { useState, useEffect, useContext } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, MessageCircle, Pencil, X, ListChecks } from 'lucide-react';
import { NodeUpdateContext } from '@/components/flow/agent-flow/flow';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

export function OutcomesNode({ id, data, selected, dragging }: any) {
  const { updateNodeData } = useContext(NodeUpdateContext);
  const [outcomes, setOutcomes] = useState<string[]>(data.outcomes || []);
  const [newOutcome, setNewOutcome] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showOutcomeDialog, setShowOutcomeDialog] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  useEffect(() => {
    if (data.outcomes && JSON.stringify(data.outcomes) !== JSON.stringify(outcomes)) {
      setOutcomes(data.outcomes);
    }
  }, [data.outcomes]);

  const handleAddOutcome = () => {
    if (newOutcome.trim() === '') return;
    
    const updatedOutcomes = [...outcomes, newOutcome.trim()];
    setOutcomes(updatedOutcomes);
    setNewOutcome('');
    
    const updatedData = {
      ...data,
      outcomes: updatedOutcomes,
    };
    
    updateNodeData(id, updatedData);
    setIsEditing(false);
    setShowOutcomeDialog(false);
  };

  const handleRemoveOutcome = (index: number) => {
    const updatedOutcomes = outcomes.filter((_, i) => i !== index);
    setOutcomes(updatedOutcomes);
    
    const updatedData = {
      ...data,
      outcomes: updatedOutcomes,
    };
    
    updateNodeData(id, updatedData);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editingIndex !== null) {
        saveEdit();
      } else {
        handleAddOutcome();
      }
    }
  };
  
  const openNewOutcomeDialog = () => {
    setEditingIndex(null);
    setNewOutcome('');
    setShowOutcomeDialog(true);
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

    updateNodeData(id, {
      ...data,
      outcomes: updatedOutcomes
    });
  };
  
  const cancelEdit = () => {
    setShowOutcomeDialog(false);
    setEditingIndex(null);
    setNewOutcome('');
  };

  return (
    <div className="group relative">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-violet-500/20 to-indigo-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 rounded-2xl border border-purple-200/50 dark:border-purple-800/50 shadow-[0_8px_16px_-6px_rgba(124,58,237,0.2)] dark:shadow-[0_8px_16px_-6px_rgba(124,58,237,0.3)] p-5 min-w-[320px] transition-all duration-500 hover:translate-y-[-2px] hover:shadow-[0_20px_40px_-12px_rgba(124,58,237,0.4)] dark:hover:shadow-[0_20px_40px_-12px_rgba(124,58,237,0.5)]">
        <div className="flex items-center gap-3 mb-4">
          <span className="relative flex h-8 w-8 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-lg bg-purple-400 opacity-20" />
            <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-violet-500 text-white shadow-lg">
              <ListChecks className="h-4 w-4" />
            </span>
          </span>
          <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-violet-500">User Responses</span>
        </div>

        <div className="space-y-2 mb-4">
          <Label className="text-xs font-medium text-purple-600/75 dark:text-purple-300/75">
            Title
          </Label>
          <input
            type="text"
            value={data.title || "User Outcomes"}
            onChange={(e) => updateNodeData(id, { ...data, title: e.target.value })}
            className="w-full font-semibold text-lg bg-transparent border-none outline-none p-0"
            placeholder="Enter node title..."
          />
        </div>

        <Separator className="mb-3 dark:bg-gray-800" />

        {/* Outcomes List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-purple-600/75 dark:text-purple-300/75">
              Defined responses ({outcomes.length})
            </Label>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 w-7 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-300 dark:hover:bg-purple-900/50 rounded-lg" 
              onClick={openNewOutcomeDialog}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            {outcomes.length === 0 ? (
              <div className="text-gray-500 text-sm italic py-1">No responses defined yet</div>
            ) : (
              outcomes.map((outcome, index) => (
                <div key={index} className="group relative animate-fade-in">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 backdrop-blur-sm bg-white/40 dark:bg-gray-900/40 rounded-xl py-2.5 px-4 text-sm border border-purple-100/50 dark:border-purple-800/50 shadow-sm text-gray-900 dark:text-white/90">
                      {outcome}
                    </div>
                    <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7 bg-white/80 dark:bg-gray-900/80 shadow-sm hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/50 rounded-lg" onClick={() => startEditing(index)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 bg-white/80 dark:bg-gray-900/80 shadow-sm hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg" onClick={() => handleRemoveOutcome(index)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Handle type="source" position={Position.Right} id={`outcome-${index}`} className="!w-2 !h-4 !bg-purple-400 rounded-sm border-none !right-[-8px] transition-all duration-300 hover:!bg-purple-500" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Add Outcome Button (Shown when list is empty) */}
        {outcomes.length === 0 && (
          <Button 
            onClick={openNewOutcomeDialog}
            className="w-full mt-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200/50 dark:border-purple-800/50"
          >
            <Plus className="h-3.5 w-3.5 mr-1" /> Add Your First Response
          </Button>
        )}
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <Button 
          onClick={openNewOutcomeDialog}
          className="flex items-center justify-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors shadow-md rounded-full border border-purple-200/50 dark:border-purple-800/50 my-[9px]"
        >
          <MessageCircle className="h-3 w-3 text-purple-600/80 dark:text-purple-400/80" />
          <span className="text-xs font-medium text-purple-600/80 dark:text-purple-400/80">
            Add Response
          </span>
        </Button>
      </div>

      <Handle type="target" position={Position.Left} className="!w-2 !h-4 !bg-purple-400 rounded-sm border-none !left-[-8px] transition-all duration-300 hover:!bg-purple-500" />
      
      {/* Outcome Dialog */}
      <Dialog open={showOutcomeDialog} onOpenChange={setShowOutcomeDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? 'Edit Response' : 'Add New Response'}</DialogTitle>
            <DialogDescription>
              Define possible user responses to previous interactions. These will be used as branching paths.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Be specific and descriptive</h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-lg">
                    <p className="font-semibold text-red-600 dark:text-red-400 mb-1">⛔ Poor examples:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                      <li>"Yes"</li>
                      <li>"No"</li>
                      <li>"Maybe"</li>
                      <li>"I agree"</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded-lg">
                    <p className="font-semibold text-green-600 dark:text-green-400 mb-1">✅ Good examples:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                      <li>"I'm interested in learning more about your pricing"</li>
                      <li>"What features does your product offer?"</li>
                      <li>"I'm not ready to purchase yet"</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <Input 
                value={newOutcome} 
                onChange={e => setNewOutcome(e.target.value)} 
                placeholder="Enter a detailed potential response..." 
                className="text-sm" 
                onKeyDown={handleKeyDown}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button 
                className="bg-gradient-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white" 
                onClick={() => editingIndex !== null ? saveEdit() : handleAddOutcome()}
                disabled={!newOutcome.trim() || newOutcome.trim().length < 5}
              >
                {editingIndex !== null ? 'Save Changes' : 'Add Response'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
