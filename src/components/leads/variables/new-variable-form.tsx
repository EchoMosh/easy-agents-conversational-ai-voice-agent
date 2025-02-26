
import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 grid grid-cols-2 gap-2">
        <Input
          placeholder="Variable name"
          value={name}
          onChange={(e) => onChange("name", e.target.value)}
          required
          className="h-11 text-base border border-border/50 bg-background/50 hover:bg-background/80 focus-visible:ring-1 transition-colors"
        />
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
  );
}
