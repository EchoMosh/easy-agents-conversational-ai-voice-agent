
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
    <div className="group relative flex items-center gap-2 animate-fade-in">
      <div className="flex-1 backdrop-blur-xl bg-white/10 rounded-xl py-2.5 px-4 text-sm border border-white/20 text-white/90 shadow-lg hover:shadow-xl transition-all duration-300">
        {outcome}
      </div>
      <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 bg-white/10 backdrop-blur-xl shadow-lg hover:text-blue-300 hover:bg-white/20 rounded-lg"
          onClick={() => onEdit(index)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 bg-white/10 backdrop-blur-xl shadow-lg hover:text-red-300 hover:bg-white/20 rounded-lg"
          onClick={() => onRemove(index)}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id={`outcome-${index}`}
        className="w-2 h-4 !bg-white/50 rounded-sm border-none !right-0 translate-x-[250%] transition-all duration-300 hover:!bg-white/70"
      />
    </div>
  );
}
