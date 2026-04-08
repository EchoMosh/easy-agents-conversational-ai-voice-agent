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
  // Default to Claude Haiku 4.5 — benchmarked at 15.65s for a complex
  // pizza script vs Sonnet 4.6 at 51.7s. Haiku produces high-quality
  // branching flows (10 nodes, 29 outcome-N edges) and stays well
  // under Supabase's 150s edge function wall-clock limit.
  const [selectedModel, setSelectedModel] = useState(
    "anthropic/claude-haiku-4.5",
  );
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
        const {
          data: { session: voiceSession },
        } = await supabase.auth.getSession();
        const { data: voiceData, error: voiceError } =
          await supabase.functions.invoke("create-vapi-agent", {
            body: {
              agentName: newAgent.name,
              role: newAgent.role,
              language: "en",
            },
            headers: {
              Authorization: `Bearer ${voiceSession?.access_token}`,
            },
          });

        if (voiceError) {
          console.error("Voice agent creation error:", voiceError);
        } else {
          createdVAgentId = voiceData?.v_agent_id || null;
        }
      } catch (voiceErr) {
        console.error(
          "Voice agent creation failed, continuing without voice:",
          voiceErr,
        );
      }

      if (!createdVAgentId) {
        console.warn(
          "No voice agent created — will be created without voice sync",
        );
      }

      console.log("Voice agent created with ID:", createdVAgentId);

      // Step 2: Generate flow from script or use default.
      //
      // IMPORTANT: If the user provided a script, script generation MUST
      // succeed. If it fails, we ABORT agent creation instead of silently
      // falling back to an empty default flow — the previous behaviour
      // made users think their script was ignored when actually the
      // generate-agent-flow call was failing (stale model slugs, 401 on
      // verify_jwt, etc.) and the error was swallowed into a toast.
      let flow = getDefaultFlow();

      if (scriptText.trim()) {
        setCreationStatus("Analyzing script...");

        // Best-effort: fetch a workspace-level OpenRouter key if the user
        // added one. Not required — the edge function has a server-side
        // OPENROUTER_API_KEY secret and will use it when the body omits
        // the key.
        let openRouterKey: string | null = null;
        if (currentWorkspace?.id) {
          const { data: orIntegration } = await supabase
            .from("workspace_integrations")
            .select("api_key")
            .eq("workspace_id", currentWorkspace.id)
            .eq("provider", "openrouter")
            .maybeSingle();
          openRouterKey = orIntegration?.api_key || null;
        }

        // supabase-js auto-attaches JWT with refresh — do not pass a
        // manual Authorization header (stale sessions send "Bearer
        // undefined" and the gateway returns 401).
        const { data: flowData, error: flowError } =
          await supabase.functions.invoke("generate-agent-flow", {
            body: {
              scriptText,
              agentName: newAgent.name,
              role: newAgent.role,
              openRouterKey,
              model: selectedModel,
            },
          });

        // supabase-js will set flowError for network/5xx errors. The edge
        // function itself now always returns 200 with { success: false,
        // message } on any handled error, so the real reason is in flowData.
        if (flowError) {
          console.error("Network error generating flow:", flowError);
          throw new Error(
            `Script analysis failed (network): ${flowError.message || "Unknown error"}. Agent NOT created. ` +
              `If you want an empty flow, clear the script box and click Skip & Create Agent.`,
          );
        }

        const fd = flowData as {
          success?: boolean;
          flow?: unknown;
          error?: string;
          message?: string;
        } | null;

        if (fd && fd.success === false) {
          const reason = fd.message || fd.error || "unknown error";
          console.error("Flow generation rejected:", fd);
          throw new Error(
            `Script analysis failed: ${reason}. Agent NOT created. ` +
              `If you want an empty flow, clear the script box and click Skip & Create Agent.`,
          );
        }

        if (!fd?.flow) {
          console.error("No flow in response:", flowData);
          throw new Error(
            `Script analysis returned no flow. Agent NOT created.`,
          );
        }

        console.log("Generated flow from script:", flowData.flow);
        // Normalize edges to buttonEdge type (required by flow editor)
        const generatedFlow = flowData.flow;
        if (generatedFlow.edges) {
          generatedFlow.edges = generatedFlow.edges.map((edge: any) => ({
            ...edge,
            type: "buttonEdge",
            animated: true,
            style: { strokeWidth: 3, stroke: "#94a3b8" },
          }));
        }
        flow = generatedFlow;
        toast({
          title: "Script Analyzed",
          description: "Your conversation flow has been built from the script.",
        });
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
            onNext={() => setStep(2)} // Proceed to ScriptStep
            onBack={() => onCancel()}
          />
        )}

        {step === 2 && (
          <ScriptStep
            scriptText={scriptText}
            onScriptChange={setScriptText}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            onNext={() => handleCreateAgent()}
            onBack={() => setStep(1)}
            isProcessing={isCreating}
          />
        )}
      </div>
    </div>
  );
}
