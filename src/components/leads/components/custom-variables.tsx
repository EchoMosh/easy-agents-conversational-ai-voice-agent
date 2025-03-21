
import { useState } from "react";
import { Plus, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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

export function CustomVariables({ variables, onAddVariable, onRemoveVariable }: CustomVariablesProps) {
  const [isAddingVariable, setIsAddingVariable] = useState(false);
  const [newVariable, setNewVariable] = useState<Variable>({ name: "", value: "" });

  const handleAddVariable = () => {
    if (newVariable.name && newVariable.value) {
      // Convert spaces to underscores in variable name
      const formattedName = newVariable.name.replace(/\s+/g, '_');
      
      // Check if variable name already exists
      const isDuplicate = variables.some(v => v.name.toLowerCase() === formattedName.toLowerCase());
      if (isDuplicate) {
        toast.error("A variable with this name already exists", {
          description: "Please use a different name for your variable",
        });
        return;
      }
      
      // Use the formatted name (with underscores instead of spaces)
      onAddVariable({ name: formattedName, value: newVariable.value });
      setNewVariable({ name: "", value: "" });
      setIsAddingVariable(false);
      
      // Show a toast if the name was modified
      if (formattedName !== newVariable.name) {
        toast.info("Spaces converted to underscores", {
          description: `"${newVariable.name}" was saved as "${formattedName}"`,
        });
      }
    }
  };

  return (
    <div className="pt-8 py-0">
      <div className="flex items-center justify-between mb-6">
        <Label className="text-xl font-semibold text-gray-800">Custom Variables</Label>
        <Dialog open={isAddingVariable} onOpenChange={setIsAddingVariable}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="h-10 px-5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors text-gray-800">
              <Plus className="h-4 w-4 mr-2" />
              Add Variable
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] p-6 bg-white border border-gray-200 z-[102]">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-xl text-gray-800">Add Variable</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="variableName" className="text-sm font-medium text-gray-700">Variable name</Label>
                <Input 
                  id="variableName" 
                  placeholder="e.g., Source (spaces will be converted to underscores)" 
                  value={newVariable.name} 
                  onChange={e => setNewVariable(prev => ({ ...prev, name: e.target.value }))}
                  className="h-11 text-base border border-gray-300 bg-white hover:bg-gray-50 focus-visible:ring-1 transition-colors" 
                />
                {newVariable.name.includes(' ') && (
                  <p className="text-xs text-amber-600">
                    Will be saved as: {newVariable.name.replace(/\s+/g, '_')}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="variableValue" className="text-sm font-medium text-gray-700">Value</Label>
                <Input 
                  id="variableValue" 
                  placeholder="e.g., Website" 
                  value={newVariable.value} 
                  onChange={e => setNewVariable(prev => ({ ...prev, value: e.target.value }))}
                  className="h-11 text-base border border-gray-300 bg-white hover:bg-gray-50 focus-visible:ring-1 transition-colors" 
                />
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button 
                type="button" 
                onClick={handleAddVariable} 
                disabled={!newVariable.name || !newVariable.value} 
                className="px-6 text-white"
              >
                Add Variable
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-lg border border-gray-300 bg-white">
        <div className="relative p-6">
          {variables.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {variables.map((variable, index) => (
                <Badge key={index} variant="secondary" className="pl-3 pr-2 py-1.5 h-8 text-sm bg-gray-100 hover:bg-gray-200 transition-all duration-200 border border-gray-200 shadow-sm text-gray-800">
                  <Tag className="w-3 h-3 mr-2 opacity-50" />
                  <span className="font-normal">{variable.name}:</span>
                  <span className="font-medium ml-1">{variable.value}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => onRemoveVariable(index)} className="h-5 w-5 ml-2 hover:bg-gray-200 rounded-full">
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Tag className="w-8 h-8 mb-3 text-gray-400" />
              <p className="text-sm text-gray-600">
                No variables added yet
              </p>
              <p className="text-xs text-gray-500">
                Click "Add Variable" to start adding custom fields to this lead
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
