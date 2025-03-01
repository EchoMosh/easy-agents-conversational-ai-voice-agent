
import { useState } from 'react';
import { LexicalEditor, INSERT_VARIABLE_COMMAND } from '@/components/editor/LexicalEditor';
import { VariableSelector } from '../variable-mention/variable-selector';

interface GreetingInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function GreetingInput({ value, onChange }: GreetingInputProps) {
  const [showVariableSelector, setShowVariableSelector] = useState(false);

  const handleChange = (newValue: string) => {
    console.log("GreetingInput change:", newValue);
    onChange(newValue);
  };

  const handleAtMention = () => {
    setShowVariableSelector(true);
  };

  const handleVariableSelect = (variableId: string) => {
    // Since our editor is simplified, we won't implement variable insertion yet
    // We can add this functionality later
    console.log("Variable selected:", variableId);
    setShowVariableSelector(false);
  };

  return (
    <div className="flex flex-col gap-2 relative">
      <div className="relative">
        <LexicalEditor
          value={value}
          onChange={handleChange}
          placeholder="Type @ to insert a variable..."
          className="text-sm resize-y min-h-[100px] bg-white/10 border-white/20 shadow-lg backdrop-blur-xl rounded-xl focus-visible:ring-white/30 focus-visible:border-white/30"
          onAtMention={handleAtMention}
        />
      </div>
      
      {showVariableSelector && (
        <VariableSelector
          text={value}
          onTextChange={() => {}} // No-op as it's handled by editor
          onSelectVariable={handleVariableSelect}
          textareaRef={null}
          onClose={() => setShowVariableSelector(false)}
        />
      )}
    </div>
  );
}
