import { Handle, Position } from '@xyflow/react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, Pencil, X, Send, AlertTriangle, Webhook, Mail } from 'lucide-react';
import { useState, useEffect, useContext } from 'react';
import { GreetingInput } from './greeting/greeting-input';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { NodeAction, NodeData } from '@/types/agent-types';
import { ActionConfig } from './actions/action-config';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { NodeUpdateContext } from '@/components/flow/agent-flow/flow';
type GreetingNodeData = {
  greeting: string;
  outcomes?: string[];
  actions?: NodeAction[];
};
export function GreetingNode({
  data,
  id
}: {
  data: GreetingNodeData;
  id: string;
}) {
  const {
    updateNodeData
  } = useContext(NodeUpdateContext);
  const [showOutcomeDialog, setShowOutcomeDialog] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [newOutcome, setNewOutcome] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [greeting, setGreeting] = useState(data.greeting);
  const [outcomes, setOutcomes] = useState(data.outcomes || []);
  const [actions, setActions] = useState<NodeAction[]>(data.actions || []);
  const [selectedActionType, setSelectedActionType] = useState<'sms' | 'webhook' | 'email'>('sms');
  const [editingAction, setEditingAction] = useState<NodeAction | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);

  // Sync with data when it changes from the parent
  useEffect(() => {
    setOutcomes(data.outcomes || []);
    setActions(data.actions || []);
  }, [data.outcomes, data.actions]);

  // Send update event when greeting changes
  useEffect(() => {
    // Only trigger update if the greeting has actually changed from the initial data
    if (greeting !== data.greeting) {
      console.log("Emitting node update for greeting change:", greeting);
      updateNodeData(id, {
        ...data,
        greeting
      });
    }
  }, [greeting, id, data, updateNodeData]);
  const addOutcome = () => {
    if (outcomes.length >= 5) return;
    if (!newOutcome.trim()) return;
    const newOutcomes = [...outcomes, newOutcome];
    setOutcomes(newOutcomes);
    setNewOutcome('');
    setShowOutcomeDialog(false);

    // Send update event with new outcomes
    updateNodeData(id, {
      ...data,
      outcomes: newOutcomes
    });
  };
  const removeOutcome = (index: number) => {
    const newOutcomes = outcomes.filter((_, i) => i !== index);
    setOutcomes(newOutcomes);

    // Send update event with remaining outcomes
    updateNodeData(id, {
      ...data,
      outcomes: newOutcomes
    });
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
  const openNewOutcomeDialog = () => {
    setEditingIndex(null);
    setNewOutcome('');
    setShowOutcomeDialog(true);
  };
  const handleGreetingChange = (value: string) => {
    setGreeting(value);
  };

  // Action handling
  const addAction = () => {
    const newAction: NodeAction = {
      id: `action-${Date.now()}`,
      type: selectedActionType,
      config: {}
    };

    // Default configs based on action type
    if (selectedActionType === 'sms') {
      newAction.config = {
        phoneNumber: '',
        message: ''
      };
    } else if (selectedActionType === 'webhook') {
      newAction.config = {
        url: '',
        method: 'POST',
        payload: '{}'
      };
    } else if (selectedActionType === 'email') {
      newAction.config = {
        to: '',
        subject: '',
        message: ''
      };
    }
    setEditingAction(newAction);
    setShowActionDialog(true);
  };
  const saveAction = () => {
    if (!editingAction) return;
    const updatedActions = editingAction.id ? actions.map(a => a.id === editingAction.id ? editingAction : a) : [...actions, editingAction];
    setActions(updatedActions);
    setEditingAction(null);
    setShowActionDialog(false);

    // Update node data
    updateNodeData(id, {
      ...data,
      actions: updatedActions
    });
  };
  const editAction = (action: NodeAction) => {
    setEditingAction(action);
    setSelectedActionType(action.type);
    setShowActionDialog(true);
  };
  const removeAction = (actionId: string) => {
    const newActions = actions.filter(a => a.id !== actionId);
    setActions(newActions);

    // Update node data
    updateNodeData(id, {
      ...data,
      actions: newActions
    });
  };
  const getActionIcon = (type: string) => {
    switch (type) {
      case 'sms':
        return <Send className="h-3.5 w-3.5" />;
      case 'webhook':
        return <Webhook className="h-3.5 w-3.5" />;
      case 'email':
        return <Mail className="h-3.5 w-3.5" />;
      default:
        return <AlertTriangle className="h-3.5 w-3.5" />;
    }
  };
  const getActionLabel = (action: NodeAction) => {
    switch (action.type) {
      case 'sms':
        return `SMS to ${action.config.phoneNumber || 'unknown'}`;
      case 'webhook':
        return `${action.config.method || 'POST'} ${action.config.url || 'unknown'}`;
      case 'email':
        return `Email to ${action.config.to || 'unknown'}`;
      default:
        return 'Unknown action';
    }
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

        {/* Actions content - only shown when actionsOpen is true */}
        <Collapsible open={actionsOpen} onOpenChange={setActionsOpen}>
          <CollapsibleContent className="bg-white/50 dark:bg-gray-900/50 space-y-3 border border-blue-100/50 dark:border-blue-800/30 rounded-xl p-4 mb-4">
            {actions.length === 0 ? <p className="text-xs text-gray-500 dark:text-gray-400 italic">No actions configured</p> : <div className="space-y-2">
                {actions.map(action => <div key={action.id} className="group/action relative flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-2 shadow-sm border border-blue-100/30 dark:border-blue-800/30">
                    <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                      {getActionIcon(action.type)}
                    </div>
                    <div className="flex-1 text-xs truncate">
                      {getActionLabel(action)}
                    </div>
                    <div className="flex opacity-0 group-hover/action:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => editAction(action)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => removeAction(action.id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>)}
              </div>}
            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={addAction} className="text-xs h-7 bg-blue-50/70 dark:bg-blue-900/20 border-blue-200/50 dark:border-blue-800/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100/70 dark:hover:bg-blue-900/40">
                <Plus className="h-3 w-3 mr-1" /> Add Action
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>

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

      {/* Floating Actions Button - Positioned outside and below the main container */}
      <Collapsible open={actionsOpen} onOpenChange={setActionsOpen} className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-10">
        <CollapsibleTrigger className="flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors shadow-md rounded-full border border-blue-200/50 dark:border-blue-800/50 my-[9px]">
          <Send className="h-3 w-3 text-blue-600/80 dark:text-blue-400/80" />
          <span className="text-xs font-medium text-blue-600/80 dark:text-blue-400/80">
            Actions {actionsOpen ? "−" : "+"}
          </span>
        </CollapsibleTrigger>
      </Collapsible>

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

      {/* Action Dialog */}
      <Dialog open={showActionDialog} onOpenChange={open => {
      setShowActionDialog(open);
      if (!open) setEditingAction(null);
    }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>{editingAction?.id ? 'Edit Action' : 'Add New Action'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {!editingAction?.id && <div className="mb-4">
                <Label className="text-sm mb-2 block">Action Type</Label>
                <div className="flex gap-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant={selectedActionType === 'sms' ? 'default' : 'outline'} className={`flex-1 ${selectedActionType === 'sms' ? 'bg-blue-500' : ''}`} onClick={() => setSelectedActionType('sms')}>
                          <Send className="h-4 w-4 mr-2" /> SMS
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Send SMS messages</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant={selectedActionType === 'webhook' ? 'default' : 'outline'} className={`flex-1 ${selectedActionType === 'webhook' ? 'bg-violet-500' : ''}`} onClick={() => setSelectedActionType('webhook')}>
                          <Webhook className="h-4 w-4 mr-2" /> Webhook
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Call external webhooks</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant={selectedActionType === 'email' ? 'default' : 'outline'} className={`flex-1 ${selectedActionType === 'email' ? 'bg-green-500' : ''}`} onClick={() => setSelectedActionType('email')}>
                          <Mail className="h-4 w-4 mr-2" /> Email
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Send email messages</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>}

            {editingAction && <ActionConfig action={editingAction} onChange={updatedAction => setEditingAction(updatedAction)} />}

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowActionDialog(false)}>
                Cancel
              </Button>
              <Button className="bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white" onClick={saveAction}>
                {editingAction?.id ? 'Save Changes' : 'Add Action'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
}