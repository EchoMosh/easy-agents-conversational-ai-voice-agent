
import { useEffect, useState } from 'react';
import { LexicalGreetingEditor } from './lexical-greeting-editor';

interface GreetingInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function GreetingInput({ value, onChange }: GreetingInputProps) {
  const [currentValue, setCurrentValue] = useState(value);

  // Update local value when prop value changes
  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const handleChange = (newValue: string) => {
    setCurrentValue(newValue);
    onChange(newValue);
  };

  return (
    <LexicalGreetingEditor 
      value={currentValue}
      onChange={handleChange}
    />
  );
}
