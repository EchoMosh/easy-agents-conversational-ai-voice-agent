
import { Label } from '@/components/ui/label';
import { VariableSelector } from '../variable-mention/variable-selector';
import { useRef, useState, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface GreetingInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function GreetingInput({ value, onChange }: GreetingInputProps) {
  const [showVariableSelector, setShowVariableSelector] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [currentValue, setCurrentValue] = useState(value);
  const [displayValue, setDisplayValue] = useState<React.ReactNode[]>([]);

  // Update local value when prop value changes
  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  // Render the highlighted variables whenever the value changes
  useEffect(() => {
    renderHighlightedVariables(currentValue);
  }, [currentValue]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    // Don't allow changes when variable selector is open
    if (showVariableSelector) return;
    
    const newValue = e.target.value;
    setCurrentValue(newValue);
    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Don't allow keyboard input when variable selector is open
    if (showVariableSelector) {
      e.stopPropagation();
      return;
    }
    
    // Check for @ key press
    if (e.key === '@') {
      e.preventDefault(); // Prevent default behavior
      
      // Insert the @ character manually since we're preventing default
      const start = e.currentTarget.selectionStart;
      const end = e.currentTarget.selectionEnd;
      const newText = currentValue.substring(0, start) + '@' + currentValue.substring(end);
      
      setCurrentValue(newText);
      onChange(newText);
      
      // Update cursor position after adding @
      setTimeout(() => {
        if (textareaRef.current) {
          const newPosition = start + 1;
          textareaRef.current.selectionStart = newPosition;
          textareaRef.current.selectionEnd = newPosition;
        }
      }, 0);
      
      setShowVariableSelector(true);
    }
  };

  const handleVariableSelect = (variableId: string) => {
    if (textareaRef.current) {
      const startPos = textareaRef.current.selectionStart;
      const endPos = textareaRef.current.selectionEnd;
      
      // Find the position of the last @ character
      const textBeforeCursor = currentValue.substring(0, startPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');
      
      if (lastAtIndex !== -1) {
        // Remove the @ that triggered the selector
        const textBeforeAt = currentValue.substring(0, lastAtIndex);
        const textAfterCursor = currentValue.substring(endPos);
        
        // Insert the variable placeholder
        const newText = `${textBeforeAt}{{${variableId}}}${textAfterCursor}`;
        
        setCurrentValue(newText);
        onChange(newText);
        
        // Focus back on textarea after selection
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            const newCursorPos = textBeforeAt.length + variableId.length + 4; // +4 for the {{}}
            textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          }
        }, 0);
      }
    }
    setShowVariableSelector(false);
  };

  // Function to highlight variables in the text
  const renderHighlightedVariables = (text: string) => {
    if (!text) {
      setDisplayValue([]);
      return;
    }

    const variableRegex = /\{\{([^}]+)\}\}/g;
    let lastIndex = 0;
    const rendered: React.ReactNode[] = [];
    let match;

    while ((match = variableRegex.exec(text)) !== null) {
      // Add text before the variable
      if (match.index > lastIndex) {
        rendered.push(text.substring(lastIndex, match.index));
      }

      // Add the variable with highlighting
      const variableName = match[1];
      rendered.push(
        <span 
          key={match.index} 
          className="inline-block px-1 py-0.5 rounded text-indigo-700 bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-900/30 font-medium text-sm"
        >
          {`{{${variableName}}}`}
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add any remaining text after the last variable
    if (lastIndex < text.length) {
      rendered.push(text.substring(lastIndex));
    }

    setDisplayValue(rendered);
  };

  return (
    <div className="flex flex-col gap-2 relative">
      <div className="relative nodrag" onMouseDown={(e) => e.stopPropagation()}>
        {displayValue.length > 0 && (
          <div 
            className={cn(
              "w-full p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg min-h-[100px] break-words whitespace-pre-wrap",
              showVariableSelector ? "opacity-50" : ""
            )}
            style={{ 
              position: "absolute", 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              pointerEvents: "none",
              backgroundColor: "transparent", 
              zIndex: 2,
              padding: "0.5rem"
            }}
          >
            {displayValue}
          </div>
        )}
        <Textarea
          ref={textareaRef}
          value={currentValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type @ to insert a variable..."
          className={cn(
            "w-full p-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white/50 dark:bg-gray-800/50 focus:ring-1 focus:ring-blue-400 dark:focus:ring-blue-600 focus:border-blue-400 dark:focus:border-blue-600 resize-y min-h-[100px] nodrag",
            displayValue.length > 0 ? "bg-transparent" : ""
          )}
          style={{
            caretColor: "black",
            color: displayValue.length > 0 ? "transparent" : "inherit",
            position: "relative",
            zIndex: 1
          }}
          disabled={showVariableSelector}
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
