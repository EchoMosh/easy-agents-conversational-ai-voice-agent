
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface GreetingInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function GreetingInput({ value, onChange }: GreetingInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-xs font-medium text-blue-600/75 dark:text-blue-300/75">
        Message
      </Label>
      <Textarea 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="nodrag text-sm resize-y min-h-[80px] bg-white/80 dark:bg-gray-900/50 border-blue-100/50 dark:border-blue-800/50 shadow-sm rounded-lg focus-visible:ring-blue-500/50 focus-visible:border-blue-200"
        placeholder="Type your greeting message..."
      />
    </div>
  );
}
