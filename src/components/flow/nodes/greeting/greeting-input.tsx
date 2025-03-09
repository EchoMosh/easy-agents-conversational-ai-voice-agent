import { useEffect, useState } from 'react';
import { SlateGreetingEditor } from './slate-greeting-editor';

interface GreetingInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function GreetingInput({ value, onChange }: GreetingInputProps) {
  const sanitizedValue = value ? value.replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '') : '';
  
  const handleChange = (newValue: string) => {
    console.log("GreetingInput change:", newValue);
    onChange(newValue);
  };

  const containerStyle = {
    maxWidth: '250px',
    width: '250px',
    minWidth: '0',
    overflow: 'hidden',
    flex: '1 1 auto'
  };

  return (
    <div className="relative" style={containerStyle}>
      <SlateGreetingEditor
        value={sanitizedValue}
        onChange={handleChange}
      />
    </div>
  );
}
