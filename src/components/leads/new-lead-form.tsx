
import { useState } from "react";
import { Plus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PhoneInput } from "@/components/ui/phone-input";
import { Separator } from "@/components/ui/separator";

interface NewLeadFormProps {
  onSuccess: () => void;
}

export function NewLeadForm({ onSuccess }: NewLeadFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [variables, setVariables] = useState<{ name: string; value: string }[]>([]);
  const [phone, setPhone] = useState("");

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

      // Insert the lead
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

      // Insert variables if any
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
    setVariables([...variables, { name: "", value: "" }]);
  };

  const removeVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const updateVariable = (index: number, field: "name" | "value", value: string) => {
    const newVariables = [...variables];
    newVariables[index][field] = value;
    setVariables(newVariables);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        {/* Contact Information Section */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-base font-normal text-muted-foreground">First name</Label>
              <Input 
                id="firstName" 
                name="firstName" 
                required 
                className="h-12 text-lg border-0 bg-muted/40 focus-visible:ring-1 transition-all duration-200"
                placeholder="John"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-base font-normal text-muted-foreground">Last name</Label>
              <Input 
                id="lastName" 
                name="lastName" 
                required 
                className="h-12 text-lg border-0 bg-muted/40 focus-visible:ring-1 transition-all duration-200"
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-base font-normal text-muted-foreground">Email</Label>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              className="h-12 text-lg border-0 bg-muted/40 focus-visible:ring-1 transition-all duration-200"
              placeholder="john@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-base font-normal text-muted-foreground">Phone</Label>
            <PhoneInput 
              id="phone"
              name="phone"
              value={phone}
              onChange={(value) => setPhone(value)}
              className="h-12 text-lg"
            />
          </div>
        </div>

        {/* Custom Variables Section */}
        <div className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <Label className="text-xl font-medium">Custom Variables</Label>
            <Button 
              type="button" 
              variant="outline" 
              onClick={addVariable}
              className="h-9 px-4 rounded-full hover:bg-muted/60 transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Variable
            </Button>
          </div>

          {variables.length > 0 ? (
            <div className="space-y-4">
              {variables.map((variable, index) => (
                <div 
                  key={index} 
                  className="grid grid-cols-[1fr,1fr,auto] gap-3 items-start bg-muted/40 p-4 rounded-lg"
                >
                  <Input
                    placeholder="Variable name"
                    value={variable.name}
                    onChange={(e) => updateVariable(index, "name", e.target.value)}
                    required
                    className="border-0 bg-background/50 focus-visible:ring-1"
                  />
                  <Input
                    placeholder="Value"
                    value={variable.value}
                    onChange={(e) => updateVariable(index, "value", e.target.value)}
                    required
                    className="border-0 bg-background/50 focus-visible:ring-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeVariable(index)}
                    className="mt-1"
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-base text-muted-foreground text-center py-8 bg-muted/40 rounded-lg">
              No variables added yet. Click "Add Variable" to start adding custom fields to this lead.
            </p>
          )}
        </div>
      </div>

      <Button 
        type="submit" 
        disabled={isLoading}
        className="w-full h-12 text-lg rounded-full transition-all duration-200 hover:scale-[0.98]"
      >
        {isLoading ? "Adding..." : `Save Lead${variables.length > 0 ? ` with ${variables.length} Variable${variables.length === 1 ? '' : 's'}` : ''}`}
      </Button>
    </form>
  );
}
