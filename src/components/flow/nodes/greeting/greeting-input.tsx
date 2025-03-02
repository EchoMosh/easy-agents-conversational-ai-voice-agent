
import { Label } from '@/components/ui/label';
import { VariableSelector } from '../variable-mention/variable-selector';
import { useRef, useState } from 'react';
import { LexicalEditor, INSERT_VARIABLE_COMMAND } from '@/components/editor/LexicalEditor';
import { LexicalEditor as LexicalEditorType } from 'lexical';

interface GreetingInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function GreetingInput({ value, onChange }: GreetingInputProps) {
  const [showVariableSelector, setShowVariableSelector] = useState(false);
  const editorRef = useRef<LexicalEditorType | null>(null);

  const handleChange = (newValue: string) => {
    console.log("GreetingInput change:", newValue);
    onChange(newValue);
  };

  const handleAtMention = () => {
    setShowVariableSelector(true);
  };

  const handleVariableSelect = (variableId: string) => {
    if (editorRef.current) {
      editorRef.current.dispatchCommand(INSERT_VARIABLE_COMMAND, variableId);
    }
    setShowVariableSelector(false);
  };

  const containerStyle = {
    maxWidth: '250px', // Fixed width constraint
    width: '250px',
    minWidth: '0',
    overflow: 'hidden',
    flex: '1 1 auto'
  };

  const editorContainerStyle = {
    maxWidth: '100%', 
    width: '100%',
    minWidth: '0',
    overflow: 'hidden'
  };

  return (
    <div className="flex flex-col gap-2 relative" style={containerStyle}>
      <div className="relative" style={editorContainerStyle}>
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
          onTextChange={(newText) => {
            // This is now handled by the Lexical Editor directly
          }}
          onSelectVariable={handleVariableSelect}
          textareaRef={null} // We don't need this ref anymore
          onClose={() => setShowVariableSelector(false)}
        />
      )}
    </div>
  );
}
