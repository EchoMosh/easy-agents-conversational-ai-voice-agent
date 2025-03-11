
import { useState, useEffect, useRef } from 'react';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { PlusCircle, Variable } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type VariableDisplayStyle = 'default' | 'badge' | 'code' | 'tag';

interface VariableSelectorProps {
  onSelectVariable: (variable: string, displayStyle?: VariableDisplayStyle) => void;
  triggerChar?: '@' | '#';
  isFullScreen?: boolean;
}

export function VariableSelector({ onSelectVariable, triggerChar, isFullScreen = false }: VariableSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const commandRef = useRef<HTMLDivElement>(null);
  
  // Fix: Change the variable format to use single curly braces
  const availableVariables = [
    { id: 'name', label: 'Name', value: 'name', category: 'contact', icon: '👤' },
    { id: 'email', label: 'Email', value: 'email', category: 'contact', icon: '✉️' },
    { id: 'phone', label: 'Phone', value: 'phone', category: 'contact', icon: '📱' },
    { id: 'company', label: 'Company', value: 'company', category: 'organization', icon: '🏢' },
    { id: 'position', label: 'Position', value: 'position', category: 'organization', icon: '💼' },
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

    // Modern floating variable selector with clean UI and animations
    return (
      <div 
        className="absolute z-[9999] w-[280px] bg-white/90 dark:bg-gray-800/90 rounded-lg overflow-hidden border-0 shadow-lg backdrop-blur-sm transition-all duration-200 animate-scale-in"
        ref={commandRef}
        style={{ maxWidth: '280px', backdropFilter: 'blur(10px)' }}
      >
        <Command className="rounded-lg border-0">
          <div className="flex items-center px-3 py-2 border-b border-border/30">
            <CommandInput 
              placeholder="Search variable..." 
              value={searchTerm} 
              onValueChange={setSearchTerm}
              className="h-9 w-full bg-transparent focus:outline-none"
            />
          </div>
          
          <CommandList className="max-h-[220px] overflow-y-auto custom-scrollbar p-1">
            <CommandEmpty className="py-3 text-sm text-center text-muted-foreground">No variables found</CommandEmpty>
            
            {Object.keys(groupedVariables).length > 0 ? (
              Object.entries(groupedVariables).map(([category, variables]) => (
                <CommandGroup 
                  key={category} 
                  heading={category.charAt(0).toUpperCase() + category.slice(1)}
                  className="pb-2 text-xs font-medium text-muted-foreground/80"
                >
                  {variables.map((variable) => (
                    <CommandItem
                      key={variable.id}
                      onSelect={() => onSelectVariable(variable.value, 'default')}
                      className="cursor-pointer flex items-center gap-2.5 py-2.5 px-2 m-1 rounded-md hover:bg-primary/5 dark:hover:bg-primary/10 group transition-all duration-150 text-sm"
                    >
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/5 dark:bg-primary/10 text-primary transition-all duration-200 group-hover:scale-110 group-hover:bg-primary/10 dark:group-hover:bg-primary/20">
                        <span className="text-xs">{variable.icon}</span>
                      </div>
                      <span className="font-medium">{variable.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              ))
            ) : (
              <CommandGroup>
                <CommandItem disabled className="py-3 text-sm text-center opacity-70">No variables found</CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </div>
    );
  }

  // Completely redesigned popover selector with refined aesthetics
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 gap-1.5 border-dashed bg-transparent hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-200 group"
        >
          <PlusCircle className="h-3.5 w-3.5 text-primary/70 group-hover:text-primary transition-colors duration-200" />
          <span className="text-sm font-medium">Variable</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[280px] p-0 border-0 shadow-lg bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg overflow-hidden animate-scale-in" 
        align="start"
        style={{ backdropFilter: 'blur(10px)' }}
      >
        <div className="px-3 py-2.5 border-b border-border/30">
          <input
            placeholder="Search variables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/70"
          />
        </div>
        
        <div className="max-h-[220px] overflow-y-auto custom-scrollbar p-2">
          {filteredVariables.length > 0 ? (
            <>
              <div className="py-1 px-2 text-xs font-medium text-muted-foreground/80">
                Available Variables
              </div>
              {filteredVariables.map((variable) => (
                <div
                  key={variable.id}
                  onClick={() => {
                    onSelectVariable(variable.value, 'default');
                    setOpen(false);
                  }}
                  className="cursor-pointer flex items-center gap-2.5 py-2.5 px-2 m-1 rounded-md hover:bg-primary/5 dark:hover:bg-primary/10 group transition-all duration-150 text-sm"
                >
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/5 dark:bg-primary/10 text-primary transition-all duration-200 group-hover:scale-110 group-hover:bg-primary/10 dark:group-hover:bg-primary/20">
                    <span className="text-xs">{variable.icon}</span>
                  </div>
                  <span className="font-medium">{variable.label}</span>
                </div>
              ))}
            </>
          ) : (
            <div className="py-3 text-sm text-center text-muted-foreground">No variables found</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
