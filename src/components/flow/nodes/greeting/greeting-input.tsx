
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VariableSelector } from '../variable-mention/variable-selector';
import { useRef, useEffect } from 'react';

interface GreetingInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function GreetingInput({ value, onChange }: GreetingInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Ensure textarea synchronizes with the value prop
  useEffect(() => {
    if (textareaRef.current && textareaRef.current.value !== value) {
      textareaRef.current.value = value;
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    console.log("GreetingInput change:", newValue);
    onChange(newValue);
  };

  const highlightVariables = (text: string) => {
    return text.replace(
      /{{([^}]+)}}/g,
      '<span class="bg-white/40 text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded-md shadow-sm backdrop-blur-sm font-medium">{{$1}}</span>'
    );
  };

  return (
    <div className="flex flex-col gap-2 relative">
      <div className="relative">
        <Textarea 
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          className="nodrag text-sm resize-y min-h-[100px] bg-white/10 border-white/20 shadow-lg backdrop-blur-xl rounded-xl focus-visible:ring-white/30 focus-visible:border-white/30"
          placeholder="Type @ to insert a variable..."
          style={{ color: 'transparent', caretColor: '#6366f1' }}
        />
        <div 
          className="absolute inset-0 pointer-events-none p-[9px] text-sm whitespace-pre-wrap break-words text-gray-900 dark:text-white/90"
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
