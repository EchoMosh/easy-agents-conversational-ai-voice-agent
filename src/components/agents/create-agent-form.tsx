
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Agent } from "@/types/agent";
import { CreateAgentProgress } from "./create-agent-progress";
import { NameStep } from "./form-steps/name-step";
import { ObjectiveStep } from "./form-steps/objective-step";
import { TriggerStep } from "./form-steps/trigger-step";
import { getDefaultFlow } from "./utils/default-flow";
import { platforms, platformActions } from "./utils/platform-constants";

interface CreateAgentFormProps {
  onSuccess: (agentId: string) => Promise<void>;
  onCancel: () => void;
}

export function CreateAgentForm({ onSuccess, onCancel }: CreateAgentFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [newAgent, setNewAgent] = useState({
    name: '',
    role: 'virtual_assistant' as Agent['role'],
    platform: '',
    action: '',
    objective: '' as 'live_transfer' | 'answer_calls' | '',
  });

  const handleCreateAgent = async () => {
    if (!newAgent.name || !newAgent.platform || !newAgent.action || !newAgent.objective) {
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
      const flow = getDefaultFlow(newAgent.platform, newAgent.action, newAgent.objective);

      const { data, error } = await supabase
        .from('agents')
        .insert({
          name: newAgent.name,
          role: newAgent.role,
          user_id: session.user.id,
          flow,
          is_active: true,
          objective: newAgent.objective,
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
        description: "Failed to create agent",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6 py-6">
      <CreateAgentProgress currentStep={step} totalSteps={3} />
      
      <div className="space-y-6">
        {step === 1 && (
          <NameStep
            name={newAgent.name}
            onNameChange={(name) => setNewAgent(prev => ({ ...prev, name }))}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <ObjectiveStep
            objective={newAgent.objective}
            onObjectiveSelect={(objective) => 
              setNewAgent(prev => ({ ...prev, objective }))
            }
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <TriggerStep
            platform={newAgent.platform}
            action={newAgent.action}
            onPlatformChange={(platform) => 
              setNewAgent(prev => ({ ...prev, platform, action: '' }))
            }
            onActionChange={(action) => 
              setNewAgent(prev => ({ ...prev, action }))
            }
            onBack={() => setStep(2)}
            onSubmit={handleCreateAgent}
            isCreating={isCreating}
            platforms={platforms}
            platformActions={platformActions}
          />
        )}
      </div>
    </div>
  );
}
