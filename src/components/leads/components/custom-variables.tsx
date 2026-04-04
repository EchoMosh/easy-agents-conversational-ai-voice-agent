import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Variable {
  name: string;
  value: string;
}

interface CustomVariablesProps {
  variables: Variable[];
  onAddVariable: (variable: Variable) => void;
  onRemoveVariable: (index: number) => void;
}

export function CustomVariables({
  variables,
  onAddVariable,
  onRemoveVariable,
}: CustomVariablesProps) {
  const [newVariable, setNewVariable] = useState<Variable>({
    name: "",
    value: "",
  });

  const handleAddVariable = () => {
    if (newVariable.name && newVariable.value) {
      const formattedName = newVariable.name.replace(/\s+/g, "_");

      const isDuplicate = variables.some(
        (v) => v.name.toLowerCase() === formattedName.toLowerCase(),
      );
      if (isDuplicate) {
        toast.error("A variable with this name already exists");
        return;
      }

      onAddVariable({ name: formattedName, value: newVariable.value });
      setNewVariable({ name: "", value: "" });
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Variable name"
          value={newVariable.name}
          onChange={(e) =>
            setNewVariable((prev) => ({ ...prev, name: e.target.value }))
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" && newVariable.name && newVariable.value) {
              e.preventDefault();
              handleAddVariable();
            }
          }}
          className="h-9 text-sm flex-1"
        />
        <Input
          placeholder="Value"
          value={newVariable.value}
          onChange={(e) =>
            setNewVariable((prev) => ({ ...prev, value: e.target.value }))
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" && newVariable.name && newVariable.value) {
              e.preventDefault();
              handleAddVariable();
            }
          }}
          className="h-9 text-sm flex-1"
        />
        <Button
          type="button"
          size="sm"
          onClick={handleAddVariable}
          disabled={!newVariable.name || !newVariable.value}
          className="h-9 px-3"
        >
          Add
        </Button>
      </div>

      {newVariable.name.includes(" ") && (
        <p className="text-xs text-amber-600">
          Will be saved as: {newVariable.name.replace(/\s+/g, "_")}
        </p>
      )}

      {variables.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {variables.map((variable, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="pl-3 pr-1.5 py-1.5 h-8 text-sm"
            >
              <span className="font-normal">{variable.name}:</span>
              <span className="font-medium ml-1">{variable.value}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onRemoveVariable(index)}
                className="h-5 w-5 ml-1.5 rounded-full"
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground py-3 text-center">
          No variables yet
        </p>
      )}
    </div>
  );
}
