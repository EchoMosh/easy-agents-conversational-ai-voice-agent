
import { Handle, Position } from '@xyflow/react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, MessageSquare, Pencil, X, Send, AlertTriangle, Webhook, Mail, MessageCirclePlus, List } from 'lucide-react';
import { useState, useEffect, useContext } from 'react';
import { GreetingInput } from './greeting/greeting-input';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { NodeAction, NodeData } from '@/types/agent-types';
import { ActionConfig } from './actions/action-config';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { NodeUpdateContext } from '@/components/flow/agent-flow/flow';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useReactFlow } from '@xyflow/react';

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
  const [showActionTypeDialog, setShowActionTypeDialog] = useState(false);
  const [showActionsListDialog, setShowActionsListDialog] = useState(false);
  const [newOutcome, setNewOutcome] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [greeting, setGreeting] = useState(data.greeting);
  const [outcomes, setOutcomes] = useState(data.outcomes || []);
  const [actions, setActions] = useState<NodeAction[]>(data.actions || []);
  const [selectedActionType, setSelectedActionType] = useState<'sms' | 'webhook' | 'email'>('sms');
  const [editingAction, setEditingAction] = useState<NodeAction | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const { getEdges, setEdges } = useReactFlow();

  useEffect(() => {
    setOutcomes(data.outcomes || []);
    setActions(data.actions || []);
  }, [data.outcomes, data.actions]);

  useEffect(() => {
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
    
    // First outcome is being added - remove any default edge
    if (outcomes.length === 0) {
      removeDefaultEdge();
    }
    
    const newOutcomes = [...outcomes, newOutcome];
    setOutcomes(newOutcomes);
    setNewOutcome('');
    setShowOutcomeDialog(false);

    updateNodeData(id, {
      ...data,
      outcomes: newOutcomes
    });
  };
  
  // Function to remove the default edge when outcomes are added
  const removeDefaultEdge = () => {
    const edges = getEdges();
    const defaultEdges = edges.filter(edge => 
      edge.source === id && edge.sourceHandle === 'default'
    );
    
    if (defaultEdges.length > 0) {
      console.log(`Removing default edge(s) from node ${id} as outcomes are being added`);
      const remainingEdges = edges.filter(edge => 
        !(edge.source === id && edge.sourceHandle === 'default')
      );
      setEdges(remainingEdges);
    }
  };
  
  const removeOutcome = (index: number) => {
    const newOutcomes = outcomes.filter((_, i) => i !== index);
    setOutcomes(newOutcomes);

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

  const openActionTypeDialog = () => {
    setShowActionTypeDialog(true);
  };

  const openActionsListDialog = () => {
    setShowActionsListDialog(true);
  };

  const selectActionType = (type: 'sms' | 'webhook' | 'email') => {
    setSelectedActionType(type);
    setShowActionTypeDialog(false);
    
    const newAction: NodeAction = {
      id: `action-${Date.now()}`,
      type: type,
      config: {}
    };

    if (type === 'sms') {
      newAction.config = {
        phoneNumber: '',
        message: ''
      };
    } else if (type === 'webhook') {
      newAction.config = {
        url: '',
        method: 'POST',
        payload: '{}'
      };
    } else if (type === 'email') {
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
    const updatedActions = editingAction.id ? 
      actions.map(a => a.id === editingAction.id ? editingAction : a) : 
      [...actions, editingAction];
    
    setActions(updatedActions);
    setEditingAction(null);
    setShowActionDialog(false);

    updateNodeData(id, {
      ...data,
      actions: updatedActions
    });
  };
  
  const editAction = (action: NodeAction) => {
    setEditingAction(action);
    setSelectedActionType(action.type);
    setShowActionDialog(true);
    setShowActionsListDialog(false);
  };
  
  const removeAction = (actionId: string) => {
    const newActions = actions.filter(a => a.id !== actionId);
    setActions(newActions);

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editingIndex !== null) {
        saveEdit();
      } else {
        addOutcome();
      }
    }
  };

  return <div className="group relative">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-sky-500/20 to-cyan-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 rounded-2xl border border-blue-200/50 dark:border-blue-800/50 shadow-[0_8px_16px_-6px_rgba(59,130,246,0.2)] dark:shadow-[0_8px_16px_-6px_rgba(59,130,246,0.3)] p-5 min-w-[320px] max-w-[320px] transition-all duration-500 hover:translate-y-[-2px] hover:shadow-[0_20px_40px_-12px_rgba(59,130,246,0.4)] dark:hover:shadow-[0_20px_40px_-12px_rgba(59,130,246,0.5)]">
        <div className="flex items-center gap-3 mb-4">
          <span className="relative flex h-8 w-8 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-lg bg-blue-400 opacity-20" />
            <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-sky-500 text-white shadow-lg">
              <MessageSquare className="h-4 w-4" />
            </span>
          </span>
          <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-sky-500">Speak</span>
        </div>

        <div className="space-y-2 mb-6">
          <Label className="text-xs font-medium text-blue-600/75 dark:text-blue-300/75">
            Message
          </Label>
          <GreetingInput value={greeting} onChange={handleGreetingChange} />
        </div>

        {outcomes.length > 0 && (
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
                    <div className="flex-1 backdrop-blur-sm bg-white/40 dark:bg-gray-900/40 rounded-xl py-2.5 px-4 text-sm border border-blue-100/50 dark:border-blue-800/50 shadow-sm text-gray-900 dark:text-white/90 overflow-hidden">
                      <div className="truncate">{outcome}</div>
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
        )}
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <Button 
          onClick={openActionsListDialog}
          className="flex items-center justify-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors shadow-md rounded-full border border-blue-200/50 dark:border-blue-800/50 my-[9px]"
        >
          <Send className="h-3 w-3 text-blue-600/80 dark:text-blue-400/80" />
          <span className="text-xs font-medium text-blue-600/80 dark:text-blue-400/80">
            Actions {actions.length > 0 && `(${actions.length})`}
          </span>
        </Button>
        
        <Button 
          onClick={openNewOutcomeDialog}
          className="flex items-center justify-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors shadow-md rounded-full border border-purple-200/50 dark:border-purple-800/50 my-[9px]"
        >
          <MessageCirclePlus className="h-3 w-3 text-purple-600/80 dark:text-purple-400/80" />
          <span className="text-xs font-medium text-purple-600/80 dark:text-purple-400/80">
            Add Outcome
          </span>
        </Button>
      </div>

      <Handle type="target" position={Position.Left} className="!w-2 !h-4 !bg-blue-400 rounded-sm border-none !left-[-8px] transition-all duration-300 hover:!bg-blue-500" />
      
      {(!outcomes || outcomes.length === 0) && <Handle type="source" position={Position.Right} id="default" className="!w-2 !h-4 !bg-blue-400 rounded-sm border-none !right-[-8px] transition-all duration-300 hover:!bg-blue-500" />}

      <Dialog open={showOutcomeDialog} onOpenChange={setShowOutcomeDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? 'Edit Outcome' : 'Add New Outcome'}</DialogTitle>
            <DialogDescription>
              Create outcomes that represent user responses to your message. These become branching paths in your conversation flow.
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

      <Dialog open={showActionsListDialog} onOpenChange={setShowActionsListDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <List className="h-4 w-4 text-blue-500" />
              <span>Actions for this Node</span>
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            {actions.length === 0 ? (
              <div className="text-center py-8 px-4">
                <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center mb-3">
                  <Send className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                </div>
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">No actions configured</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Actions will be executed when this node is triggered.
                </p>
                <Button 
                  onClick={() => {
                    setShowActionsListDialog(false);
                    openActionTypeDialog();
                  }} 
                  className="text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Your First Action
                </Button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                {actions.map(action => (
                  <div 
                    key={action.id} 
                    className="group relative flex items-center gap-3 bg-white dark:bg-gray-800/50 rounded-lg p-3 hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors border border-gray-100 dark:border-gray-800"
                  >
                    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md bg-gradient-to-br from-blue-500/10 to-sky-500/10 dark:from-blue-500/20 dark:to-sky-500/20 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-800/50">
                      {getActionIcon(action.type)}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{action.type.charAt(0).toUpperCase() + action.type.slice(1)}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[300px]">
                        {getActionLabel(action)}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-100 dark:hover:bg-blue-900/30" 
                        onClick={() => editAction(action)}
                      >
                        <Pencil className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-100 dark:hover:bg-red-900/30" 
                        onClick={() => removeAction(action.id)}
                      >
                        <X className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {actions.length > 0 && (
              <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-800">
                <Button 
                  onClick={() => {
                    setShowActionsListDialog(false);
                    openActionTypeDialog();
                  }} 
                  className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200/50 dark:border-blue-800/50"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Another Action
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showActionTypeDialog} onOpenChange={setShowActionTypeDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Select Action Type</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Button 
                onClick={() => selectActionType('sms')} 
                className="flex items-center justify-start gap-3 h-14 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                  <Send className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium">SMS Message</div>
                  <div className="text-xs text-blue-600/70 dark:text-blue-400/70">Send text messages to phones</div>
                </div>
              </Button>
              
              <Button 
                onClick={() => selectActionType('email')} 
                className="flex items-center justify-start gap-3 h-14 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/40 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800/50"
              >
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Email</div>
                  <div className="text-xs text-green-600/70 dark:text-green-400/70">Send emails to your customers</div>
                </div>
              </Button>
              
              <Button 
                onClick={() => selectActionType('webhook')} 
                className="flex items-center justify-start gap-3 h-14 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50"
              >
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center">
                  <Webhook className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Webhook</div>
                  <div className="text-xs text-purple-600/70 dark:text-purple-400/70">Call external services or APIs</div>
                </div>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showActionDialog} onOpenChange={open => {
      setShowActionDialog(open);
      if (!open) setEditingAction(null);
    }}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              {editingAction?.id ? 'Edit Action' : 'Add New Action'}
              {editingAction && <span className="ml-2 text-sm font-normal">
                ({editingAction.type === 'sms' ? 'SMS' : 
                  editingAction.type === 'email' ? 'Email' : 
                  editingAction.type === 'webhook' ? 'Webhook' : 'Unknown'})
              </span>}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
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
