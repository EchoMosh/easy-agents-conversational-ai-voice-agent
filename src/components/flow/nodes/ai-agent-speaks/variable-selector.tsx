
import { useState, useEffect, useRef } from 'react';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { PlusCircle, Variable } from "lucide-react";

interface VariableSelectorProps {
  onSelectVariable: (variable: string) => void;
}

export function VariableSelector({ onSelectVariable }: VariableSelectorProps) {
  const [open, setOpen] = useState(false);
  
  // In a real implementation, these would come from the backend
  // This is a placeholder for the available variables
  const availableVariables = [
    { id: 'name', label: 'Name', value: '{{name}}' },
    { id: 'email', label: 'Email', value: '{{email}}' },
    { id: 'phone', label: 'Phone', value: '{{phone}}' },
    { id: 'company', label: 'Company', value: '{{company}}' },
    { id: 'position', label: 'Position', value: '{{position}}' },
  ];

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
          <CommandInput placeholder="Search variable..." />
          <CommandEmpty>No variable found.</CommandEmpty>
          <CommandGroup heading="Available Variables">
            {availableVariables.map((variable) => (
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
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
