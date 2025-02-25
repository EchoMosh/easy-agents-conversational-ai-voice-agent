
import { useState } from "react";
import { Plus, Trash, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PhoneInput } from "@/components/ui/phone-input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface NewLeadFormProps {
  onSuccess: () => void;
}

export function NewLeadForm({ onSuccess }: NewLeadFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [variables, setVariables] = useState<{ name: string; value: string }[]>([]);
  const [phone, setPhone] = useState("");
  const [isAddingVariable, setIsAddingVariable] = useState(false);
  const [newVariable, setNewVariable] = useState({ name: "", value: "" });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("No authenticated user found");
      }

      const { data: leadData, error: leadError } = await supabase
        .from("leads")
        .insert([
          {
            name: `${firstName} ${lastName}`.trim(),
            email: email || null,
            phone: phone || null,
            user_id: user.id
          },
        ])
        .select()
        .single();

      if (leadError) throw leadError;

      if (variables.length > 0) {
        const { error: variablesError } = await supabase
          .from("lead_variables")
          .insert(
            variables.map((v) => ({
              lead_id: leadData.id,
              name: v.name,
              value: v.value,
            }))
          );

        if (variablesError) throw variablesError;
      }

      toast.success("Lead added successfully");
      onSuccess();
    } catch (error) {
      toast.error("Failed to add lead");
      console.error("Error adding lead:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const addVariable = () => {
    if (newVariable.name && newVariable.value) {
      // Check if variable name already exists
      const isDuplicate = variables.some(
        v => v.name.toLowerCase() === newVariable.name.toLowerCase()
      );

      if (isDuplicate) {
        toast.error("A variable with this name already exists");
        return;
      }

      setVariables([...variables, { ...newVariable }]);
      setNewVariable({ name: "", value: "" });
      setIsAddingVariable(false);
    }
  };

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        {/* Contact Information Section */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium text-muted-foreground">First name</Label>
              <Input 
                id="firstName" 
                name="firstName" 
                required 
                className="h-11 text-base border-0 bg-muted/30 hover:bg-muted/40 focus-visible:ring-1 transition-colors"
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium text-muted-foreground">Last name</Label>
              <Input 
                id="lastName" 
                name="lastName" 
                required 
                className="h-11 text-base border-0 bg-muted/30 hover:bg-muted/40 focus-visible:ring-1 transition-colors"
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">Email</Label>
              <Input 
                id="email" 
                name="email" 
                type="email" 
                className="h-11 text-base border-0 bg-muted/30 hover:bg-muted/40 focus-visible:ring-1 transition-colors"
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-muted-foreground">Phone</Label>
              <PhoneInput 
                id="phone"
                name="phone"
                value={phone}
                onChange={(value) => setPhone(value)}
                className="[&>div]:!h-11 [&>div]:!text-base [&>div]:!border-0 [&>div]:!bg-muted/30 [&>div]:hover:!bg-muted/40 [&>div]:!transition-colors [&>div>div]:!border-0 [&>div>div]:!bg-muted/30 [&>div>div]:hover:!bg-muted/40"
              />
            </div>
          </div>
        </div>

        {/* Custom Variables Section */}
        <div className="pt-8">
          <div className="flex items-center justify-between mb-6">
            <Label className="text-xl font-semibold">Custom Variables</Label>
            <Dialog open={isAddingVariable} onOpenChange={setIsAddingVariable}>
              <DialogTrigger asChild>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  className="h-10 px-5 rounded-full border border-border/50 bg-background/50 backdrop-blur-sm hover:bg-muted/10 transition-colors"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Variable
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] p-6 bg-background/95 backdrop-blur-sm">
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-xl">Add Variable</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="variableName" className="text-sm font-medium text-muted-foreground">Variable name</Label>
                    <Input
                      id="variableName"
                      placeholder="e.g., Source"
                      value={newVariable.name}
                      onChange={(e) => setNewVariable({ ...newVariable, name: e.target.value })}
                      className="h-11 text-base border-0 bg-muted/30 hover:bg-muted/40 focus-visible:ring-1 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="variableValue" className="text-sm font-medium text-muted-foreground">Value</Label>
                    <Input
                      id="variableValue"
                      placeholder="e.g., Website"
                      value={newVariable.value}
                      onChange={(e) => setNewVariable({ ...newVariable, value: e.target.value })}
                      className="h-11 text-base border-0 bg-muted/30 hover:bg-muted/40 focus-visible:ring-1 transition-colors"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <Button 
                    type="button" 
                    onClick={addVariable}
                    disabled={!newVariable.name || !newVariable.value}
                    className="rounded-full px-6"
                  >
                    Add Variable
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-b from-background/10 to-background/30 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/25 to-background/50 pointer-events-none" />
            
            <div className="relative p-6">
              {variables.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {variables.map((variable, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="pl-3 pr-2 py-1.5 h-8 text-sm bg-background/60 hover:bg-background/80 transition-all duration-200 backdrop-blur-sm border border-border/50 shadow-sm"
                    >
                      <Tag className="w-3 h-3 mr-2 opacity-50" />
                      <span className="font-normal">{variable.name}:</span>
                      <span className="font-medium ml-1">{variable.value}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeVariable(index)}
                        className="h-5 w-5 ml-2 hover:bg-muted/40 rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No variables added yet. Click "Add Variable" to start adding custom fields to this lead.
                </p>
              )}
            </div>
          </div>
        </div>

      </div>

      <Button 
        type="submit" 
        disabled={isLoading}
        className="w-full h-11 text-base rounded-full transition-all duration-200 hover:scale-[0.98]"
      >
        {isLoading ? "Adding..." : `Save Lead${variables.length > 0 ? ` with ${variables.length} Variable${variables.length === 1 ? '' : 's'}` : ''}`}
      </Button>
    </form>
  );
}
