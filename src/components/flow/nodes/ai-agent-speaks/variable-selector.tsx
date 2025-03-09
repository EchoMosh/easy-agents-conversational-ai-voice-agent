
import { useState, useEffect, useRef } from 'react';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { PlusCircle, Variable } from "lucide-react";

interface VariableSelectorProps {
  onSelectVariable: (variable: string) => void;
  triggerChar?: '#' | '@';
}

export function VariableSelector({ onSelectVariable, triggerChar }: VariableSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const commandRef = useRef<HTMLDivElement>(null);
  
  // In a real implementation, these would come from the backend
  // This is a placeholder for the available variables
  const availableVariables = [
    { id: 'name', label: 'Name', value: '{{name}}', category: 'contact' },
    { id: 'email', label: 'Email', value: '{{email}}', category: 'contact' },
    { id: 'phone', label: 'Phone', value: '{{phone}}', category: 'contact' },
    { id: 'company', label: 'Company', value: '{{company}}', category: 'organization' },
    { id: 'position', label: 'Position', value: '{{position}}', category: 'organization' },
  ];

  // Filter variables based on search term
  const filteredVariables = availableVariables.filter(variable => 
    variable.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    variable.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group variables by category for better organization
  const groupVariablesByCategory = () => {
    const groupedVariables: Record<string, typeof availableVariables> = {};
    
    filteredVariables.forEach(variable => {
      if (!groupedVariables[variable.category]) {
        groupedVariables[variable.category] = [];
      }
      groupedVariables[variable.category].push(variable);
    });
    
    return groupedVariables;
  };

  // For inline variable selector (triggered by # or @)
  if (triggerChar) {
    // Group variables by category for better organization
    const groupedVariables = groupVariablesByCategory();
    
    // Focus input when opened
    useEffect(() => {
      if (commandRef.current) {
        const inputElement = commandRef.current.querySelector('input');
        if (inputElement) {
          setTimeout(() => inputElement.focus(), 0);
        }
      }
    }, []);

    return (
      <div className="w-[200px] bg-popover border rounded-md shadow-md overflow-hidden z-50" ref={commandRef}>
        <Command className="rounded-t-none">
          <CommandInput 
            placeholder="Search variable..." 
            value={searchTerm} 
            onValueChange={setSearchTerm}
          />
          <CommandEmpty>No variable found.</CommandEmpty>
          
          <CommandList>
            {Object.keys(groupedVariables).length > 0 ? (
              Object.entries(groupedVariables).map(([category, variables]) => (
                <CommandGroup key={category} heading={category.charAt(0).toUpperCase() + category.slice(1)}>
                  {variables.map((variable) => (
                    <CommandItem
                      key={variable.id}
                      onSelect={() => onSelectVariable(variable.value)}
                      className="cursor-pointer"
                    >
                      <Variable className="mr-2 h-4 w-4" />
                      {variable.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))
            ) : (
              <CommandGroup>
                <CommandItem disabled>No variables found</CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </div>
    );
  }

  // For button-triggered variable selector (original implementation)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 gap-1 border-dashed"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span>Variable</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search variable..." 
            value={searchTerm} 
            onValueChange={setSearchTerm}
          />
          <CommandEmpty>No variable found.</CommandEmpty>
          <CommandList>
            <CommandGroup heading="Available Variables">
              {filteredVariables.length > 0 ? (
                filteredVariables.map((variable) => (
                  <CommandItem
                    key={variable.id}
                    onSelect={() => {
                      onSelectVariable(variable.value);
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Variable className="mr-2 h-4 w-4" />
                    {variable.label}
                  </CommandItem>
                ))
              ) : (
                <CommandItem disabled>No variables found</CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
