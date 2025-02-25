
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
      '<span class="bg-white/40 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded-md shadow-sm backdrop-blur-sm font-medium">{{$1}}</span>'
    );
  };

  return (
    <div className="flex flex-col gap-2 relative">
      <Label className="text-sm font-medium text-white/70">
        Message
      </Label>
      <div className="relative">
        <Textarea 
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="nodrag text-sm resize-y min-h-[100px] bg-white/10 border-white/20 shadow-lg backdrop-blur-xl rounded-xl focus-visible:ring-white/30 focus-visible:border-white/30"
          placeholder="Type @ to insert a variable..."
          style={{ color: 'transparent', caretColor: 'white' }}
        />
        <div 
          className="absolute inset-0 pointer-events-none p-[9px] text-sm whitespace-pre-wrap break-words text-white/90"
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
