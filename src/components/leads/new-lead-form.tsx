
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Pipeline, convertJsonToPipeline } from "@/types/pipeline";

interface NewLeadFormProps {
  onSuccess: () => void;
}

export function NewLeadForm({ onSuccess }: NewLeadFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [variables, setVariables] = useState<{
    name: string;
    value: string;
  }[]>([]);
  const [phone, setPhone] = useState("");
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");
  const [isAddingVariable, setIsAddingVariable] = useState(false);
  const [newVariable, setNewVariable] = useState({
    name: "",
    value: ""
  });

  const { data: pipelines = [] } = useQuery({
    queryKey: ["pipelines"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pipelines")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(convertJsonToPipeline);
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!selectedPipelineId) {
      toast.error("Please select a pipeline");
      return;
    }

    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No authenticated user found");
      }
      const {
        data: leadData,
        error: leadError
      } = await supabase.from("leads").insert([{
        name: `${firstName} ${lastName}`.trim(),
        email: email || null,
        phone: phone || null,
        user_id: user.id,
        pipeline_id: selectedPipelineId,
        status: 'new'
      }]).select().single();
      if (leadError) throw leadError;
      if (variables.length > 0) {
        const {
          error: variablesError
        } = await supabase.from("lead_variables").insert(variables.map(v => ({
          lead_id: leadData.id,
          name: v.name,
          value: v.value
        })));
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
      const isDuplicate = variables.some(v => v.name.toLowerCase() === newVariable.name.toLowerCase());
      if (isDuplicate) {
        toast.error("A variable with this name already exists", {
          description: "Please use a different name for your variable",
        });
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

  return <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        {/* Pipeline Selection */}
        <div className="space-y-2">
          <Label htmlFor="pipeline" className="text-sm font-medium text-muted-foreground">Pipeline</Label>
          <Select value={selectedPipelineId} onValueChange={setSelectedPipelineId} required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a pipeline" />
            </SelectTrigger>
            <SelectContent>
              {pipelines.map((pipeline) => (
                <SelectItem key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Contact Information Section */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-sm font-medium text-muted-foreground">First name</Label>
              <Input id="firstName" name="firstName" required className="h-11 text-base border border-border/50 bg-background/50 hover:bg-background/80 focus-visible:ring-1 transition-colors" placeholder="John" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-sm font-medium text-muted-foreground">Last name</Label>
              <Input id="lastName" name="lastName" required className="h-11 text-base border border-border/50 bg-background/50 hover:bg-background/80 focus-visible:ring-1 transition-colors" placeholder="Doe" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-muted-foreground">Email</Label>
              <Input id="email" name="email" type="email" className="h-11 text-base border border-border/50 bg-background/50 hover:bg-background/80 focus-visible:ring-1 transition-colors" placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium text-muted-foreground">Phone</Label>
              <PhoneInput id="phone" name="phone" value={phone} onChange={value => setPhone(value)} className="[&>div]:!h-11 [&>div]:!text-base [&>div]:!border-border/50 [&>div]:!bg-background/50 [&>div]:hover:!bg-background/80 [&>div]:!transition-colors [&>div>div]:!border-border/50 [&>div>div]:!bg-background/50 [&>div>div]:hover:!bg-background/80" />
            </div>
          </div>
        </div>

        {/* Custom Variables Section */}
        <div className="pt-8 py-0">
          <div className="flex items-center justify-between mb-6">
            <Label className="text-xl font-semibold">Custom Variables</Label>
            <Dialog open={isAddingVariable} onOpenChange={setIsAddingVariable}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="h-10 px-5 rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-colors">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Variable
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] p-6 bg-background/95 backdrop-blur-sm border border-border/50">
                <DialogHeader className="mb-4">
                  <DialogTitle className="text-xl">Add Variable</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="variableName" className="text-sm font-medium text-muted-foreground">Variable name</Label>
                    <Input id="variableName" placeholder="e.g., Source" value={newVariable.name} onChange={e => setNewVariable({
                    ...newVariable,
                    name: e.target.value
                  })} className="h-11 text-base border border-border/50 bg-background/50 hover:bg-background/80 focus-visible:ring-1 transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="variableValue" className="text-sm font-medium text-muted-foreground">Value</Label>
                    <Input id="variableValue" placeholder="e.g., Website" value={newVariable.value} onChange={e => setNewVariable({
                    ...newVariable,
                    value: e.target.value
                  })} className="h-11 text-base border border-border/50 bg-background/50 hover:bg-background/80 focus-visible:ring-1 transition-colors" />
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <Button type="button" onClick={addVariable} disabled={!newVariable.name || !newVariable.value} className="px-6">
                    Add Variable
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="overflow-hidden rounded-lg border border-border/50 bg-gradient-to-b from-background/50 via-background/30 to-background/50">
            <div className="relative p-6">
              {variables.length > 0 ? <div className="flex flex-wrap gap-2">
                  {variables.map((variable, index) => <Badge key={index} variant="secondary" className="pl-3 pr-2 py-1.5 h-8 text-sm bg-background/80 hover:bg-background/90 transition-all duration-200 border border-border/50 shadow-sm">
                      <Tag className="w-3 h-3 mr-2 opacity-50" />
                      <span className="font-normal">{variable.name}:</span>
                      <span className="font-medium ml-1">{variable.value}</span>
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeVariable(index)} className="h-5 w-5 ml-2 hover:bg-background/80 rounded-full">
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>)}
                </div> : <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Tag className="w-8 h-8 mb-3 text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    No variables added yet
                  </p>
                  <p className="text-xs text-muted-foreground/80">
                    Click "Add Variable" to start adding custom fields to this lead
                  </p>
                </div>}
            </div>
          </div>
        </div>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full h-11 text-base bg-primary/90 hover:bg-primary transition-all duration-200">
        {isLoading ? "Adding..." : `Save Lead${variables.length > 0 ? ` with ${variables.length} Variable${variables.length === 1 ? '' : 's'}` : ''}`}
      </Button>
    </form>;
}
