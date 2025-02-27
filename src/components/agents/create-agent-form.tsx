import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Agent } from "@/types/agent";
import { CreateAgentProgress } from "./create-agent-progress";
import { NameStep } from "./form-steps/name-step";
import { TriggerStep } from "./form-steps/trigger-step";
import { TemplateStep } from "./form-steps/template-step";
import { platforms, platformActions } from "./utils/platform-constants";
import { NodeData, FlowData, NodeType } from "@/types/agent";

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
    template: '',
  });

  const createInitialFlow = (platform: string, action: string): FlowData => {
    return {
      nodes: [
        {
          id: 'trigger-1',
          type: 'triggerNode' as NodeType,
          position: { x: 50, y: 150 },
          data: {
            platform: platform as NodeData['platform'],
            action: action as NodeData['action']
          }
        },
        {
          id: 'greeting-1',
          type: 'greetingNode' as NodeType,
          position: { x: 350, y: 150 },
          data: {
            greeting: "Hi! How can I help you today?",
            outcomes: ["Continue"]
          }
        },
        {
          id: 'speak-1',
          type: 'speakNode' as NodeType,
          position: { x: 650, y: 150 },
          data: {
            message: "I'm here to assist you. What would you like to know?",
            outcomes: ["End Call"]
          }
        },
        {
          id: 'end-1',
          type: 'endNode' as NodeType,
          position: { x: 950, y: 150 },
          data: {}
        }
      ],
      edges: [
        {
          id: 'e1-2',
          source: 'trigger-1',
          target: 'greeting-1',
          animated: true
        },
        {
          id: 'e2-3',
          source: 'greeting-1',
          target: 'speak-1',
          animated: true,
          sourceHandle: 'outcome-0'
        },
        {
          id: 'e3-4',
          source: 'speak-1',
          target: 'end-1',
          animated: true,
          sourceHandle: 'outcome-0'
        }
      ]
    };
  };

  const handleCreateAgent = async () => {
    if (!newAgent.name || !newAgent.platform || !newAgent.action) {
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
      const flow = createInitialFlow(newAgent.platform, newAgent.action);
      console.log('Creating agent with flow:', flow); // Debug log
      
      const { data, error } = await supabase
        .from('agents')
        .insert({
          name: newAgent.name,
          role: newAgent.role,
          user_id: session.user.id,
          flow: JSON.stringify(flow),
          is_active: true,
          objective: 'answer_calls',
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
          <TemplateStep
            selectedTemplate={newAgent.template}
            onTemplateSelect={(templateId, role) => {
              setNewAgent(prev => ({ ...prev, template: templateId, role }));
              setStep(3);
            }}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
            showOnlyScratch={true}
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
