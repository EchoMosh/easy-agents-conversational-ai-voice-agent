
import { TipTapGreetingEditor } from './tiptap-greeting-editor';

interface GreetingInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function GreetingInput({ value, onChange }: GreetingInputProps) {
  const sanitizedValue = value && value !== '<p>Enter your message here...</p>' ? value : '<p></p>';
  
  const handleChange = (newValue: string) => {
    console.log("GreetingInput change:", newValue);
    onChange(newValue);
  };

  return (
    <div className="relative nodrag w-full">
      <TipTapGreetingEditor
        value={sanitizedValue}
        onChange={handleChange}
      />
    </div>
  );
}
