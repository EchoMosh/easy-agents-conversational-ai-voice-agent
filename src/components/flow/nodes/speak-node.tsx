import { Handle, Position } from '@xyflow/react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, X, Pencil, MessageCircle } from 'lucide-react';
import { useState, useRef } from 'react';
import { VariableSelector } from './variable-mention/variable-selector';

type SpeakNodeData = {
  message: string;
  outcomes?: string[];
};

export function SpeakNode({ data }: { data: SpeakNodeData; id: string }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState(data.message);
  const [showOutcomeInput, setShowOutcomeInput] = useState(false);
  const [newOutcome, setNewOutcome] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
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

  const highlightVariables = (text: string) => {
    return text.replace(
      /{{([^}]+)}}/g,
      '<span class="bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 px-1 rounded">{{$1}}</span>'
    );
  };

  return (
    <div className="relative group bg-gradient-to-br from-purple-50/90 to-white dark:from-gray-900 dark:to-gray-800 rounded-xl border border-purple-100/50 dark:border-gray-700/50 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.5),0_2px_4px_-2px_rgba(0,0,0,0.25)] backdrop-blur-xl p-4 min-w-[320px] transition-all duration-300 bg-[length:200%_200%] animate-breathing hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.3)] dark:hover:shadow-[0_0_30px_-5px_rgba(168,85,247,0.2)] hover:translate-y-[-2px] hover:z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.02] to-transparent dark:from-purple-500/[0.05] rounded-xl pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100" />
      <div className="fixed inset-[-200%] -z-10 bg-purple-500/5 dark:bg-purple-400/5 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-2 h-4 !bg-purple-400 rounded-sm border-none transition-all duration-300 hover:!bg-purple-500" 
      />
      
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-3 border-b border-purple-100/50 dark:border-gray-700/50">
          <span className="text-purple-500 dark:text-purple-400 bg-purple-100/50 dark:bg-purple-900/50 p-1.5 rounded-md">
            <MessageCircle className="h-4 w-4" />
          </span>
          <span className="font-medium text-purple-700 dark:text-purple-300">Speak</span>
        </div>

        <div className="flex flex-col gap-2">
          <Label className="text-xs font-medium text-purple-600/75 dark:text-purple-300/75">
            Message
          </Label>
          <div className="relative">
            <Textarea 
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="nodrag text-sm resize-y min-h-[80px] bg-transparent border-purple-100/50 dark:border-purple-800/50 shadow-sm rounded-lg focus-visible:ring-purple-500/50 focus-visible:border-purple-200 text-transparent caret-gray-900 dark:caret-white"
              placeholder="Type @ to insert a variable..."
            />
            <div 
              className="absolute inset-0 pointer-events-none p-[9px] text-sm whitespace-pre-wrap text-gray-900 dark:text-white"
              dangerouslySetInnerHTML={{ 
                __html: highlightVariables(message)
                  .split('\n')
                  .map(line => line || '&#8203;')
                  .join('<br/>') 
              }}
            />
          </div>
          <VariableSelector
            text={message}
            onTextChange={setMessage}
            textareaRef={textareaRef}
          />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-purple-600/75 dark:text-purple-300/75">
              Possible outcomes ({outcomes.length}/5)
            </Label>
            {!showOutcomeInput && outcomes.length < 5 && !editingIndex && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-300 dark:hover:bg-purple-900/50 rounded-md"
                onClick={() => setShowOutcomeInput(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>

          {(showOutcomeInput || editingIndex !== null) && (
            <div className="flex gap-3 bg-purple-50/30 dark:bg-purple-900/10 p-4 rounded-lg border border-purple-100/50 dark:border-purple-800/50">
              <Textarea
                value={newOutcome}
                onChange={(e) => setNewOutcome(e.target.value)}
                placeholder="Enter possible response..."
                className="nodrag text-sm resize-none min-h-[80px] bg-white/80 dark:bg-gray-900/80 border-purple-100/50 dark:border-purple-800/50"
              />
              <div className="flex flex-col gap-2">
                <Button 
                  size="sm" 
                  className="px-4 bg-purple-500 hover:bg-purple-600 text-white shadow-md"
                  onClick={() => editingIndex !== null ? saveEdit() : addOutcome()}
                >
                  {editingIndex !== null ? 'Save' : 'Add'}
                </Button>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="px-4 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-300 dark:hover:bg-purple-900/50"
                  onClick={cancelEdit}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-2.5">
            {outcomes.map((outcome, index) => (
              <div key={index} className="group relative">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white/80 dark:bg-gray-900/50 rounded-lg py-2 px-3 text-sm border border-purple-100/50 dark:border-purple-800/50 shadow-sm">
                    {outcome}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 bg-white/80 dark:bg-gray-900/50 shadow-sm hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/50 rounded-md"
                      onClick={() => startEditing(index)}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 bg-white/80 dark:bg-gray-900/50 shadow-sm hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-md"
                      onClick={() => removeOutcome(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                  <Handle
                    type="source"
                    position={Position.Right}
                    id={`outcome-${index}`}
                    className="w-2 h-4 !bg-purple-400 rounded-sm border-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {(!outcomes || outcomes.length === 0) && (
        <Handle
          type="source"
          position={Position.Right}
          id="default"
          className="w-2 h-4 !bg-purple-400 rounded-sm border-none"
        />
      )}
      
      <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-purple-500/[0.03] pointer-events-none" />
    </div>
  );
}
