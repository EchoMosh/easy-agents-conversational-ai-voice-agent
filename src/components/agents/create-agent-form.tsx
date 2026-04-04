import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/context/workspace-context";
import { Agent } from "@/types/agent";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { CreateAgentProgress } from "./create-agent-progress";
import { NameStep } from "./form-steps/name-step";
import { TemplateStep } from "./form-steps/template-step";
import { ScriptStep } from "./form-steps/script-step";
import { getDefaultFlow } from "./utils/default-flow";
import { AIVoiceLoader } from "./ai-voice-loader";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface CreateAgentFormProps {
  onSuccess: (agentId: string) => Promise<void>;
  onCancel: () => void;
}

export function CreateAgentForm({ onSuccess, onCancel }: CreateAgentFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentWorkspace, isWorkspaceReady } = useWorkspace();
  const [step, setStep] = useState(1); // Start at step 1 (Name)
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creationStatus, setCreationStatus] = useState<string | null>(null);
  const [vAgentId, setVAgentId] = useState<string | null>(null);
  const [scriptText, setScriptText] = useState("");
  const [newAgent, setNewAgent] = useState<{
    name: string;
    role: Agent["role"];
    template: string;
  }>({
    name: "",
    role: "virtual_assistant",
    template: "",
  });

  const handleNextFromTemplate = async () => {
    // Proceed to script upload step
    setStep(3);
  };

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
    setCreationStatus("Validating workspace...");

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

    // Verify the workspace exists in the database
    const { data: workspaceExists, error: workspaceCheckError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("id", currentWorkspace.id)
      .single();

    if (workspaceCheckError || !workspaceExists) {
      console.error("Workspace validation error:", workspaceCheckError);
      toast({
        variant: "destructive",
        title: "Error",
        description:
          "Invalid workspace. Please refresh the page and try again.",
      });
      setIsCreating(false);
      return;
    }

    let createdVAgentId: string | null = null;

    try {
      // Step 1: Create AI agent first
      setCreationStatus("Creating AI agent...");
      console.log("Creating voice agent with name:", newAgent.name);

      try {
        const { data: vapiData, error: vapiError } =
          await supabase.functions.invoke("create-vapi-agent", {
            body: {
              agentName: newAgent.name,
              role: newAgent.role,
              language: "en",
            },
          });

        if (vapiError) {
          console.error("VAPI creation error:", vapiError);
        } else {
          createdVAgentId = vapiData?.v_agent_id || null;
        }
      } catch (vapiErr) {
        console.error(
          "VAPI creation failed, continuing without voice:",
          vapiErr,
        );
      }

      if (!createdVAgentId) {
        console.warn(
          "No VAPI agent created - agent will be created without voice sync",
        );
      }

      console.log("Voice agent created with ID:", createdVAgentId);

      // Step 2: Generate flow from script or use default
      let flow = getDefaultFlow();

      if (scriptText.trim()) {
        setCreationStatus("Analyzing script...");
        try {
          const { data: flowData, error: flowError } =
            await supabase.functions.invoke("generate-agent-flow", {
              body: {
                scriptText,
                agentName: newAgent.name,
                role: newAgent.role,
              },
            });

          if (flowError) {
            console.error("Error generating flow from script:", flowError);
            toast({
              title: "Warning",
              description:
                "Could not generate flow from script. Using default flow instead.",
              variant: "default",
            });
          } else if (flowData?.flow) {
            flow = flowData.flow;
          }
        } catch (flowGenError) {
          console.error("Error invoking generate-agent-flow:", flowGenError);
          toast({
            title: "Warning",
            description:
              "Could not generate flow from script. Using default flow instead.",
            variant: "default",
          });
        }
      }

      // Step 3: Create database record
      setCreationStatus("Creating agent in database...");

      const { data: agentData, error: agentError } = await supabase
        .from("agents")
        .insert({
          name: newAgent.name,
          role: newAgent.role,
          user_id: session.user.id,
          workspace_id: currentWorkspace.id,
          flow: flow,
          is_active: true,
          objective: "answer_calls",
          interaction_type: ["inbound"],
          language: "en",
          v_agent_id: createdVAgentId,
        })
        .select()
        .single();

      if (agentError) {
        console.error("Error creating agent in database:", agentError);
        throw new Error(
          `Failed to create agent in database: ${agentError.message}`,
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

      // If we created a voice agent but failed to create the database record,
      // we should ideally clean up the voice agent, but for now we'll just log it
      if (createdVAgentId) {
        console.warn(
          "Voice agent created but database record failed. Agent ID:",
          createdVAgentId,
        );
      }

      setError(
        typeof error === "object" && error !== null && "message" in error
          ? String(error.message)
          : "Failed to create agent",
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

  if (!isWorkspaceReady) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

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
      <CreateAgentProgress currentStep={step} totalSteps={3} />

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

        {step === 3 && (
          <ScriptStep
            scriptText={scriptText}
            onScriptChange={setScriptText}
            onNext={() => handleCreateAgent()}
            onBack={() => setStep(2)}
            isProcessing={isCreating}
          />
        )}
      </div>
    </div>
  );
}
