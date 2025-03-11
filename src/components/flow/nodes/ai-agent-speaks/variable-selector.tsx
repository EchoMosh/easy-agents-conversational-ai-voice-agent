
import { useState, useEffect, useRef } from 'react';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { PlusCircle, Variable, Search } from "lucide-react";
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
  
  // Available variables with descriptive categories and icons
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

    // Modern floating command palette with frosted glass effect
    return (
      <div 
        className="absolute z-[9999] w-[280px] bg-background/60 dark:bg-gray-800/60 rounded-xl overflow-hidden border border-border/10 shadow-lg backdrop-blur-lg transition-all duration-300 animate-scale-in"
        ref={commandRef}
        style={{ maxWidth: '280px' }}
      >
        <Command className="rounded-xl border-0">
          <div className="flex items-center px-3 py-2 border-b border-border/10">
            <Search className="w-4 h-4 mr-2 text-muted-foreground/70" />
            <CommandInput 
              placeholder="Search variable..." 
              value={searchTerm} 
              onValueChange={setSearchTerm}
              className="h-9 w-full bg-transparent focus:outline-none placeholder:text-muted-foreground/50"
            />
          </div>
          
          <CommandList className="max-h-[220px] overflow-y-auto custom-scrollbar p-1">
            <CommandEmpty className="py-3 text-sm text-center text-muted-foreground">No variables found</CommandEmpty>
            
            {Object.keys(groupedVariables).length > 0 ? (
              Object.entries(groupedVariables).map(([category, variables]) => (
                <CommandGroup 
                  key={category} 
                  heading={category.charAt(0).toUpperCase() + category.slice(1)}
                  className="pb-1 pt-2 text-xs font-medium text-muted-foreground/70"
                >
                  {variables.map((variable) => (
                    <CommandItem
                      key={variable.id}
                      onSelect={() => onSelectVariable(variable.value, 'default')}
                      className="flex items-center gap-2.5 py-2 px-2 m-1 rounded-lg hover:bg-primary/5 dark:hover:bg-primary/10 group transition-all duration-200 text-sm"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/5 dark:bg-primary/10 text-primary transition-all duration-300 group-hover:scale-105 group-hover:bg-primary/10 dark:group-hover:bg-primary/20 group-hover:shadow-[0_0_12px_rgba(99,102,241,0.3)]">
                        <span className="text-sm">{variable.icon}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium">{variable.label}</span>
                        <span className="text-xs text-muted-foreground/70">{'{'}{variable.value}{'}'}</span>
                      </div>
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

  // Button trigger version with refined aesthetics
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8 gap-1.5 border-dashed bg-transparent hover:bg-primary/5 dark:hover:bg-primary/10 transition-all duration-200 group"
        >
          <Variable className="h-3.5 w-3.5 text-primary/70 group-hover:text-primary transition-colors duration-200" />
          <span className="text-sm font-medium">Variable</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[280px] p-0 bg-background/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-xl overflow-hidden border border-border/10 shadow-lg animate-scale-in" 
        align="start"
      >
        <div className="flex items-center px-3 py-2.5 border-b border-border/10">
          <Search className="w-4 h-4 mr-2 text-muted-foreground/70" />
          <input
            placeholder="Search variables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50"
          />
        </div>
        
        <div className="max-h-[220px] overflow-y-auto custom-scrollbar p-2">
          {filteredVariables.length > 0 ? (
            <>
              <div className="py-1 px-2 text-xs font-medium text-muted-foreground/70">
                Available Variables
              </div>
              {filteredVariables.map((variable) => (
                <div
                  key={variable.id}
                  onClick={() => {
                    onSelectVariable(variable.value, 'default');
                    setOpen(false);
                  }}
                  className="cursor-pointer flex items-center gap-2.5 py-2.5 px-2 m-1 rounded-lg hover:bg-primary/5 dark:hover:bg-primary/10 group transition-all duration-200 text-sm"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/5 dark:bg-primary/10 text-primary transition-all duration-300 group-hover:scale-105 group-hover:bg-primary/10 dark:group-hover:bg-primary/20 group-hover:shadow-[0_0_12px_rgba(99,102,241,0.3)]">
                    <span className="text-sm">{variable.icon}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium">{variable.label}</span>
                    <span className="text-xs text-muted-foreground/70">{'{'}{variable.value}{'}'}</span>
                  </div>
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
