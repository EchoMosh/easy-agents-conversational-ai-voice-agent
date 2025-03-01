import { Handle, Position } from '@xyflow/react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PlusIcon, Trash, X } from 'lucide-react';
import { useState, useEffect, useContext } from 'react';
import { GreetingInput } from './greeting/greeting-input';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { NodeAction, NodeData } from '@/types/agent-types';
import { ActionConfig } from './actions/action-config';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DragContext } from '../drag-context';
import { OutcomeListItem } from './greeting/outcome-list-item';
import { OutcomeInput } from './greeting/outcome-input';

interface GreetingNodeProps {
  id: string;
  data: NodeData;
  isConnectable: boolean;
  xPos: number;
  yPos: number;
}

export function GreetingNode({ id, data, isConnectable, xPos, yPos }: GreetingNodeProps) {
  const { isDragging } = useContext(DragContext);
  const [greeting, setGreeting] = useState(data.greeting || "Hello! How can I help you today?");
  const [actions, setActions] = useState<NodeAction[]>(data.actions || []);
  const [outcomes, setOutcomes] = useState<string[]>(data.outcomes || []);
  const [newOutcome, setNewOutcome] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showOutcomeDialog, setShowOutcomeDialog] = useState(false);
  const [showActions, setShowActions] = useState(false);

  useEffect(() => {
    setGreeting(data.greeting || "Hello! How can I help you today?");
    setActions(data.actions || []);
    setOutcomes(data.outcomes || []);
  }, [data]);

  const updateField = (field: string, value: any) => {
    data[field] = value;
  };

  const addAction = () => {
    const newAction: NodeAction = {
      type: 'sms',
      id: `action-${Date.now()}`,
      config: {}
    };
    const updatedActions = [...actions, newAction];
    setActions(updatedActions);
    updateField('actions', updatedActions);
  };

  const updateAction = (id: string, config: any) => {
    const updatedActions = actions.map(action =>
      action.id === id ? { ...action, config: config } : action
    );
    setActions(updatedActions);
    updateField('actions', updatedActions);
  };

  const deleteAction = (id: string) => {
    const updatedActions = actions.filter(action => action.id !== id);
    setActions(updatedActions);
    updateField('actions', updatedActions);
  };

  const addOutcome = () => {
    if (newOutcome.trim() !== '') {
      const updatedOutcomes = [...outcomes, newOutcome.trim()];
      setOutcomes(updatedOutcomes);
      updateField('outcomes', updatedOutcomes);
      setNewOutcome('');
      setShowOutcomeDialog(false);
    }
  };

  const editOutcome = (index: number) => {
    setEditingIndex(index);
    setNewOutcome(outcomes[index]);
    setShowOutcomeDialog(true);
  };

  const saveEdit = () => {
    if (editingIndex !== null && newOutcome.trim() !== '') {
      const updatedOutcomes = [...outcomes];
      updatedOutcomes[editingIndex] = newOutcome.trim();
      setOutcomes(updatedOutcomes);
      updateField('outcomes', updatedOutcomes);
      setNewOutcome('');
      setEditingIndex(null);
      setShowOutcomeDialog(false);
    }
  };

  const cancelEdit = () => {
    setNewOutcome('');
    setEditingIndex(null);
    setShowOutcomeDialog(false);
  };

  const deleteOutcome = (index: number) => {
    const updatedOutcomes = outcomes.filter((_, i) => i !== index);
    setOutcomes(updatedOutcomes);
    updateField('outcomes', updatedOutcomes);
  };

  return (
    <div className="shadow-md rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div className="drag-handle rounded-t-lg bg-gray-100 dark:bg-gray-700 py-2 px-3 text-sm font-medium text-gray-700 dark:text-gray-300">
        Greeting Node
      </div>

      <div className="p-4">
        <div className="mb-4">
          <Label htmlFor="greeting" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Greeting Message</Label>
          <GreetingInput
            id="greeting"
            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-gray-200"
            value={greeting}
            onChange={(e) => {
              setGreeting(e.target.value);
              updateField('greeting', e.target.value);
            }}
          />
        </div>

        <Collapsible open={showActions} onOpenChange={setShowActions}>
          <CollapsibleTrigger className="w-full text-left rounded-md border border-gray-300 dark:border-gray-600 shadow-sm p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800 dark:bg-gray-700 dark:text-gray-200">
            <div className="flex items-center justify-between">
              <span>Actions</span>
              {showActions ? <X className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 space-y-2">
            {actions.map((action, index) => (
              <ActionConfig
                key={action.id}
                action={action}
                onChange={updateAction}
                onDelete={deleteAction}
              />
            ))}
            <Button variant="outline" size="sm" className="w-full justify-center" onClick={addAction}>
              Add Action
            </Button>
          </CollapsibleContent>
        </Collapsible>

        <div className="mt-4">
          <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Outcomes</Label>
          <ul className="mt-2 space-y-2">
            {outcomes.map((outcome, index) => (
              <OutcomeListItem
                key={index}
                index={index}
                outcome={outcome}
                onEdit={editOutcome}
                onDelete={deleteOutcome}
              />
            ))}
          </ul>
          <Button variant="outline" size="sm" className="w-full justify-center mt-2" onClick={() => setShowOutcomeDialog(true)}>
            Add Outcome
          </Button>
        </div>
      </div>

      <Handle type="source" position={Position.Right} id="a" isConnectable={isConnectable} />

      {/* Outcome Dialog */}
      <Dialog open={showOutcomeDialog} onOpenChange={setShowOutcomeDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? 'Edit Outcome' : 'Add New Outcome'}</DialogTitle>
            <DialogDescription>
              Create outcomes that represent user responses to your message. These become branching paths in your conversation flow.
              <span className="block mt-1">The AI is smart enough to recognize similar responses, so you don't need to create multiple outcomes for the same intent.</span>
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
              
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-lg text-xs">
                <p className="font-semibold text-blue-600 dark:text-blue-400 mb-1">💡 Remember:</p>
                <p className="text-gray-700 dark:text-gray-300">
                  One outcome covers similar responses. For example, "I'm interested in pricing" will also match "Tell me about your prices" or "How much does it cost?" — you don't need separate outcomes for these variations.
                </p>
              </div>
              
              <Input 
                value={newOutcome} 
                onChange={e => setNewOutcome(e.target.value)} 
                placeholder="Enter a detailed potential response..." 
                className="text-sm" 
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
              <Button 
                className="bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white" 
                onClick={() => editingIndex !== null ? saveEdit() : addOutcome()}
                disabled={!newOutcome.trim() || newOutcome.trim().length < 5}
              >
                {editingIndex !== null ? 'Save Changes' : 'Add Outcome'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
