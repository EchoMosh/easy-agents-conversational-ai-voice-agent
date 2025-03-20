
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/context/workspace-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AgentsTable } from "@/components/agents/agents-table";
import { CreateAgentForm } from "@/components/agents/create-agent-form";
import { Agent } from "@/types/agent";

const AgentsPage = () => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspace();

  // Update query key to include workspace ID to ensure proper cache invalidation
  const { data: agents = [], isLoading } = useQuery({
    queryKey: ["agents", currentWorkspace?.id],
    queryFn: async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user?.id) throw new Error("Not authenticated");
        if (!currentWorkspace?.id) throw new Error("No workspace selected");

        const { data, error } = await supabase
          .from("agents")
          .select("*")
          .eq("user_id", session.user.id)
          .eq("workspace_id", currentWorkspace.id)
          .order("created_at", { ascending: false });

        if (error) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to load agents",
          });
          throw error;
        }

        console.log("Raw agent data from database:", data);

        return (data || []).map((agent) => {
          let flowData;
          try {
            if (typeof agent.flow === "string") {
              flowData = JSON.parse(agent.flow);
            } else if (agent.flow && typeof agent.flow === "object") {
              flowData = agent.flow;
            } else {
              flowData = { nodes: [], edges: [] };
            }

            // Set default language to "en" if not specified
            if (!agent.language) {
              agent.language = "en";
            }

            if (flowData && (flowData.nodes || flowData.edges)) {
              console.log(
                `Valid flow data found for agent ${agent.id}:`,
                flowData
              );
              return {
                ...agent,
                flow: {
                  nodes: flowData.nodes || [],
                  edges: flowData.edges || [],
                },
              };
            } else if (
              flowData?.flow &&
              (flowData.flow.nodes || flowData.flow.edges)
            ) {
              console.log(
                `Nested flow data found for agent ${agent.id}:`,
                flowData.flow
              );
              return {
                ...agent,
                flow: {
                  nodes: flowData.flow.nodes || [],
                  edges: flowData.flow.edges || [],
                },
              };
            } else {
              console.log(`No valid flow data found for agent ${agent.id}`);
              return {
                ...agent,
                flow: {
                  nodes: [],
                  edges: [],
                },
              };
            }
          } catch (e) {
            console.error(`Error parsing flow for agent ${agent.id}:`, e);
            return {
              ...agent,
              language: agent.language || "en", // Ensure language default is "en"
              flow: {
                nodes: [],
                edges: [],
              },
            };
          }
        }) as Agent[];
      } catch (error) {
        console.error("Error fetching agents:", error);
        return [];
      }
    },
  });

  const handleDeleteAgent = async (agentId: string) => {
    try {
      const { error } = await supabase
        .from("agents")
        .delete()
        .eq("id", agentId);

      if (error) throw error;

      // Include workspace ID in query invalidation
      await queryClient.invalidateQueries({
        queryKey: ["agents", currentWorkspace?.id],
      });

      toast({
        title: "Success",
        description: "Agent deleted successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete agent",
      });
      console.error("Error deleting agent:", error);
    }
  };

  const handleCreateSuccess = async (agentId: string) => {
    // Include workspace ID in query invalidation
    await queryClient.invalidateQueries({
      queryKey: ["agents", currentWorkspace?.id],
    });
    setIsCreating(false);
    toast({
      title: "Success",
      description: "Agent created successfully",
    });
  };

  const handleCancel = () => {
    setIsCreating(false);
  };

  // Listen for create-agent events from the header button
  useEffect(() => {
    const handleCreateAgent = () => {
      setIsCreating(true);
    };

    window.addEventListener("create-agent", handleCreateAgent);

    return () => {
      window.removeEventListener("create-agent", handleCreateAgent);
    };
  }, []);

  return (
    <div className="w-full p-8 bg-background text-foreground relative">
      <div className="flex items-center justify-between mb-8">
        <div className="text-2xl font-semibold">Agents</div>
        <div className="flex gap-4 items-center">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search agents..."
              className="pl-9 w-[250px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Agent
          </Button>
        </div>
      </div>
      
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {!isLoading && agents && (
        <AgentsTable 
          agents={agents} 
          onDelete={handleDeleteAgent} 
        />
      )}

      <Dialog
        open={isCreating}
        onOpenChange={(open) => {
          if (!open) {
            handleCancel();
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create Agent</DialogTitle>
            <DialogDescription>
              Create a new agent to handle your conversations.
            </DialogDescription>
          </DialogHeader>
          <CreateAgentForm
            onSuccess={handleCreateSuccess}
            onCancel={handleCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentsPage;
