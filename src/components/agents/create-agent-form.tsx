import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/context/workspace-context";
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
  const { currentWorkspace } = useWorkspace();
  const [step, setStep] = useState(1); // Start at step 1 (Name)
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creationStatus, setCreationStatus] = useState<string | null>(null);
  const [vAgentId, setVAgentId] = useState<string | null>(null);
  const [newAgent, setNewAgent] = useState<{
    name: string;
    role: Agent["role"];
    template: string;
  }>({
    name: "",
    role: "virtual_assistant",
    template: "",
  });

  const handleNextFromTemplate = async (vAgentIdFromWebhook?: string) => {
    console.log("Received vAgentIdFromWebhook:", vAgentIdFromWebhook);

    if (!vAgentIdFromWebhook) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No agent ID received from n8n, please try again",
      });
      return;
    }

    setVAgentId(vAgentIdFromWebhook);

    // Immediately proceed with agent creation after setting vAgentId
    await handleCreateAgent(vAgentIdFromWebhook);
  };

  const handleCreateAgent = async (currentVAgentId?: string) => {
    // Use the passed in vAgentId or fall back to the state value
    const finalVAgentId = currentVAgentId || vAgentId;

    if (!newAgent.name) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    if (!finalVAgentId) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No agent ID received, please try again",
      });
      return;
    }

    setIsCreating(true);
    setError(null);
    setCreationStatus("Creating agent in database...");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to create an agent",
      });
      setIsCreating(false);
      return;
    }

    if (!currentWorkspace?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No workspace selected. Please select a workspace first.",
      });
      setIsCreating(false);
      return;
    }

    try {
      console.log(
        "Creating agent with name:",
        newAgent.name,
        "role:",
        newAgent.role,
        "v_agent_id:",
        finalVAgentId
      );

      const flow = getDefaultFlow();

      const { data: agentData, error: agentError } = await supabase
        .from("agents")
        .insert({
          name: newAgent.name,
          role: newAgent.role,
          user_id: session.user.id,
          workspace_id: currentWorkspace.id,
          flow: JSON.stringify(flow),
          is_active: true,
          objective: "answer_calls",
          interaction_type: ["inbound"],
          language: "en",
          v_agent_id: finalVAgentId,
        })
        .select()
        .single();

      if (agentError) {
        console.error("Error creating agent in database:", agentError);
        throw new Error(
          `Failed to create agent in database: ${agentError.message}`
        );
      }

      setCreationStatus("Agent created successfully, redirecting...");

      toast({
        title: "Success",
        description:
          "Agent created successfully. Redirecting to flow editor...",
      });

      await onSuccess(agentData.id);
      navigate(`/dashboard/agents/flow/${agentData.id}`, { replace: true });
    } catch (error) {
      console.error("Error creating agent:", error);
      setError(
        typeof error === "object" && error !== null && "message" in error
          ? String(error.message)
          : "Failed to create agent"
      );

      toast({
        variant: "destructive",
        title: "Error",
        description:
          typeof error === "object" && error !== null && "message" in error
            ? String(error.message)
            : "Failed to create agent",
      });
    } finally {
      setIsCreating(false);
      setCreationStatus(null);
    }
  };

  if (isCreating) {
    return (
      <div className="space-y-6 py-6">
        <AIVoiceLoader />
        {creationStatus && (
          <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
            <div className="bg-background border border-border rounded-lg shadow-lg p-8 max-w-md w-full mx-auto flex flex-col items-center space-y-4">
              <LoadingSpinner className="h-10 w-10" />
              <h3 className="text-xl font-medium text-foreground">
                Creating Agent
              </h3>
              <p className="text-muted-foreground text-center">
                {creationStatus}
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
          <AlertDescription className="whitespace-pre-line">
            {error}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {step === 1 && (
          <NameStep
            name={newAgent.name}
            onNameChange={(name) => setNewAgent((prev) => ({ ...prev, name }))}
            onNext={() => setStep(2)} // Proceed to TemplateStep
            onBack={() => onCancel()}
          />
        )}

        {step === 2 && (
          <TemplateStep
            selectedTemplate={newAgent.template}
            onTemplateSelect={(templateId, role) => {
              setNewAgent((prev) => ({ ...prev, template: templateId, role }));
            }}
            onNext={handleNextFromTemplate}
            onBack={() => setStep(1)} // Go back to NameStep
            showOnlyScratch={true}
            agentName={newAgent.name}
          />
        )}
      </div>
    </div>
  );
}
