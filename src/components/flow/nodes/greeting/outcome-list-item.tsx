
import { Handle, Position } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Pencil, X } from 'lucide-react';

interface OutcomeListItemProps {
  outcome: string;
  index: number;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
}

export function OutcomeListItem({ outcome, index, onEdit, onRemove }: OutcomeListItemProps) {
  return (
    <div className="group relative flex items-center gap-2">
      <div className="flex-1 bg-white/80 dark:bg-gray-900/50 rounded-lg py-2 px-3 text-sm border border-blue-100/50 dark:border-blue-800/50 shadow-sm">
        {outcome}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 bg-white/80 dark:bg-gray-900/50 shadow-sm hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-md"
          onClick={() => onEdit(index)}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 bg-white/80 dark:bg-gray-900/50 shadow-sm hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-md"
          onClick={() => onRemove(index)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id={`outcome-${index}`}
        className="w-2 h-4 !bg-blue-400 rounded-sm border-none !right-[-10px]"
      />
    </div>
  );
}
