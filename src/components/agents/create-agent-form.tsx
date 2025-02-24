import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Agent, AGENT_TEMPLATES } from "@/types/agent";
import { CreateAgentProgress } from "./create-agent-progress";
import { NameStep } from "./form-steps/name-step";
import { TemplateStep } from "./form-steps/template-step";
import { TriggerStep } from "./form-steps/trigger-step";

interface CreateAgentFormProps {
  onSuccess: (agentId: string) => Promise<void>;
  onCancel: () => void;
}

const getDefaultFlow = (platform?: string, action?: string) => ({
  nodes: [
    {
      id: 'trigger-1',
      type: 'triggerNode',
      position: { x: 100, y: 100 },
      data: {
        platform,
        action
      }
    },
    {
      id: 'greeting-1',
      type: 'greetingNode',
      position: { x: 500, y: 100 },
      data: {
        greeting: "Hello! How can I help you today?",
        outcomes: ["I need help with a product", "I have a question"]
      }
    },
    {
      id: 'speak-1',
      type: 'speakNode',
      position: { x: 900, y: 100 },
      data: {
        message: "I'd be happy to assist you. Please let me know what you need help with.",
        outcomes: ["Thanks, that's all", "I have another question"]
      }
    },
    {
      id: 'end-1',
      type: 'endNode',
      position: { x: 1300, y: 100 },
      data: {}
    }
  ],
  edges: [
    {
      id: 'trigger-to-greeting',
      source: 'trigger-1',
      target: 'greeting-1'
    },
    {
      id: 'greeting-to-speak',
      source: 'greeting-1',
      target: 'speak-1',
      sourceHandle: 'outcome-0'
    },
    {
      id: 'speak-to-end',
      source: 'speak-1',
      target: 'end-1',
      sourceHandle: 'outcome-0'
    }
  ]
});

const platforms = [
  { value: 'facebook', label: 'Facebook' },
  { value: 'hubspot', label: 'Hubspot' },
  { value: 'gohighlevel', label: 'GoHighLevel' },
  { value: 'activix', label: 'Activix' },
];

const platformActions: Record<string, { value: string; label: string }[]> = {
  facebook: [
    { value: 'new_lead', label: 'New Lead' },
    { value: 'message_received', label: 'Message Received' },
  ],
  hubspot: [
    { value: 'new_contact', label: 'New Contact' },
    { value: 'deal_stage_changed', label: 'Deal Stage Changed' },
  ],
  gohighlevel: [
    { value: 'contact_created', label: 'Contact Created' },
    { value: 'opportunity_won', label: 'Opportunity Won' },
  ],
  activix: [
    { value: 'ticket_created', label: 'Ticket Created' },
    { value: 'payment_received', label: 'Payment Received' },
  ],
};

export function CreateAgentForm({ onSuccess, onCancel }: CreateAgentFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [newAgent, setNewAgent] = useState({
    name: '',
    role: 'virtual_assistant' as Agent['role'],
    platform: '',
    action: '',
  });

  const handleCreateAgent = async () => {
    if (!newAgent.name || !newAgent.role || !newAgent.platform || !newAgent.action) {
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
      let flow;
      if (selectedTemplate) {
        const template = AGENT_TEMPLATES.find(t => t.id === selectedTemplate);
        flow = template ? template.flow : getDefaultFlow(newAgent.platform, newAgent.action);
      } else {
        flow = getDefaultFlow(newAgent.platform, newAgent.action);
      }

      const { data, error } = await supabase
        .from('agents')
        .insert({
          name: newAgent.name,
          role: newAgent.role,
          user_id: session.user.id,
          flow,
          is_active: true,
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
            selectedTemplate={selectedTemplate}
            onTemplateSelect={(templateId, role) => {
              setSelectedTemplate(templateId);
              setNewAgent(prev => ({ ...prev, role }));
            }}
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
