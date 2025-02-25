
import { useState, useRef, useEffect } from 'react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent } from "@/components/ui/dialog";

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
  const lastAtIndex = useRef(-1);

  useEffect(() => {
    const handleAt = () => {
      const atIndex = text.lastIndexOf('@');
      if (atIndex !== -1 && atIndex !== lastAtIndex.current) {
        lastAtIndex.current = atIndex;
        setShowVariables(true);
        setSearchTerm("");
      } else if (!text.includes('@')) {
        setShowVariables(false);
      }
    };

    handleAt();
  }, [text]);

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
    <Dialog open={showVariables} onOpenChange={setShowVariables}>
      <DialogContent className="sm:max-w-[500px] p-0">
        <Command className="rounded-lg">
          <CommandInput 
            placeholder="Search variables..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
            className="border-none focus:ring-0"
          />
          <CommandList>
            <CommandEmpty>No variables found.</CommandEmpty>
            <CommandGroup className="max-h-[300px] overflow-auto">
              {SAMPLE_VARIABLES.filter(variable => 
                variable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                variable.description.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((variable) => (
                <CommandItem
                  key={variable.id}
                  onSelect={() => insertVariable(variable)}
                  className="flex flex-col items-start gap-1 p-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="font-medium">{variable.name}</div>
                  <div className="text-xs text-muted-foreground">{variable.description}</div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
