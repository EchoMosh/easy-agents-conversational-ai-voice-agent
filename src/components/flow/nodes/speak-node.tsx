
import { Handle, Position } from '@xyflow/react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, X, Pencil, MessageSquare } from 'lucide-react';
import { useState, useRef, useEffect, useContext, memo, useMemo } from 'react';
import { VariableSelector } from './variable-mention/variable-selector';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { NodeUpdateContext } from '@/components/flow/agent-flow/flow';
import { useDebounce } from '@/hooks/use-debounce';

type SpeakNodeData = {
  message?: string;
  outcomes?: string[];
};

// Memoized message input component to reduce re-renders
const MessageInput = memo(({ 
  message, 
  onChange, 
  textareaRef 
}: { 
  message: string; 
  onChange: (value: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}) => {
  // Format message to highlight variables
  const highlightVariables = (text: string) => {
    return text.replace(
      /{{([^}]+)}}/g,
      '<span class="bg-indigo-100/40 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded-md shadow-sm backdrop-blur-sm font-medium">{{$1}}</span>'
    );
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  // Use debounced version for the highlighted HTML to reduce processing on each keystroke
  const debouncedMessage = useDebounce(message, 50);
  
  // Memoize the highlighted HTML to prevent recalculation on every render
  const highlightedHtml = useMemo(() => {
    return highlightVariables(debouncedMessage)
      .split('\n')
      .map(line => line || '&#8203;')
      .join('<br/>');
  }, [debouncedMessage]);

  return (
    <div className="flex flex-col gap-2 relative">
      <div className="relative">
        <Textarea 
          ref={textareaRef}
          value={message}
          onChange={handleTextareaChange}
          className="nodrag text-sm resize-y min-h-[100px] bg-indigo-50/10 border-indigo-100/20 shadow-lg backdrop-blur-xl rounded-xl focus-visible:ring-indigo-300/30 focus-visible:border-indigo-300/30"
          placeholder="Type @ to insert a variable..."
          style={{ color: 'transparent', caretColor: '#6366f1' }}
        />
        <div 
          className="absolute inset-0 pointer-events-none p-[9px] text-sm whitespace-pre-wrap break-words text-gray-900 dark:text-white/90"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
      </div>
      
      <VariableSelector
        text={message}
        onTextChange={onChange}
        textareaRef={textareaRef}
      />
    </div>
  );
});

MessageInput.displayName = 'MessageInput';

// Memoized outcome item to reduce re-renders
const OutcomeItem = memo(({ 
  outcome, 
  index, 
  onRemove, 
  onEdit 
}: { 
  outcome: string; 
  index: number; 
  onRemove: (index: number) => void; 
  onEdit: (index: number) => void; 
}) => {
  return (
    <div className="group relative animate-fade-in">
      <div className="flex items-center gap-2">
        <div className="flex-1 backdrop-blur-sm bg-white/40 dark:bg-gray-900/40 rounded-xl py-2.5 px-4 text-sm border border-indigo-100/50 dark:border-indigo-800/50 shadow-sm">
          {outcome}
        </div>
        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 bg-white/80 dark:bg-gray-900/80 shadow-sm hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-lg"
            onClick={() => onEdit(index)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 bg-white/80 dark:bg-gray-900/80 shadow-sm hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg"
            onClick={() => onRemove(index)}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
        <Handle
          type="source"
          position={Position.Right}
          id={`outcome-${index}`}
          className="!w-2 !h-4 !bg-indigo-400 rounded-sm border-none !right-[-8px] transition-all duration-300 hover:!bg-indigo-500"
        />
      </div>
    </div>
  );
});

OutcomeItem.displayName = 'OutcomeItem';

// Main component with memo to prevent unnecessary re-renders
export const SpeakNode = memo(({ data, id }: { data: SpeakNodeData; id: string }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState<string>(data.message || "");
  const [showOutcomeDialog, setShowOutcomeDialog] = useState(false);
  const [newOutcome, setNewOutcome] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [outcomes, setOutcomes] = useState<string[]>(data.outcomes || []);
  
  // Get the updateNodeData function from context
  const { updateNodeData } = useContext(NodeUpdateContext);
  
  // Sync local state with props
  useEffect(() => {
    if (data.message !== undefined && data.message !== message) {
      setMessage(data.message);
    }
    
    if (data.outcomes && JSON.stringify(data.outcomes) !== JSON.stringify(outcomes)) {
      setOutcomes(data.outcomes);
    }
  }, [data, message, outcomes]);

  // Handle message change with debounced update to parent
  const handleMessageChange = (newValue: string) => {
    // Update local state immediately for optimistic UI
    setMessage(newValue);
    
    // Use a debounced update for the parent component
    const timeoutId = setTimeout(() => {
      // Build updated data object
      const updatedData = {
        ...data,
        message: newValue,
        outcomes: outcomes
      };
      
      // Update parent component
      updateNodeData(id, updatedData);
    }, 100);
    
    return () => clearTimeout(timeoutId);
  };

  const addOutcome = () => {
    if (outcomes.length >= 5) return;
    if (!newOutcome.trim()) return;
    
    const newOutcomes = [...outcomes, newOutcome];
    
    // Optimistic UI update
    setOutcomes(newOutcomes);
    setNewOutcome('');
    setShowOutcomeDialog(false);
    
    // Update parent
    const updatedData = {
      ...data,
      message: message,
      outcomes: newOutcomes
    };
    
    updateNodeData(id, updatedData);
  };

  const removeOutcome = (index: number) => {
    const newOutcomes = outcomes.filter((_, i) => i !== index);
    
    // Optimistic UI update
    setOutcomes(newOutcomes);
    
    // Update parent
    const updatedData = {
      ...data,
      message: message,
      outcomes: newOutcomes
    };
    
    updateNodeData(id, updatedData);
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
    
    // Optimistic UI update
    setOutcomes(updatedOutcomes);
    setEditingIndex(null);
    setNewOutcome('');
    setShowOutcomeDialog(false);
    
    // Update parent
    const updatedData = {
      ...data,
      message: message,
      outcomes: updatedOutcomes
    };
    
    updateNodeData(id, updatedData);
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

  return (
    <div className="group relative">
      {/* Glowing background effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Main container */}
      <div className="relative backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 rounded-2xl border border-indigo-200/50 dark:border-indigo-800/50 shadow-[0_8px_16px_-6px_rgba(79,70,229,0.2)] dark:shadow-[0_8px_16px_-6px_rgba(79,70,229,0.3)] p-5 min-w-[320px] transition-all duration-500 hover:translate-y-[-2px] hover:shadow-[0_20px_40px_-12px_rgba(79,70,229,0.4)] dark:hover:shadow-[0_20px_40px_-12px_rgba(79,70,229,0.5)]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="relative flex h-8 w-8 items-center justify-center">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-lg bg-indigo-400 opacity-20" />
            <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg">
              <MessageSquare className="h-4 w-4" />
            </span>
          </span>
          <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">Speak</span>
        </div>

        {/* Message input - using MessageInput component */}
        <div className="space-y-2 mb-6">
          <Label className="text-xs font-medium text-indigo-600/75 dark:text-indigo-300/75">
            Message
          </Label>
          <MessageInput 
            message={message} 
            onChange={handleMessageChange}
            textareaRef={textareaRef}
          />
        </div>

        {/* Outcomes section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-indigo-600/75 dark:text-indigo-300/75">
              Possible outcomes ({outcomes.length}/5)
            </Label>
            {outcomes.length < 5 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-900/50 rounded-lg"
                onClick={openNewOutcomeDialog}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Outcomes list */}
          <div className="space-y-2">
            {outcomes.map((outcome, index) => (
              <OutcomeItem 
                key={`${outcome}-${index}`}
                outcome={outcome}
                index={index}
                onRemove={removeOutcome}
                onEdit={startEditing}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Input handle */}
      <Handle 
        type="target" 
        position={Position.Left}
        className="!w-2 !h-4 !bg-indigo-400 rounded-sm border-none !left-[-8px] transition-all duration-300 hover:!bg-indigo-500"
      />
      
      {/* Default output handle */}
      {(!outcomes || outcomes.length === 0) && (
        <Handle
          type="source"
          position={Position.Right}
          id="default"
          className="!w-2 !h-4 !bg-indigo-400 rounded-sm border-none !right-[-8px] transition-all duration-300 hover:!bg-indigo-500"
        />
      )}

      {/* Outcome Dialog */}
      <Dialog open={showOutcomeDialog} onOpenChange={setShowOutcomeDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? 'Edit Outcome' : 'Add New Outcome'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              value={newOutcome}
              onChange={(e) => setNewOutcome(e.target.value)}
              placeholder="Enter possible response..."
              className="text-sm"
            />
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                onClick={cancelEdit}
              >
                Cancel
              </Button>
              <Button 
                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                onClick={() => editingIndex !== null ? saveEdit() : addOutcome()}
              >
                {editingIndex !== null ? 'Save Changes' : 'Add Outcome'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
});

SpeakNode.displayName = 'SpeakNode';
