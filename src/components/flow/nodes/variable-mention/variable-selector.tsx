
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
  onTextChange?: (text: string) => void;
  onSelectVariable?: (variableId: string) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement> | null;
  onClose?: () => void;
}

export function VariableSelector({ 
  text, 
  onTextChange, 
  onSelectVariable,
  textareaRef,
  onClose
}: VariableSelectorProps) {
  const [showVariables, setShowVariables] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const lastAtIndex = useRef(-1);
  const dialogOpenedRef = useRef(false);

  // Set initial dialog state to open when component mounts
  useEffect(() => {
    dialogOpenedRef.current = true;
  }, []);
  
  // Prevent background interactions when dialog is open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showVariables) {
        // Allow only tab navigation within the dialog
        if (e.key !== 'Tab') {
          e.stopPropagation();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [showVariables]);

  // Handle legacy textarea approach
  useEffect(() => {
    if (textareaRef && textareaRef.current) {
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
    }
  }, [text, textareaRef]);

  const insertVariable = (variable: Variable) => {
    // Handle legacy textarea approach
    if (textareaRef && textareaRef.current && onTextChange) {
      const atIndex = text.lastIndexOf('@');
      if (atIndex !== -1) {
        const newText = text.substring(0, atIndex) + 
          `{{${variable.id}}}` + 
          text.substring(atIndex + searchTerm.length + 1);
        onTextChange(newText);
      }
    } 
    // Handle new Lexical editor approach
    else if (onSelectVariable) {
      onSelectVariable(variable.id);
    }
    
    setShowVariables(false);
    if (onClose) onClose();
  };

  const handleOpenChange = (open: boolean) => {
    // Prevent auto-closing on first render
    if (dialogOpenedRef.current && !open) {
      dialogOpenedRef.current = false;
      return;
    }
    
    setShowVariables(open);
    if (!open && onClose) onClose();
  };

  // Handle keyboard events in the command input
  const handleKeyDown = (e: React.KeyboardEvent, variable: Variable) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      insertVariable(variable);
    }
  };

  return (
    <Dialog open={showVariables} onOpenChange={handleOpenChange} modal={true}>
      <DialogContent 
        className="sm:max-w-[500px] p-0"
        onPointerDownOutside={(e) => {
          // Prevent clicks outside dialog from reaching nodes
          e.preventDefault();
        }}
        onInteractOutside={(e) => {
          // Prevent any interaction outside dialog
          e.preventDefault();
        }}
      >
        <Command className="rounded-lg">
          <CommandInput 
            placeholder="Search variables..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
            className="border-none focus:ring-0"
            autoFocus
            onKeyDown={(e) => {
              // Prevent Enter key from bubbling and activating nodes
              if (e.key === 'Enter') {
                e.stopPropagation();
              }
            }}
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
                  onKeyDown={(e) => handleKeyDown(e, variable)}
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
