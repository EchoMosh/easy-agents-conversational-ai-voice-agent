
import { useState, useEffect, useRef } from 'react';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { PlusCircle, Variable } from "lucide-react";

export type VariableDisplayStyle = 'default' | 'badge' | 'code' | 'tag';

interface VariableSelectorProps {
  onSelectVariable: (variable: string, displayStyle?: VariableDisplayStyle) => void;
  triggerChar?: '#';
  isFullScreen?: boolean;
}

export function VariableSelector({ onSelectVariable, triggerChar, isFullScreen = false }: VariableSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const commandRef = useRef<HTMLDivElement>(null);
  
  // Fix: Change the variable format to use single curly braces
  const availableVariables = [
    { id: 'name', label: 'Name', value: 'name', category: 'contact' },
    { id: 'email', label: 'Email', value: 'email', category: 'contact' },
    { id: 'phone', label: 'Phone', value: 'phone', category: 'contact' },
    { id: 'company', label: 'Company', value: 'company', category: 'organization' },
    { id: 'position', label: 'Position', value: 'position', category: 'organization' },
  ];

  const filteredVariables = availableVariables.filter(variable => 
    variable.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    variable.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  if (triggerChar) {
    const groupedVariables = groupVariablesByCategory();
    
    useEffect(() => {
      if (commandRef.current) {
        const inputElement = commandRef.current.querySelector('input');
        if (inputElement) {
          setTimeout(() => inputElement.focus(), 0);
        }
      }
    }, []);

    // Inline variable selector - no overlay and transparent background
    return (
      <div 
        className="absolute z-[9999] w-[250px] bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden border border-border"
        ref={commandRef}
        style={{ maxWidth: '250px' }}
      >
        <Command className="rounded-none">
          <div className="flex items-center border-b px-3">
            <CommandInput 
              placeholder="Search variable..." 
              value={searchTerm} 
              onValueChange={setSearchTerm}
              className="h-9 w-full"
            />
          </div>
          
          <CommandList className="max-h-[200px] overflow-y-auto">
            <CommandEmpty>No variable found.</CommandEmpty>
            
            {Object.keys(groupedVariables).length > 0 ? (
              Object.entries(groupedVariables).map(([category, variables]) => (
                <CommandGroup key={category} heading={category.charAt(0).toUpperCase() + category.slice(1)}>
                  {variables.map((variable) => (
                    <CommandItem
                      key={variable.id}
                      onSelect={() => onSelectVariable(variable.value, 'default')}
                      className="cursor-pointer flex items-center gap-2 py-2"
                    >
                      <span className="flex items-center justify-center h-5 w-5">
                        <Variable className="h-4 w-4" />
                      </span>
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

  // Default popover selector (when not triggered by #)
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
      <PopoverContent className="w-[250px] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Search variable..." 
            value={searchTerm} 
            onValueChange={setSearchTerm}
          />
          <CommandList>
            <CommandEmpty>No variable found.</CommandEmpty>
            <CommandGroup heading="Available Variables">
              {filteredVariables.length > 0 ? (
                filteredVariables.map((variable) => (
                  <CommandItem
                    key={variable.id}
                    onSelect={() => {
                      onSelectVariable(variable.value, 'default');
                      setOpen(false);
                    }}
                    className="cursor-pointer flex items-center gap-2"
                  >
                    <Variable className="h-4 w-4" />
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
