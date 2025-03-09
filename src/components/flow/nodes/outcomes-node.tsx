
import { useState, useEffect, useContext } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { NodeUpdateContext } from '@/components/flow/agent-flow/flow';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export function OutcomesNode({ id, data, selected, dragging }: any) {
  const { updateNodeData } = useContext(NodeUpdateContext);
  const [outcomes, setOutcomes] = useState<string[]>(data.outcomes || []);
  const [newOutcome, setNewOutcome] = useState<string>('');
  const [isEditing, setIsEditing] = useState<boolean>(false);

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
      handleAddOutcome();
    }
  };

  return (
    <div 
      className={cn(
        "relative px-4 pt-4 pb-3 border rounded-xl min-w-[240px] max-w-[400px] bg-white dark:bg-gray-950 text-foreground transition-all duration-200",
        selected ? "border-primary shadow-md dark:border-primary" : "border-gray-200 dark:border-gray-700",
        dragging ? "opacity-60" : "opacity-100"
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 -ml-1.5 rounded-full border-2 !bg-white dark:!bg-gray-950 border-gray-200 dark:border-gray-700"
      />
      
      {/* Title Bar */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-sm text-violet-600 dark:text-violet-400">Possible User Responses</h4>
      </div>

      {/* Title */}
      <div className="mb-3">
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
      <div className="space-y-2 mb-3">
        {outcomes.length === 0 ? (
          <div className="text-gray-500 text-sm italic py-1">No outcomes defined yet</div>
        ) : (
          <div className="space-y-2">
            {outcomes.map((outcome, index) => (
              <div key={index} className="flex justify-between items-center group relative">
                <div className="pl-1 py-1.5 pr-8 bg-violet-50 dark:bg-violet-950/30 rounded-lg text-sm flex-grow">
                  {outcome}
                </div>
                <button 
                  onClick={() => handleRemoveOutcome(index)}
                  className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Outcome Form */}
      {isEditing ? (
        <div className="mb-3">
          <div className="flex gap-2">
            <input
              autoFocus
              type="text"
              value={newOutcome}
              onChange={(e) => setNewOutcome(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter possible user response..."
              className="flex-grow text-sm p-2 border rounded-md dark:bg-gray-900 dark:border-gray-700"
            />
            <Button size="sm" onClick={handleAddOutcome} className="bg-violet-600 hover:bg-violet-700">
              Add
            </Button>
          </div>
        </div>
      ) : (
        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mb-3 border-dashed text-gray-500 hover:text-violet-700"
          onClick={() => setIsEditing(true)}
        >
          <Plus size={16} className="mr-1" /> Add Possible Response
        </Button>
      )}

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 -mr-1.5 rounded-full border-2 !bg-white dark:!bg-gray-950 border-gray-200 dark:border-gray-700"
      />
    </div>
  );
}
