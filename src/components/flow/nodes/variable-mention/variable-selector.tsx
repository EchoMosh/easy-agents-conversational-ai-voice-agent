
import { useState, useRef, useEffect } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export type Variable = {
  id: string;
  name: string;
  description: string;
  category: 'contact' | 'system' | 'custom';
};

const SAMPLE_VARIABLES: Variable[] = [
  { id: 'first_name', name: 'First Name', description: 'Contact\'s first name', category: 'contact' },
  { id: 'last_name', name: 'Last Name', description: 'Contact\'s last name', category: 'contact' },
  { id: 'email', name: 'Email', description: 'Contact\'s email address', category: 'contact' },
  { id: 'current_date', name: 'Current Date', description: 'Current date', category: 'system' },
  { id: 'company_name', name: 'Company Name', description: 'Company name', category: 'system' },
];

interface VariableSelectorProps {
  text: string;
  onTextChange: (text: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

export function VariableSelector({ text, onTextChange, textareaRef }: VariableSelectorProps) {
  const [showVariables, setShowVariables] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const lastAtIndex = useRef(-1);

  useEffect(() => {
    const handleAt = () => {
      const atIndex = text.lastIndexOf('@');
      if (atIndex !== -1 && atIndex !== lastAtIndex.current) {
        lastAtIndex.current = atIndex;
        const textarea = textareaRef.current;
        if (textarea) {
          const { left, top, height } = textarea.getBoundingClientRect();
          const textBeforeAt = text.substring(0, atIndex);
          const lines = textBeforeAt.split('\n');
          const lineHeight = height / textarea.rows;
          const currentLine = lines.length;
          
          setPosition({
            x: left + 10,
            y: top + (currentLine * lineHeight)
          });
          setShowVariables(true);
          setSearchTerm("");
        }
      } else if (!text.includes('@')) {
        setShowVariables(false);
      }
    };

    handleAt();
  }, [text, textareaRef]);

  const insertVariable = (variable: Variable) => {
    const atIndex = text.lastIndexOf('@');
    if (atIndex !== -1) {
      const newText = text.substring(0, atIndex) + 
        `{{${variable.id}}}` + 
        text.substring(atIndex + searchTerm.length + 1);
      onTextChange(newText);
    }
    setShowVariables(false);
  };

  return (
    <Popover open={showVariables} onOpenChange={setShowVariables}>
      <PopoverTrigger asChild>
        <div style={{ position: 'fixed', left: position.x, top: position.y }} />
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[300px]" side="right" align="start">
        <Command>
          <CommandInput placeholder="Search variables..." />
          <CommandEmpty>No variables found.</CommandEmpty>
          <CommandGroup>
            {SAMPLE_VARIABLES.map((variable) => (
              <CommandItem
                key={variable.id}
                onSelect={() => insertVariable(variable)}
                className="flex flex-col items-start gap-1 p-2"
              >
                <div className="font-medium">{variable.name}</div>
                <div className="text-xs text-muted-foreground">{variable.description}</div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
