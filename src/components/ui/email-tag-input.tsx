
import React, { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface EmailTagInputProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
}

export function EmailTagInput({ label, value, onChange, placeholder }: EmailTagInputProps) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (input.trim() && isValidEmail(input.trim())) {
        onChange([...value, input.trim()]);
        setInput('');
      }
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  return (
    <div className="flex-1">
      <div className="relative">
        <div className="flex flex-wrap gap-1 p-2 text-sm border rounded-md bg-background min-h-[2.5rem] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
          {value.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-xs"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(index)}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={value.length === 0 ? placeholder : ''}
            className="flex-1 bg-transparent outline-none min-w-[120px] text-sm"
          />
        </div>
        <span className="absolute left-2 -top-2.5 px-1 bg-background text-xs text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}
