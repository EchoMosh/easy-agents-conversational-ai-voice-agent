
import { useState } from "react";
import { Plus, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PhoneInput } from "@/components/ui/phone-input";

interface NewLeadFormProps {
  onSuccess: () => void;
}

export function NewLeadForm({ onSuccess }: NewLeadFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [variables, setVariables] = useState<{ name: string; value: string }[]>([]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;

    try {
      // Insert the lead
      const { data: leadData, error: leadError } = await supabase
        .from("leads")
        .insert([
          {
            name,
            email: email || null,
            phone: phone || null,
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
    <form onSubmit={handleSubmit} className="space-y-6 pt-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name*</Label>
          <Input id="name" name="name" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <PhoneInput 
            id="phone"
            name="phone"
            value=""
            onChange={() => {}}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Custom Variables</Label>
            <Button type="button" variant="outline" size="sm" onClick={addVariable}>
              <Plus className="h-4 w-4 mr-2" />
              Add Variable
            </Button>
          </div>

          {variables.map((variable, index) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="Variable name"
                  value={variable.name}
                  onChange={(e) => updateVariable(index, "name", e.target.value)}
                  required
                />
                <Input
                  placeholder="Value"
                  value={variable.value}
                  onChange={(e) => updateVariable(index, "value", e.target.value)}
                  required
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeVariable(index)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Adding..." : "Add Lead"}
      </Button>
    </form>
  );
}
