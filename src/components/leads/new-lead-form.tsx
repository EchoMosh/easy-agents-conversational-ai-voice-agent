
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
    
    if (!selectedPipelineId) {
      toast.error("Please select a pipeline");
      return;
    }

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

      // Find the selected pipeline
      const selectedPipeline = pipelines.find(p => p.id === selectedPipelineId);
      
      // Get the first column's title to use as the initial status
      let initialStatus = 'new';
      if (selectedPipeline && selectedPipeline.columns.length > 0) {
        // Get the first column's title
        initialStatus = selectedPipeline.columns[0].title;
      }

      const { data: leadData, error: leadError } = await supabase
        .from("leads")
        .insert([{
          name: `${firstName} ${lastName}`.trim(),
          email: email || null,
          phone: phone || null,
          user_id: user.id,
          pipeline_id: selectedPipelineId,
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
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="space-y-6">
        <PipelineSelect
          pipelines={pipelines}
          selectedPipelineId={selectedPipelineId}
          onPipelineChange={setSelectedPipelineId}
          refetchPipelines={refetchPipelines}
        />
        
        <ContactInfoForm 
          phone={phone}
          onPhoneChange={setPhone}
        />

        <CustomVariables
          variables={variables}
          onAddVariable={(variable) => setVariables([...variables, variable])}
          onRemoveVariable={(index) => setVariables(variables.filter((_, i) => i !== index))}
        />
      </div>

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
