
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VariableSelector } from '../variable-mention/variable-selector';
import { useRef } from 'react';

interface GreetingInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function GreetingInput({ value, onChange }: GreetingInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const highlightVariables = (text: string) => {
    return text.replace(
      /{{([^}]+)}}/g,
      '<span class="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 px-1 rounded">{{$1}}</span>'
    );
  };

  return (
    <div className="flex flex-col gap-2 relative">
      <Label className="text-xs font-medium text-blue-600/75 dark:text-blue-300/75">
        Message
      </Label>
      <div className="relative">
        <Textarea 
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="nodrag text-sm resize-y min-h-[80px] bg-white/80 dark:bg-gray-900/50 border-blue-100/50 dark:border-blue-800/50 shadow-sm rounded-lg focus-visible:ring-blue-500/50 focus-visible:border-blue-200"
          placeholder="Type @ to insert a variable..."
        />
        <div 
          className="absolute inset-0 pointer-events-none p-[9px] text-sm"
          dangerouslySetInnerHTML={{ 
            __html: highlightVariables(value)
              .split('\n')
              .map(line => line || '&#8203;')
              .join('<br/>') 
          }}
        />
      </div>
      <VariableSelector
        text={value}
        onTextChange={onChange}
        textareaRef={textareaRef}
      />
    </div>
  );
}
