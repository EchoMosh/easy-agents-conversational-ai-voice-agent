
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface OutcomeInputProps {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  isEditing: boolean;
}

export function OutcomeInput({ value, onChange, onSave, onCancel, isEditing }: OutcomeInputProps) {
  return (
    <div className="flex gap-3 bg-blue-50/30 dark:bg-blue-900/10 p-4 rounded-lg border border-blue-100/50 dark:border-blue-800/50">
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter possible response..."
        className="nodrag text-sm resize-none min-h-[80px] bg-white/80 dark:bg-gray-900/80 border-blue-100/50 dark:border-blue-800/50"
      />
      <div className="flex flex-col gap-2">
        <Button 
          size="sm" 
          className="px-4 bg-blue-500 hover:bg-blue-600 text-white shadow-md"
          onClick={onSave}
        >
          {isEditing ? 'Save' : 'Add'}
        </Button>
        <Button 
          size="sm" 
          variant="ghost" 
          className="px-4 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-300 dark:hover:bg-blue-900/50"
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
