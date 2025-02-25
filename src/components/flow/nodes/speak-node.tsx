
import { Handle, Position } from '@xyflow/react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, X, Pencil, MessageCircle } from 'lucide-react';
import { useState } from 'react';

type SpeakNodeData = {
  message: string;
  outcomes?: string[];
};

export function SpeakNode({ data }: { data: SpeakNodeData; id: string }) {
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

  return (
    <div className="relative group bg-gradient-to-br from-purple-50/90 to-white dark:from-gray-900 dark:to-gray-800 rounded-xl border border-purple-100/50 dark:border-gray-700/50 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.5),0_2px_4px_-2px_rgba(0,0,0,0.25)] backdrop-blur-xl p-4 min-w-[320px]">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.02] to-transparent dark:from-purple-500/[0.05] rounded-xl pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100" />
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
          <Textarea 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="nodrag text-sm resize-y min-h-[80px] bg-white/80 dark:bg-gray-900/50 border-purple-100/50 dark:border-purple-800/50 shadow-sm rounded-lg focus-visible:ring-purple-500/50 focus-visible:border-purple-200"
            placeholder="Type your message..."
          />
        </div>

        {/* Optional outcomes section */}
        {outcomes.length > 0 && (
          <div className="space-y-2">
            {outcomes.map((outcome, index) => (
              <div key={index} className="group relative">
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white/80 dark:bg-gray-900/50 rounded-lg py-2 px-3 text-sm border border-purple-100/50 dark:border-purple-800/50 shadow-sm">
                    {outcome}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 dark:bg-gray-900/50 shadow-sm hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-md"
                    onClick={() => removeOutcome(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
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
        )}

        {/* Add default handle if no outcomes */}
        {(!outcomes || outcomes.length === 0) && (
          <Handle
            type="source"
            position={Position.Right}
            id="default"
            className="w-2 h-4 !bg-purple-400 rounded-sm border-none"
          />
        )}
      </div>
      
      <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-purple-500/[0.03] pointer-events-none" />
    </div>
  );
}
