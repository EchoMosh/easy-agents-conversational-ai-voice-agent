
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight, Wand2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Agent, AGENT_ROLES, AGENT_TEMPLATES, NodeData } from "@/types/agent";
import { motion } from "framer-motion";
import { CreateAgentProgress } from "./create-agent-progress";

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
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Name Your Agent</h2>
              <p className="text-muted-foreground">Choose a name that reflects your agent's purpose</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">What would you like to name your agent?</Label>
              <Input
                id="name"
                placeholder="Enter agent name"
                value={newAgent.name}
                onChange={(e) => setNewAgent(prev => ({ ...prev, name: e.target.value }))}
                className="text-lg py-6"
              />
            </div>
            <Button 
              className="w-full relative" 
              size="lg"
              onClick={() => setStep(2)}
              disabled={!newAgent.name}
            >
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Choose Template</h2>
              <p className="text-muted-foreground">Start from scratch or use a pre-built template</p>
            </div>

            <div className="grid gap-4">
              <Card 
                className={`cursor-pointer transition-all ${
                  selectedTemplate === '' ? 'ring-2 ring-primary' : 'hover:border-primary'
                }`}
                onClick={() => {
                  setSelectedTemplate('');
                  setNewAgent(prev => ({ ...prev, role: 'virtual_assistant' }));
                }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-5 w-5" />
                    Start from Scratch
                  </CardTitle>
                  <CardDescription>
                    Create a custom agent with your own flow
                  </CardDescription>
                </CardHeader>
              </Card>

              {AGENT_TEMPLATES.map((template) => (
                <Card 
                  key={template.id}
                  className={`cursor-pointer transition-all ${
                    selectedTemplate === template.id ? 'ring-2 ring-primary' : 'hover:border-primary'
                  }`}
                  onClick={() => {
                    setSelectedTemplate(template.id);
                    setNewAgent(prev => ({ ...prev, role: template.role }));
                  }}
                >
                  <CardHeader>
                    <CardTitle>{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="w-full" 
                size="lg"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button 
                className="w-full relative"
                size="lg"
                onClick={() => setStep(3)}
              >
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">Set Up Triggers</h2>
              <p className="text-muted-foreground">Configure when your agent should be activated</p>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>When would you like this agent to be triggered?</Label>
                <Select
                  value={newAgent.platform}
                  onValueChange={(value) => 
                    setNewAgent(prev => ({ ...prev, platform: value, action: '' }))
                  }
                >
                  <SelectTrigger className="text-lg py-6">
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    {platforms.map((platform) => (
                      <SelectItem key={platform.value} value={platform.value}>
                        {platform.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {newAgent.platform && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-2"
                >
                  <Label>Select the trigger event</Label>
                  <Select
                    value={newAgent.action}
                    onValueChange={(value) => 
                      setNewAgent(prev => ({ ...prev, action: value }))
                    }
                  >
                    <SelectTrigger className="text-lg py-6">
                      <SelectValue placeholder="Select trigger event" />
                    </SelectTrigger>
                    <SelectContent>
                      {platformActions[newAgent.platform].map((action) => (
                        <SelectItem key={action.value} value={action.value}>
                          {action.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </motion.div>
              )}
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="w-full" 
                size="lg"
                onClick={() => setStep(2)}
              >
                Back
              </Button>
              <Button 
                className="w-full relative"
                size="lg"
                onClick={handleCreateAgent} 
                disabled={isCreating || !newAgent.platform || !newAgent.action}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Agent...
                  </>
                ) : (
                  'Create Agent'
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
