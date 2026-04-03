import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Agent } from "@/types/agent-types";
import { useEffect } from "react";

export function useAgentData(
  id: string | undefined,
  navigate: ReturnType<typeof useNavigate>,
  toast: any,
) {
  const {
    data: agent,
    refetch,
    isError,
    isLoading,
  } = useQuery({
    queryKey: ["agent", id],
    queryFn: async () => {
      if (!id) throw new Error("No agent ID provided");

      console.log("[AgentFlowPage] Fetching agent data for ID:", id);
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.error("[AgentFlowPage] Error fetching agent:", error);
        throw error;
      }
      if (!data) {
        console.error("[AgentFlowPage] Agent not found");
        throw new Error("Agent not found");
      }

      // Don't throw an error if v_agent_id is missing, just log a warning
      if (!data.v_agent_id) {
        console.warn("[AgentFlowPage] Agent missing v_agent_id");
      }

      // Make sure the agent has a name property
      if (!data.name || typeof data.name !== "string") {
        console.warn(
          "[AgentFlowPage] Agent missing name or name is not a string",
        );
        data.name = "Unnamed Agent";
      }

      console.log("[AgentFlowPage] Agent data retrieved:", data);

      // Ensure we're returning a properly formatted agent object
      const formattedAgent: Agent = {
        ...data,
        name: data.name || "Unnamed Agent",
        role: data.role || "receptionist",
        id: data.id,
        flow: data.flow as string | any, // Type assertion to handle Json type
      };

      return formattedAgent;
    },
    enabled: !!id,
  });

  useEffect(() => {
    if (isError) {
      toast({
        variant: "destructive",
        title: "Agent Error",
        description:
          "This agent has not been properly initialized. Redirecting back to agents list.",
      });
      const timer = setTimeout(() => {
        navigate("/dashboard/agents");
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isError, navigate, toast]);

  // Add real-time subscription for agent flow updates
  useEffect(() => {
    if (!id) return;

    console.log(
      "[AgentFlowPage] Setting up real-time subscription for agent:",
      id,
    );

    const channel = supabase
      .channel(`agent-flow-${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "agents",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          console.log("[AgentFlowPage] Real-time update received:", payload);

          // Only refetch if the flow data actually changed
          if (
            payload.new &&
            payload.old &&
            JSON.stringify(payload.new.flow) !==
              JSON.stringify(payload.old.flow)
          ) {
            console.log(
              "[AgentFlowPage] Flow data changed, refetching agent data",
            );
            refetch();
          }
        },
      )
      .subscribe((status) => {
        console.log("[AgentFlowPage] Real-time subscription status:", status);
      });

    return () => {
      console.log("[AgentFlowPage] Cleaning up real-time subscription");
      supabase.removeChannel(channel);
    };
  }, [id, refetch]);

  const handleUpdateSettings = async (settings: {
    voiceId?: string;
    language?: string;
    humorLevel?: number;
    maxDurationSeconds?: number;
  }) => {
    if (!id) return;
    console.log("[AgentFlowPage] Updating agent settings:", settings);

    // Map to snake_case for Supabase
    const dbUpdates: { [key: string]: any } = {};
    if (settings.voiceId !== undefined) dbUpdates.voice_id = settings.voiceId;
    if (settings.language !== undefined) dbUpdates.language = settings.language;
    if (settings.humorLevel !== undefined)
      dbUpdates.humor_level = settings.humorLevel;
    if (settings.maxDurationSeconds !== undefined)
      dbUpdates.max_duration_seconds = settings.maxDurationSeconds;

    const { error } = await supabase
      .from("agents")
      .update(dbUpdates)
      .eq("id", id);

    if (error) {
      console.error("[AgentFlowPage] Error updating agent settings:", error);
      throw error;
    }
    console.log("[AgentFlowPage] Agent settings updated successfully");
  };

  return { agent, refetch, isError, isLoading, handleUpdateSettings };
}
