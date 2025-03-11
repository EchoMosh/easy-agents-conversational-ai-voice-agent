
import { useState, useEffect, useRef } from 'react';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog";
import { User, Mail, Phone, Building2, Briefcase, Search, Variable, Tag } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/integrations/supabase/client";

export type VariableDisplayStyle = 'default' | 'badge' | 'code' | 'tag';

interface VariableSelectorProps {
  onSelectVariable: (variable: string, displayStyle?: VariableDisplayStyle) => void;
  triggerChar?: '@' | '#';
  isFullScreen?: boolean;
}

interface CustomVariable {
  id: string;
  name: string;
  value: string | null;
}

export function VariableSelector({ onSelectVariable, triggerChar, isFullScreen = false }: VariableSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const commandRef = useRef<HTMLDivElement>(null);
  
  // Fetch custom user variables from lead_variables table
  const { data: customVariables = [], isLoading: isLoadingCustomVariables } = useQuery({
    queryKey: ['leadVariables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_variables')
        .select('id, name, value')
        .order('name');
      
      if (error) {
        console.error('Error fetching custom variables:', error);
        return [] as CustomVariable[];
      }
      
      return data as CustomVariable[];
    },
  });
  
  // Available static variables with descriptive categories and icons
  const staticVariables = [
    { id: 'name', label: 'Name', value: 'name', category: 'contact', icon: <User className="h-4 w-4" /> },
    { id: 'email', label: 'Email', value: 'email', category: 'contact', icon: <Mail className="h-4 w-4" /> },
    { id: 'phone', label: 'Phone', value: 'phone', category: 'contact', icon: <Phone className="h-4 w-4" /> },
    { id: 'company', label: 'Company', value: 'company', category: 'organization', icon: <Building2 className="h-4 w-4" /> },
    { id: 'position', label: 'Position', value: 'position', category: 'organization', icon: <Briefcase className="h-4 w-4" /> },
  ];
  
  // Convert custom variables to compatible format
  const customVariablesFormatted = customVariables.map(variable => ({
    id: variable.id,
    label: variable.name,
    value: variable.name,
    category: 'custom',
    icon: <Tag className="h-4 w-4" />,
  }));
  
  // Combine static and custom variables
  const allVariables = [...staticVariables, ...customVariablesFormatted];
  
  const filteredVariables = allVariables.filter(variable => 
    variable.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    variable.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupVariablesByCategory = () => {
    const groupedVariables: Record<string, typeof allVariables> = {};
    
    filteredVariables.forEach(variable => {
      if (!groupedVariables[variable.category]) {
        groupedVariables[variable.category] = [];
      }
      groupedVariables[variable.category].push(variable);
    });
    
    return groupedVariables;
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!triggerChar) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex(prev => (prev < filteredVariables.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredVariables[activeIndex]) {
            onSelectVariable(filteredVariables[activeIndex].value, 'default');
          }
          break;
        case 'Escape':
          e.preventDefault();
          onSelectVariable('', 'default'); // Cancel selection
          break;
      }
    };

    if (triggerChar) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeIndex, filteredVariables, onSelectVariable, triggerChar]);

  // Handle click outside to close
  useEffect(() => {
    if (!triggerChar) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (commandRef.current && !commandRef.current.contains(event.target as Node)) {
        onSelectVariable('', 'default'); // Cancel selection
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onSelectVariable, triggerChar]);

  useEffect(() => {
    if (commandRef.current) {
      const inputElement = commandRef.current.querySelector('input');
      if (inputElement) {
        setTimeout(() => inputElement.focus(), 0);
      }
    }
  }, []);

  // Reset active index when search changes
  useEffect(() => {
    setActiveIndex(0);
  }, [searchTerm]);

  if (triggerChar) {
    const groupedVariables = groupVariablesByCategory();
    
    // Modal-style dialog with darkened background
    return (
      <div className="variable-selector-popup" ref={commandRef}>
        <div className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-[1px] animate-in fade-in-0 duration-150"></div>
        <div className="fixed z-[9999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 max-w-[320px] w-full animate-in fade-in-0 zoom-in-95 duration-200">
          <div className="bg-background/95 dark:bg-gray-800/95 rounded-xl overflow-hidden border border-border/20 shadow-xl backdrop-blur-md">
            <div className="flex items-center px-3 py-3 border-b border-border/10">
              <Search className="w-4 h-4 mr-2 text-muted-foreground/70" />
              <input 
                placeholder="Search variable..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 w-full bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/50"
                autoFocus
              />
            </div>
            
            <div className="max-h-[320px] overflow-y-auto custom-scrollbar p-2">
              {isLoadingCustomVariables && (
                <div className="py-8 text-sm text-center text-muted-foreground">
                  Loading variables...
                </div>
              )}
              
              {!isLoadingCustomVariables && Object.keys(groupedVariables).length > 0 ? (
                Object.entries(groupedVariables).map(([category, variables]) => (
                  <div key={category} className="mb-3 last:mb-0">
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                      {category === 'custom' ? 'Custom Variables' : category.charAt(0).toUpperCase() + category.slice(1)}
                    </div>
                    <div className="space-y-1.5">
                      {variables.map((variable, index) => {
                        // Calculate overall index in the flattened array
                        const flattenedIndex = filteredVariables.findIndex(v => v.id === variable.id);
                        const isActive = flattenedIndex === activeIndex;
                        
                        return (
                          <div
                            key={variable.id}
                            onClick={() => onSelectVariable(variable.value, 'default')}
                            className={cn(
                              "flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all duration-150 cursor-pointer group",
                              isActive ? "bg-primary/15 dark:bg-primary/25" : "hover:bg-primary/10 active:bg-primary/15"
                            )}
                          >
                            <div className={cn(
                              "flex items-center justify-center w-8 h-8 rounded-full", 
                              "bg-primary/10 dark:bg-primary/20 text-primary",
                              "transition-all duration-300 group-hover:scale-105",
                              "group-hover:bg-primary/15 dark:group-hover:bg-primary/25",
                              "group-hover:shadow-[0_0_10px_rgba(99,102,241,0.25)]"
                            )}>
                              {variable.icon}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-medium text-sm">{variable.label}</span>
                              <span className="text-xs text-muted-foreground/70">{'{'}{variable.value}{'}'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                !isLoadingCustomVariables && (
                  <div className="py-8 text-sm text-center text-muted-foreground">
                    No variables found
                  </div>
                )
              )}
            </div>
          </div>
        </div>
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
        className="w-[320px] p-0 bg-background/95 dark:bg-gray-800/95 backdrop-blur-lg rounded-xl overflow-hidden border border-border/20 shadow-lg animate-in zoom-in-95 duration-200" 
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
        
        <div className="max-h-[320px] overflow-y-auto custom-scrollbar p-2">
          {isLoadingCustomVariables ? (
            <div className="py-8 text-sm text-center text-muted-foreground">Loading variables...</div>
          ) : filteredVariables.length > 0 ? (
            <>
              <div className="py-1 px-2 text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                Available Variables
              </div>
              <div className="space-y-1.5 mt-1">
                {filteredVariables.map((variable) => (
                  <div
                    key={variable.id}
                    onClick={() => {
                      onSelectVariable(variable.value, 'default');
                      setOpen(false);
                    }}
                    className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-primary/10 active:bg-primary/15 transition-all duration-150 cursor-pointer group"
                  >
                    <div className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full", 
                      "bg-primary/10 dark:bg-primary/20 text-primary",
                      "transition-all duration-300 group-hover:scale-105",
                      "group-hover:bg-primary/15 dark:group-hover:bg-primary/25",
                      "group-hover:shadow-[0_0_10px_rgba(99,102,241,0.25)]"
                    )}>
                      {variable.icon}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{variable.label}</span>
                      <span className="text-xs text-muted-foreground/70">{'{'}{variable.value}{'}'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-8 text-sm text-center text-muted-foreground">No variables found</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
