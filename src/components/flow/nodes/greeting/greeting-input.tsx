
import { Label } from '@/components/ui/label';
import { VariableSelector } from '../variable-mention/variable-selector';
import { useRef, useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface GreetingInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function GreetingInput({ value, onChange }: GreetingInputProps) {
  const [showVariableSelector, setShowVariableSelector] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [currentValue, setCurrentValue] = useState(value);

  // Update local value when prop value changes
  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setCurrentValue(newValue);
    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Check for @ key press
    if (e.key === '@') {
      setShowVariableSelector(true);
    }
  };

  const handleVariableSelect = (variableId: string) => {
    if (textareaRef.current) {
      const startPos = textareaRef.current.selectionStart;
      const endPos = textareaRef.current.selectionEnd;
      
      // Remove the @ that triggered the selector
      const textBeforeCursor = currentValue.substring(0, startPos - 1);
      const textAfterCursor = currentValue.substring(endPos);
      
      // Insert the variable placeholder
      const newText = `${textBeforeCursor}{{${variableId}}}${textAfterCursor}`;
      
      setCurrentValue(newText);
      onChange(newText);
      
      // Focus back on textarea after selection
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newCursorPos = textBeforeCursor.length + variableId.length + 4; // +4 for the {{}}
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
    }
    setShowVariableSelector(false);
  };

  return (
    <div className="flex flex-col gap-2 relative">
      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={currentValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type @ to insert a variable..."
          className="w-full p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-1 focus:ring-blue-400 dark:focus:ring-blue-600 focus:border-blue-400 dark:focus:border-blue-600 resize-y min-h-[100px]"
        />
      </div>
      
      {showVariableSelector && (
        <VariableSelector
          text={currentValue}
          onTextChange={(newText) => {
            setCurrentValue(newText);
            onChange(newText);
          }}
          onSelectVariable={handleVariableSelect}
          textareaRef={textareaRef}
          onClose={() => setShowVariableSelector(false)}
        />
      )}
    </div>
  );
}
