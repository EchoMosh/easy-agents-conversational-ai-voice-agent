
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Agent } from "@/types/agent";
import { CreateAgentProgress } from "./create-agent-progress";
import { NameStep } from "./form-steps/name-step";
import { TemplateStep } from "./form-steps/template-step";
import { getDefaultFlow } from "./utils/default-flow";
import { AIVoiceLoader } from "./ai-voice-loader";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface CreateAgentFormProps {
  onSuccess: (agentId: string) => Promise<void>;
  onCancel: () => void;
}

export function CreateAgentForm({ onSuccess, onCancel }: CreateAgentFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [isWebhookPending, setIsWebhookPending] = useState(false);
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
    setIsWebhookPending(true);
    setError(null);

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to create an agent",
      });
      setIsCreating(false);
      setIsWebhookPending(false);
      return;
    }

    try {
      console.log('Creating agent with name:', newAgent.name, 'role:', newAgent.role);
      
      // Get additional user profile information
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, last_name, email, username, avatar_url')
        .eq('id', session.user.id)
        .single();
        
      // Unique tracking ID for this agent creation operation
      const tempAgentId = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      
      // Prepare payload for the webhook
      const webhookPayload = {
        userId: session.user.id,
        email: session.user.email,
        username: profile?.username || session.user.email,
        firstName: profile?.first_name || '',
        lastName: profile?.last_name || '',
        avatarUrl: profile?.avatar_url || '',
        name: newAgent.name,
        role: newAgent.role,
        tempAgentId: tempAgentId,
        createdAt: createdAt,
        source: 'dashboard',
        language: "en" // Setting default language to English
      };
      
      console.log('Sending webhook payload:', webhookPayload);
      
      // Send the data to the webhook with proper error handling
      let webhookResult;
      try {
        setIsWebhookPending(true);
        console.log('Sending webhook request to: https://moshi.app.n8n.cloud/webhook-test/create-agent');
        
        const webhookResponse = await fetch('https://moshi.app.n8n.cloud/webhook-test/create-agent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(webhookPayload),
        });
        
        setIsWebhookPending(false);
        
        if (!webhookResponse.ok) {
          const errorText = await webhookResponse.text();
          console.error('Webhook error:', errorText);
          throw new Error(`Webhook failed with status ${webhookResponse.status}: ${errorText}`);
        }
        
        // Parse webhook response
        webhookResult = await webhookResponse.json();
        console.log('Webhook response:', webhookResult);
        
      } catch (webhookError) {
        console.error('Webhook connection error:', webhookError);
        const errorMessage = webhookError instanceof Error ? webhookError.message : String(webhookError);
        setError(`Failed to connect to external service: ${errorMessage}`);
        setIsCreating(false);
        setIsWebhookPending(false);
        
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create agent: Could not connect to external service",
        });
        
        // Critical failure - don't create the agent if webhook fails
        return;
      }
      
      // Extract any needed data from the webhook response
      const vapiAgentId = webhookResult?.vapiAgentId || tempAgentId;
      
      toast({
        title: "Success",
        description: "Agent created successfully. Redirecting to flow editor...",
      });
      
      // Create the agent in our database
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
          vapi_agent_id: vapiAgentId, // Use the ID from webhook response
          language: "en" // Setting default language to English
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
      setIsWebhookPending(false);
    }
  };

  if (isCreating) {
    return (
      <div className="space-y-6 py-6">
        <AIVoiceLoader />
        {isWebhookPending && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
            <div className="bg-background border border-border rounded-lg shadow-lg p-8 max-w-md w-full mx-auto flex flex-col items-center space-y-4">
              <LoadingSpinner className="h-10 w-10" />
              <h3 className="text-xl font-medium text-foreground">Connecting to service</h3>
              <p className="text-muted-foreground text-center">
                Please wait while we connect to the external service...
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 py-6">
      <CreateAgentProgress currentStep={step} totalSteps={2} />
      
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error creating agent</AlertTitle>
          <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
        </Alert>
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
