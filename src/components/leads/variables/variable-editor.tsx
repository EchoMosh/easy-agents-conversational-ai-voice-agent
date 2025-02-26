
import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 grid grid-cols-2 gap-2">
        <Input
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="h-11 text-base border border-border/50 bg-background/50 hover:bg-background/80 focus-visible:ring-1 transition-colors"
        />
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
  );
}
