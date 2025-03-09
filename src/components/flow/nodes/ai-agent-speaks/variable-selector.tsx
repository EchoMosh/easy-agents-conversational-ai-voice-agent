
import { useState, useEffect, useRef } from 'react';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, PlusCircle, Variable } from "lucide-react";
import { Dialog, DialogContent, DialogOverlay } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export type VariableDisplayStyle = 'default' | 'badge' | 'code' | 'tag';

interface VariableSelectorProps {
  onSelectVariable: (variable: string, displayStyle?: VariableDisplayStyle) => void;
  triggerChar?: '#';
  isFullScreen?: boolean;
}

export function VariableSelector({ onSelectVariable, triggerChar, isFullScreen = false }: VariableSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVariable, setSelectedVariable] = useState<string | null>(null);
  const [displayStyle, setDisplayStyle] = useState<VariableDisplayStyle>('default');
  const [showStyleOptions, setShowStyleOptions] = useState(false);
  const commandRef = useRef<HTMLDivElement>(null);
  
  const availableVariables = [
    { id: 'name', label: 'Name', value: '{{name}}', category: 'contact' },
    { id: 'email', label: 'Email', value: '{{email}}', category: 'contact' },
    { id: 'phone', label: 'Phone', value: '{{phone}}', category: 'contact' },
    { id: 'company', label: 'Company', value: '{{company}}', category: 'organization' },
    { id: 'position', label: 'Position', value: '{{position}}', category: 'organization' },
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

  const handleVariableSelect = (value: string) => {
    setSelectedVariable(value);
    setShowStyleOptions(true);
  };

  const handleConfirmVariableSelection = () => {
    if (selectedVariable) {
      onSelectVariable(selectedVariable, displayStyle);
      setSelectedVariable(null);
      setShowStyleOptions(false);
    }
  };

  const handleCancel = () => {
    setSelectedVariable(null);
    setShowStyleOptions(false);
    onSelectVariable('');
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

    // When isFullScreen is true, use Dialog for a full-screen modal
    if (isFullScreen) {
      // Show variable style selection if a variable has been selected
      if (showStyleOptions && selectedVariable) {
        return (
          <Dialog open={true} onOpenChange={handleCancel}>
            <DialogOverlay className="bg-black/80" />
            <DialogContent className="max-w-md mx-auto border-none bg-transparent shadow-none">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden p-4">
                <h3 className="text-lg font-medium mb-4">Variable Display Options</h3>
                
                <RadioGroup value={displayStyle} onValueChange={(value) => setDisplayStyle(value as VariableDisplayStyle)} className="space-y-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="default" id="default" />
                    <Label htmlFor="default" className="cursor-pointer flex items-center">
                      <span className="editor-variable">{{name}}</span>
                      <span className="ml-2">Default Style</span>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="badge" id="badge" />
                    <Label htmlFor="badge" className="cursor-pointer flex items-center">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">[name]</span>
                      <span className="ml-2">Badge Style</span>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="code" id="code" />
                    <Label htmlFor="code" className="cursor-pointer flex items-center">
                      <span className="font-mono bg-gray-100 dark:bg-gray-700 px-1 rounded text-sm">$(name)</span>
                      <span className="ml-2">Code Style</span>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tag" id="tag" />
                    <Label htmlFor="tag" className="cursor-pointer flex items-center">
                      <span className="text-blue-500 font-medium">#name</span>
                      <span className="ml-2">Tag Style</span>
                    </Label>
                  </div>
                </RadioGroup>
                
                <div className="flex justify-end space-x-2 mt-4">
                  <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                  <Button onClick={handleConfirmVariableSelection}>Insert Variable</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        );
      }
      
      return (
        <Dialog open={true} onOpenChange={() => onSelectVariable('')}>
          <DialogOverlay className="bg-black/80" />
          <DialogContent className="max-w-md mx-auto border-none bg-transparent shadow-none">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
              <Command className="rounded-lg">
                <div className="flex items-center border-b px-3">
                  <CommandInput 
                    placeholder="Search variable..." 
                    value={searchTerm} 
                    onValueChange={setSearchTerm}
                    className="h-9 w-full"
                  />
                </div>
                
                <CommandList className="max-h-[300px] overflow-y-auto">
                  <CommandEmpty>No variable found.</CommandEmpty>
                  
                  {Object.keys(groupedVariables).length > 0 ? (
                    Object.entries(groupedVariables).map(([category, variables]) => (
                      <CommandGroup key={category} heading={category.charAt(0).toUpperCase() + category.slice(1)}>
                        {variables.map((variable) => (
                          <CommandItem
                            key={variable.id}
                            onSelect={() => handleVariableSelect(variable.value)}
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
          </DialogContent>
        </Dialog>
      );
    }

    // Original node-specific dropdown (non-full-screen)
    return (
      <>
        {/* Semi-transparent backdrop */}
        <div className="fixed inset-0 bg-black/30 z-40" onClick={() => onSelectVariable('')} />
        
        {/* Variable selector dropdown */}
        <div className="absolute z-50 w-[250px] bg-white dark:bg-gray-800 rounded-md shadow-lg overflow-hidden border border-border" ref={commandRef}>
          <Command className="rounded-none">
            <div className="flex items-center border-b px-3">
              <CommandInput 
                placeholder="Search variable..." 
                value={searchTerm} 
                onValueChange={setSearchTerm}
                className="h-9 w-full"
              />
            </div>
            
            <CommandList>
              <CommandEmpty>No variable found.</CommandEmpty>
              
              {Object.keys(groupedVariables).length > 0 ? (
                Object.entries(groupedVariables).map(([category, variables]) => (
                  <CommandGroup key={category} heading={category.charAt(0).toUpperCase() + category.slice(1)}>
                    {variables.map((variable) => (
                      <CommandItem
                        key={variable.id}
                        onSelect={() => onSelectVariable(variable.value)}
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
      </>
    );
  }

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
                      onSelectVariable(variable.value);
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
