
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Pipeline, convertJsonToPipeline } from "@/types/pipeline";
import { PipelineSelect } from "./components/pipeline-select";
import { ContactInfoForm } from "./components/contact-info-form";
import { CustomVariables } from "./components/custom-variables";
import { useWorkspace } from "@/context/workspace-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface NewLeadFormProps {
  onSuccess: () => void;
}

interface Variable {
  name: string;
  value: string;
}

export function NewLeadForm({ onSuccess }: NewLeadFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [phone, setPhone] = useState("");
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("contact");
  const { currentWorkspace } = useWorkspace();

  const { data: pipelines = [], refetch: refetchPipelines } = useQuery({
    queryKey: ["pipelines", currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];
      
      const { data, error } = await supabase
        .from("pipelines")
        .select("*")
        .eq("workspace_id", currentWorkspace.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(convertJsonToPipeline);
    },
    enabled: !!currentWorkspace?.id,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!currentWorkspace?.id) {
      toast.error("No workspace selected");
      return;
    }

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

      // Find the selected pipeline if one was chosen
      const selectedPipeline = selectedPipelineId ? 
        pipelines.find(p => p.id === selectedPipelineId) : null;
      
      // Get the first column's title to use as the initial status if a pipeline was selected
      let initialStatus = 'new';
      if (selectedPipeline && selectedPipeline.columns.length > 0) {
        initialStatus = selectedPipeline.columns[0].title;
      }

      const { data: leadData, error: leadError } = await supabase
        .from("leads")
        .insert([{
          name: `${firstName} ${lastName}`.trim(),
          email: email || null,
          phone: phone || null,
          user_id: user.id,
          pipeline_id: selectedPipelineId || null,
          status: initialStatus,
          workspace_id: currentWorkspace.id
        }])
        .select()
        .single();

      if (leadError) throw leadError;

      if (variables.length > 0) {
        const { error: variablesError } = await supabase
          .from("lead_variables")
          .insert(variables.map(v => ({
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs 
        defaultValue="contact" 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 mb-2">
          <TabsTrigger value="contact">Contact Info</TabsTrigger>
          <TabsTrigger value="variables">Variables & Tags</TabsTrigger>
        </TabsList>

        <TabsContent value="contact" className="space-y-4 pt-2">
          <ContactInfoForm 
            phone={phone}
            onPhoneChange={setPhone}
          />
          
          <div className="pt-2">
            <PipelineSelect
              pipelines={pipelines}
              selectedPipelineId={selectedPipelineId}
              onPipelineChange={setSelectedPipelineId}
              refetchPipelines={refetchPipelines}
              required={false}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Pipeline selection is optional
            </p>
          </div>
        </TabsContent>

        <TabsContent value="variables" className="space-y-4 pt-2">
          <CustomVariables
            variables={variables}
            onAddVariable={(variable) => setVariables([...variables, variable])}
            onRemoveVariable={(index) => setVariables(variables.filter((_, i) => i !== index))}
          />
        </TabsContent>
      </Tabs>

      <Button 
        type="submit" 
        disabled={isLoading || !currentWorkspace} 
        className="w-full h-11 text-base bg-primary/90 hover:bg-primary transition-all duration-200"
      >
        {isLoading ? "Adding..." : `Save Lead${variables.length > 0 ? ` with ${variables.length} Variable${variables.length === 1 ? '' : 's'}` : ''}`}
      </Button>
    </form>
  );
}
