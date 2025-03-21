
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";

interface NewVariableFormProps {
  name: string;
  value: string;
  onChange: (field: "name" | "value", value: string) => void;
  onRemove: () => void;
}

export function NewVariableForm({
  name,
  value,
  onChange,
  onRemove,
}: NewVariableFormProps) {
  const [showNameWarning, setShowNameWarning] = useState(false);
  
  useEffect(() => {
    setShowNameWarning(name.includes(' '));
  }, [name]);

  const handleNameChange = (newName: string) => {
    onChange("name", newName);
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div className="flex-1 grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <Input
              placeholder="Variable name"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
              className="h-11 text-base border border-border/50 bg-background/50 hover:bg-background/80 focus-visible:ring-1 transition-colors"
            />
            {showNameWarning && (
              <p className="text-xs text-amber-600 mt-1">
                Will be saved as: {name.replace(/\s+/g, '_')}
              </p>
            )}
          </div>
          <Input
            placeholder="Value"
            value={value}
            onChange={(e) => onChange("value", e.target.value)}
            required
            className="h-11 text-base border border-border/50 bg-background/50 hover:bg-background/80 focus-visible:ring-1 transition-colors"
          />
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-11 w-11"
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
