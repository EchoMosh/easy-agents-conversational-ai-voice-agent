
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

interface VariableEditorProps {
  name: string;
  value: string;
  onNameChange: (value: string) => void;
  onValueChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export function VariableEditor({
  name,
  value,
  onNameChange,
  onValueChange,
  onSave,
  onCancel,
}: VariableEditorProps) {
  const [localName, setLocalName] = useState(name);
  const [showNameWarning, setShowNameWarning] = useState(false);
  
  // Check if the name contains spaces and update the warning
  useEffect(() => {
    setShowNameWarning(localName.includes(' '));
    
    // When name changes locally, propagate it to parent after converting spaces
    const formattedName = localName.replace(/\s+/g, '_');
    if (formattedName !== localName && localName !== name) {
      onNameChange(formattedName);
    } else if (localName !== name) {
      onNameChange(localName);
    }
  }, [localName, name, onNameChange]);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex items-center gap-2 w-full">
        <div className="flex-1 grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <Input
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              className="h-11 text-base border border-border/50 bg-background/50 hover:bg-background/80 focus-visible:ring-1 transition-colors"
            />
            {showNameWarning && (
              <p className="text-xs text-amber-600 mt-1">
                Spaces will be converted to underscores
              </p>
            )}
          </div>
          <Input
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            className="h-11 text-base border border-border/50 bg-background/50 hover:bg-background/80 focus-visible:ring-1 transition-colors"
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onSave}
          className="h-11 w-11"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onCancel}
          className="h-11 w-11"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
