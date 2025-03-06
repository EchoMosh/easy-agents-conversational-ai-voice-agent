
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
  const [webhookDetails, setWebhookDetails] = useState<string | null>(null);
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
    setWebhookDetails(null);

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
        
      console.log('Profile data retrieved:', profile);
      
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
      
      console.log('Prepared webhook payload:', JSON.stringify(webhookPayload));
      console.log('Network status: ', navigator.onLine ? 'Online' : 'Offline');
      console.log('Starting webhook call to n8n at:', new Date().toISOString());
      
      // Send the data to the webhook with proper error handling
      let webhookResult;
      try {
        setIsWebhookPending(true);
        setWebhookDetails("Connecting to n8n webhook...");
        console.log('Sending webhook request to: https://moshi.app.n8n.cloud/webhook-test/create-agent');
        
        // Add more detailed request information
        console.log('Request method: POST');
        console.log('Request headers:', {
          'Content-Type': 'application/json',
        });
        
        const payloadSize = new Blob([JSON.stringify(webhookPayload)]).size;
        console.log('Request payload size (bytes):', payloadSize);
        console.log('Full request payload for debugging:', JSON.stringify(webhookPayload, null, 2));
        
        const startTime = performance.now();
        setWebhookDetails("Initializing request to n8n webhook...");
        
        let webhookResponse;
        const webhookUrl = 'https://moshi.app.n8n.cloud/webhook-test/create-agent';
        
        try {
          setWebhookDetails("Sending request to n8n webhook...");
          console.log(`DNS prefetch attempt for: ${new URL(webhookUrl).hostname}`);
          
          // Try to prefetch the DNS to see if there's any resolution issues
          if ('preconnect' in document.createElement('link')) {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = webhookUrl;
            document.head.appendChild(link);
            console.log('Preconnect link added');
            
            // Remove after 2 seconds
            setTimeout(() => {
              document.head.removeChild(link);
            }, 2000);
          }
          
          // Add timeout to the fetch request
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
          
          console.log('Initiating fetch with timeout at:', new Date().toISOString());
          webhookResponse = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(webhookPayload),
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
          const endTime = performance.now();
          console.log(`Webhook request completed in ${endTime - startTime}ms with status: ${webhookResponse.status}`);
          console.log('Response headers:', [...webhookResponse.headers.entries()]);
          
        } catch (fetchError) {
          const endTime = performance.now();
          console.error(`Fetch operation failed after ${endTime - startTime}ms:`, fetchError);
          console.error('Error type:', fetchError instanceof Error ? fetchError.constructor.name : typeof fetchError);
          console.error('Error message:', fetchError instanceof Error ? fetchError.message : String(fetchError));
          
          if (fetchError.name === 'AbortError') {
            console.error('Request was aborted due to timeout');
            throw new Error('Request timed out after 30 seconds');
          }
          
          if (fetchError instanceof TypeError) {
            console.error('This might be a CORS, network connectivity, or firewall issue');
            
            // Try to ping the domain to check connectivity
            console.log('Attempting to check if domain is reachable...');
            try {
              const pingImg = new Image();
              pingImg.onload = () => console.log('Domain appears to be reachable');
              pingImg.onerror = () => console.log('Domain appears to be unreachable');
              pingImg.src = `https://${new URL(webhookUrl).hostname}/favicon.ico?${new Date().getTime()}`;
            } catch (pingError) {
              console.error('Error while pinging domain:', pingError);
            }
          }
          
          setWebhookDetails("Connection to external service failed");
          throw new Error(`Connection failed: ${fetchError instanceof Error ? fetchError.message : 'Network error'}`);
        }
        
        setIsWebhookPending(false);
        setWebhookDetails("Webhook request completed, processing response...");
        
        if (!webhookResponse.ok) {
          const contentType = webhookResponse.headers.get('content-type');
          console.error('Response status:', webhookResponse.status);
          console.error('Response status text:', webhookResponse.statusText);
          console.error('Response content type:', contentType);
          
          let errorText;
          try {
            if (contentType && contentType.includes('application/json')) {
              const errorJson = await webhookResponse.json();
              errorText = JSON.stringify(errorJson);
              console.error('JSON error response:', errorJson);
            } else {
              errorText = await webhookResponse.text();
              console.error('Text error response:', errorText);
            }
          } catch (parseError) {
            console.error('Error parsing response:', parseError);
            errorText = `Failed to parse error response: ${parseError}`;
          }
          
          setWebhookDetails(null);
          throw new Error(`Webhook failed with status ${webhookResponse.status}: ${errorText}`);
        }
        
        // Parse webhook response
        try {
          setWebhookDetails("Parsing webhook response...");
          console.log('Attempting to parse response as JSON');
          const responseText = await webhookResponse.text();
          console.log('Raw response text:', responseText);
          
          try {
            webhookResult = responseText ? JSON.parse(responseText) : {};
            console.log('Webhook response successfully parsed:', webhookResult);
          } catch (jsonParseError) {
            console.error('JSON parse error:', jsonParseError);
            console.error('Response text causing parse error:', responseText);
            throw new Error(`Failed to parse webhook response as JSON: ${jsonParseError.message}`);
          }
        } catch (responseError) {
          console.error('Error processing response:', responseError);
          setWebhookDetails(null);
          throw new Error(`Failed to process webhook response: ${responseError.message}`);
        }
        
      } catch (webhookError) {
        console.error('Webhook connection error:', webhookError);
        // Log all properties of the error object for debugging
        if (webhookError instanceof Error) {
          console.error('Error name:', webhookError.name);
          console.error('Error message:', webhookError.message);
          console.error('Error stack:', webhookError.stack);
        } else {
          console.error('Non-Error webhook error type:', typeof webhookError);
          console.error('String representation:', String(webhookError));
        }
        
        const errorMessage = webhookError instanceof Error ? webhookError.message : String(webhookError);
        setError(`Failed to connect to external service: ${errorMessage}`);
        setIsCreating(false);
        setIsWebhookPending(false);
        setWebhookDetails(null);
        
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to create agent: Could not connect to external service",
        });
        
        // Critical failure - don't create the agent if webhook fails
        return;
      }
      
      // Only proceed with agent creation if webhook was successful
      if (!webhookResult) {
        console.error('Webhook did not return a result');
        setError('External service did not return a valid response');
        setIsCreating(false);
        setIsWebhookPending(false);
        setWebhookDetails(null);
        return;
      }
      
      // Extract any needed data from the webhook response
      setWebhookDetails("Webhook successful. Creating agent in database...");
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
        setWebhookDetails(null);
        throw error;
      }

      setWebhookDetails("Agent created successfully, redirecting...");
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
      setWebhookDetails(null);
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
              {webhookDetails && (
                <div className="w-full mt-4 p-2 bg-muted rounded-md">
                  <p className="text-sm text-muted-foreground">{webhookDetails}</p>
                </div>
              )}
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
