
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FlowHeader } from "@/components/flow/agent-flow/header";
import { Flow } from "@/components/flow/agent-flow/flow";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AgentSettings } from "@/components/agents/flow/agent-settings";
import { Button } from "@/components/ui/button";
import { MoveLeft, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { FlowData } from "@/types/agent";
import { createDefaultFlow } from "@/components/agents/utils/default-flow";

export default function AgentFlowPage() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  console.log("Current agent ID:", agentId); // Add this for debugging

  const { data: agent, isLoading, error } = useQuery({
    queryKey: ["agent", agentId],
    queryFn: async () => {
      if (!agentId) {
        throw new Error("Agent ID is missing");
      }
      
      console.log("Fetching agent with ID:", agentId);
      
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("id", agentId)
        .single();

      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }

      if (!data) {
        console.error("No data returned for agent ID:", agentId);
        throw new Error("Agent not found");
      }

      console.log("Agent data retrieved:", data);

      let flowData;
      try {
        if (typeof data.flow === "string") {
          flowData = JSON.parse(data.flow);
        } else if (data.flow && typeof data.flow === "object") {
          flowData = data.flow;
        } else {
          flowData = createDefaultFlow();
        }
      } catch (e) {
        console.error("Error parsing flow data:", e);
        flowData = createDefaultFlow();
      }

      return {
        ...data,
        flow: flowData,
      };
    },
    enabled: !!agentId,
  });

  useEffect(() => {
    if (error) {
      console.error("Error in query:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load agent: " + (error instanceof Error ? error.message : "Unknown error"),
      });
    }
  }, [error, toast]);

  const updateFlowMutation = useMutation({
    mutationFn: async (flow: FlowData) => {
      // Convert the flow to a simple JSON-serializable structure
      const simplifiedFlow = {
        nodes: flow.nodes.map(node => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data,
          // Remove complex properties
          style: undefined
        })),
        edges: flow.edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle,
          // Remove complex properties
          type: edge.type,
          animated: edge.animated,
          style: undefined
        }))
      };
      
      const { error } = await supabase
        .from("agents")
        .update({ flow: simplifiedFlow })
        .eq("id", agentId!);
        
      if (error) throw error;
      return flow;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent", agentId] });
    },
    onError: (error) => {
      console.error("Error updating flow:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save flow changes",
      });
    },
  });

  const updateAgentSettingsMutation = useMutation({
    mutationFn: async (settings: { 
      voiceId?: string; 
      language?: string; 
      humorLevel?: number;
      maxDurationSeconds?: number;
      knowledgeIds?: string[];
    }) => {
      const { error } = await supabase
        .from("agents")
        .update({
          voice_id: settings.voiceId,
          language: settings.language,
          ...(settings.knowledgeIds && { knowledge_ids: settings.knowledgeIds }),
        })
        .eq("id", agentId!);
        
      if (error) throw error;
      return settings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent", agentId] });
      toast({
        title: "Success",
        description: "Agent settings updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating agent settings:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update agent settings",
      });
    },
  });

  const deleteAgentMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("agents")
        .delete()
        .eq("id", agentId!);
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      navigate("/dashboard/agents");
      toast({
        title: "Success",
        description: "Agent deleted successfully",
      });
    },
    onError: (error) => {
      console.error("Error deleting agent:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete agent",
      });
    },
  });

  const handleFlowChange = (flowData: FlowData) => {
    updateFlowMutation.mutate(flowData);
  };

  const handleUpdateSettings = async (settings: { 
    voiceId?: string; 
    language?: string; 
    humorLevel?: number;
    maxDurationSeconds?: number;
    knowledgeIds?: string[];
  }) => {
    await updateAgentSettingsMutation.mutateAsync(settings);
  };

  const handleDeleteAgent = () => {
    deleteAgentMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h2 className="text-xl font-semibold mb-2">Agent not found</h2>
        <p className="text-muted-foreground mb-4">The agent you're looking for could not be found.</p>
        <Button variant="outline" onClick={() => navigate("/dashboard/agents")}>
          Back to Agents
        </Button>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="px-4 py-2 border-b flex justify-between items-center bg-white dark:bg-gray-950">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard/agents")}
            className="h-8 w-8"
          >
            <MoveLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-lg font-semibold">{agent.name}</h1>
        </div>

        <div className="flex items-center gap-2">
          <AgentSettings
            agentId={agent.id}
            currentVoice={agent.voice_id || undefined}
            currentLanguage={agent.language}
            currentKnowledgeIds={agent.knowledge_ids || []}
            onUpdateSettings={handleUpdateSettings}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Flow
          initialNodes={agent.flow.nodes || []}
          initialEdges={agent.flow.edges || []}
          onFlowChange={handleFlowChange}
        />
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              agent and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAgent}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
