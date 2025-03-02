
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Agent } from "@/types/agent-types";
import { CreateAgentProgress } from "./create-agent-progress";
import { NameStep } from "./form-steps/name-step";
import { TemplateStep } from "./form-steps/template-step";
import { getDefaultFlow } from "./utils/default-flow";

interface CreateAgentFormProps {
  onSuccess: (agentId: string) => Promise<void>;
  onCancel: () => void;
}

export function CreateAgentForm({ onSuccess, onCancel }: CreateAgentFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newAgent, setNewAgent] = useState<{
    name: string;
    role: Agent["role"];
    template: string;
  }>({
    name: '',
    role: 'virtual_assistant',
    template: '',
  });

  const handleCreateAgent = async () => {
    if (!newAgent.name) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    setIsCreating(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to create an agent",
      });
      setIsCreating(false);
      return;
    }

    try {
      console.log('Creating agent with name:', newAgent.name, 'role:', newAgent.role);
      
      // Make POST request to the webhook
      const response = await fetch('https://moshi.app.n8n.cloud/webhook/create-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: session.user.id,
          email: session.user.email,
          name: newAgent.name,
          role: newAgent.role
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to create agent: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Webhook response:', result);
      
      // More robust check for response - looking for agent_id in various possible formats
      let agentId = null;
      
      if (Array.isArray(result) && result.length > 0) {
        // Format: [{agent_id: "xxx"}]
        agentId = result[0].agent_id;
      } else if (result && typeof result === 'object') {
        // Format: {agent_id: "xxx"} or other object structure
        agentId = result.agent_id;
      }
      
      if (!agentId) {
        console.error('No agent_id found in response:', result);
        throw new Error("Could not retrieve agent ID from the webhook response");
      }
      
      toast({
        title: "Success",
        description: "Agent created successfully. Redirecting to flow editor...",
      });
      
      // Create or save the agent in our database
      const flow = getDefaultFlow();
      
      const { data, error } = await supabase
        .from('agents')
        .insert({
          name: newAgent.name,
          role: newAgent.role,
          user_id: session.user.id,
          flow: JSON.stringify(flow),
          is_active: true,
          objective: 'answer_calls',
          interaction_type: ['inbound'],
          elevenlabs_agent_id: agentId
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating agent in database:', error);
        setError(`Failed to create agent in database: ${error.message}`);
        throw error;
      }

      await onSuccess(data.id);
      navigate(`/dashboard/agents/flow/${data.id}`, { replace: true });
    } catch (error) {
      console.error('Error creating agent:', error);
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error 
        ? String(error.message) 
        : "Failed to create agent";
      
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6 py-6">
      <CreateAgentProgress currentStep={step} totalSteps={2} />
      
      {error && (
        <div className="bg-destructive/20 p-4 rounded-md text-sm text-destructive mb-4">
          <p className="font-semibold">Error creating agent:</p>
          <p className="whitespace-pre-line">{error}</p>
        </div>
      )}
      
      <div className="space-y-6">
        {step === 1 && (
          <NameStep
            name={newAgent.name}
            onNameChange={(name) => setNewAgent(prev => ({ ...prev, name }))}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <TemplateStep
            selectedTemplate={newAgent.template}
            onTemplateSelect={(templateId, role) => {
              setNewAgent(prev => ({ ...prev, template: templateId, role }));
              handleCreateAgent();
            }}
            onNext={() => {}} // Added to satisfy type requirement
            onBack={() => setStep(1)}
            showOnlyScratch={true}
          />
        )}
      </div>
    </div>
  );
}
