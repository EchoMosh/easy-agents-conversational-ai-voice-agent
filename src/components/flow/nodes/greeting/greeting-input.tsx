
import { TipTapGreetingEditor } from './tiptap-greeting-editor';

interface GreetingInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function GreetingInput({ value, onChange }: GreetingInputProps) {
  const sanitizedValue = value ? value : '<p>Enter your message here...</p>';
  
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
    <div className="relative nodrag" style={containerStyle}>
      <TipTapGreetingEditor
        value={sanitizedValue}
        onChange={handleChange}
      />
    </div>
  );
}
