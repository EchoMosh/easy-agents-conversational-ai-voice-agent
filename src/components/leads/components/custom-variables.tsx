
import { useState } from "react";
import { Plus, Tag, X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Tag as TagType } from "@/types/tag-types";
import { Card } from "@/components/ui/card";

interface Variable {
  name: string;
  value: string;
}

interface CustomVariablesProps {
  variables: Variable[];
  onAddVariable: (variable: Variable) => void;
  onRemoveVariable: (index: number) => void;
  tags?: TagType[];
  onAddTag?: (name: string) => void;
  onRemoveTag?: (id: string) => void;
}

export function CustomVariables({ 
  variables, 
  onAddVariable, 
  onRemoveVariable,
  tags = [], 
  onAddTag,
  onRemoveTag
}: CustomVariablesProps) {
  const [isAddingVariable, setIsAddingVariable] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newVariable, setNewVariable] = useState<Variable>({ name: "", value: "" });
  const [newTagName, setNewTagName] = useState("");
  const [activeTab, setActiveTab] = useState<"variables" | "tags">("variables");

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

  const handleAddTag = () => {
    if (newTagName && onAddTag) {
      onAddTag(newTagName);
      setNewTagName("");
      setIsAddingTag(false);
    }
  };

  return (
    <div className="pt-4">
      <div className="flex items-center justify-between mb-4">
        <Label className="text-lg font-medium text-gray-800">Custom Fields</Label>
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => setActiveTab(value as "variables" | "tags")} 
          className="w-auto"
        >
          <TabsList className="grid w-[240px] grid-cols-2">
            <TabsTrigger value="variables" className="text-sm">Variables</TabsTrigger>
            <TabsTrigger value="tags" className="text-sm">Tags</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <TabsContent value="variables" className="mt-0" hidden={activeTab !== "variables"}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-start gap-2">
            <h3 className="text-base font-medium text-gray-800">Variables</h3>
            <div className="bg-blue-50/50 p-1.5 rounded-md border border-blue-100/50 flex items-start text-xs text-blue-700/80 max-w-md">
              <Info className="h-3 w-3 mt-0.5 mr-1.5 flex-shrink-0 text-blue-400" />
              <p className="text-[11px] text-blue-600/80">For storing data that can be used in workflows</p>
            </div>
          </div>
          <Dialog open={isAddingVariable} onOpenChange={setIsAddingVariable}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="h-9 px-4 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors text-gray-800">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
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
                    className="h-10 text-base border border-gray-300 bg-white hover:bg-gray-50 focus-visible:ring-1 transition-colors" 
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
                    className="h-10 text-base border border-gray-300 bg-white hover:bg-gray-50 focus-visible:ring-1 transition-colors" 
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

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="relative p-3">
            <ScrollArea className="h-[200px] pr-4">
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
                  <Tag className="w-6 h-6 mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    No variables added yet
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Click "Add Variable" to store custom information
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="tags" className="mt-0" hidden={activeTab !== "tags"}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-start gap-2">
            <h3 className="text-base font-medium text-gray-800">Tags</h3>
            <div className="bg-green-50/50 p-1.5 rounded-md border border-green-100/50 flex items-start text-xs text-green-700/80 max-w-md">
              <Info className="h-3 w-3 mt-0.5 mr-1.5 flex-shrink-0 text-green-400" />
              <p className="text-[11px] text-green-600/80">For organizing and filtering your leads</p>
            </div>
          </div>
          <Dialog open={isAddingTag} onOpenChange={setIsAddingTag}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="h-9 px-4 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors text-gray-800">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Tag
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] p-6 bg-white border border-gray-200 z-[102]">
              <DialogHeader className="mb-4">
                <DialogTitle className="text-xl text-gray-800">Add Tag</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="tagName" className="text-sm font-medium text-gray-700">Tag name</Label>
                  <Input 
                    id="tagName" 
                    placeholder="e.g., High Priority" 
                    value={newTagName} 
                    onChange={e => setNewTagName(e.target.value)}
                    className="h-10 text-base border border-gray-300 bg-white hover:bg-gray-50 focus-visible:ring-1 transition-colors" 
                  />
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button 
                  type="button" 
                  onClick={handleAddTag} 
                  disabled={!newTagName} 
                  className="px-6 text-white"
                >
                  Add Tag
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
          <div className="relative p-3">
            <ScrollArea className="h-[200px] pr-4">
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge key={tag.id} variant="secondary" className="pl-3 pr-2 py-1.5 h-8 text-sm bg-green-50 hover:bg-green-100 transition-all duration-200 border border-green-100 shadow-sm text-green-800">
                      <Tag className="w-3 h-3 mr-2 opacity-50" />
                      <span className="font-medium">{tag.name}</span>
                      {onRemoveTag && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onRemoveTag(tag.id)} 
                          className="h-5 w-5 ml-2 hover:bg-green-200 rounded-full"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Tag className="w-6 h-6 mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    No tags added yet
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Click "Add Tag" to help organize this lead
                  </p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </TabsContent>
    </div>
  );
}
