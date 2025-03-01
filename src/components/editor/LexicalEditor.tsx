
import React, { useState, useEffect, forwardRef } from 'react';
import { useDebounce } from 'use-debounce';

// Define the command constant
export const INSERT_VARIABLE_COMMAND = 'INSERT_VARIABLE_COMMAND';

// Define the component props
interface LexicalEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onAtMention?: () => void;
}

export const LexicalEditor = forwardRef<HTMLTextAreaElement, LexicalEditorProps>(
  ({ value, onChange, placeholder, className, onAtMention }, ref) => {
    const [internalValue, setInternalValue] = useState(value);
    const [debouncedValue] = useDebounce(internalValue, 500);

    useEffect(() => {
      onChange(debouncedValue);
    }, [debouncedValue, onChange]);

    useEffect(() => {
      setInternalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);
      
      // Check for @ symbol to trigger mentions
      if (newValue.includes('@') && onAtMention) {
        const lastAtIndex = newValue.lastIndexOf('@');
        if (lastAtIndex === newValue.length - 1) {
          onAtMention();
        }
      }
    };

    return (
      <textarea
        ref={ref}
        value={internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`${className} w-full min-h-[100px] p-3 focus:outline-none`}
        onKeyDown={(e) => {
          if (e.key === '@' && onAtMention) {
            onAtMention();
          }
        }}
      />
    );
  }
);

LexicalEditor.displayName = 'LexicalEditor';
