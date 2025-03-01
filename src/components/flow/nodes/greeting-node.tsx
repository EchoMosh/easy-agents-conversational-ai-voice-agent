
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Label } from '@/components/ui/label';
import { useState, useEffect, useContext } from 'react';
import { GreetingInput } from './greeting/greeting-input';
import { NodeAction, NodeData } from '@/types/agent-types';
import { DragContext } from '../drag-context';
import { ActionsSection } from './greeting/actions-section';
import { OutcomesSection } from './greeting/outcomes-section';
import { OutcomeDialog } from './greeting/outcome-dialog';

// Separate the props interface from the component
interface GreetingNodeProps {
  id: string;
  data: NodeData;
  isConnectable: boolean;
}

export function GreetingNode({ id, data, isConnectable }: GreetingNodeProps) {
  // Use the correctly exported DragContext
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

  const handleSaveOutcome = () => {
    if (editingIndex !== null) {
      saveEdit();
    } else {
      addOutcome();
    }
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
            value={greeting}
            onChange={(value) => {
              setGreeting(value);
              updateField('greeting', value);
            }}
          />
        </div>

        <ActionsSection 
          actions={actions}
          showActions={showActions}
          setShowActions={setShowActions}
          addAction={addAction}
          updateAction={updateAction}
          deleteAction={deleteAction}
        />

        <OutcomesSection 
          outcomes={outcomes}
          onEditOutcome={editOutcome}
          onDeleteOutcome={deleteOutcome}
          onAddOutcome={() => setShowOutcomeDialog(true)}
        />
      </div>

      <Handle type="source" position={Position.Right} id="a" isConnectable={isConnectable} />

      <OutcomeDialog 
        showDialog={showOutcomeDialog}
        setShowDialog={setShowOutcomeDialog}
        newOutcome={newOutcome}
        setNewOutcome={setNewOutcome}
        isEditing={editingIndex !== null}
        onSave={handleSaveOutcome}
        onCancel={cancelEdit}
      />
    </div>
  );
}
