
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
      // First, create an agent in ElevenLabs
      const { data: elevenlabsData, error: elevenlabsError } = await supabase.functions.invoke('create-elevenlabs-agent', {
        body: {
          name: newAgent.name,
          role: newAgent.role,
          objective: 'answer_calls'
        }
      });

      if (elevenlabsError) {
        console.error('Error creating ElevenLabs agent:', elevenlabsError);
        throw new Error('Failed to create ElevenLabs agent');
      }

      if (!elevenlabsData?.success || !elevenlabsData?.elevenlabsAgentId) {
        console.error('ElevenLabs agent creation failed:', elevenlabsData);
        throw new Error('Failed to create ElevenLabs agent: ' + (elevenlabsData?.error || 'Unknown error'));
      }

      console.log('Successfully created ElevenLabs agent with ID:', elevenlabsData.elevenlabsAgentId);

      const flow = getDefaultFlow();
      
      // Then, create the agent in our database with the ElevenLabs agent ID
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
          elevenlabs_agent_id: elevenlabsData.elevenlabsAgentId // Store the ElevenLabs agent ID
        })
        .select()
        .single();

      if (error) throw error;

      await onSuccess(data.id);
      navigate(`/dashboard/agents/flow/${data.id}`, { replace: true });
    } catch (error) {
      console.error('Error creating agent:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: typeof error === 'object' && error !== null && 'message' in error 
          ? String(error.message) 
          : "Failed to create agent",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6 py-6">
      <CreateAgentProgress currentStep={step} totalSteps={2} />
      
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
