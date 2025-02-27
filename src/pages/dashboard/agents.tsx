
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AgentsTable } from "@/components/agents/agents-table";
import { CreateAgentForm } from "@/components/agents/create-agent-form";
import { Agent } from "@/types/agent";

const AgentsPage = () => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const queryClient = useQueryClient();

  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) throw new Error('Not authenticated');
      
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load agents",
        });
        throw error;
      }

      console.log('Raw agent data from database:', data);

      return (data || []).map(agent => {
        let flowData;
        try {
          if (typeof agent.flow === 'string') {
            flowData = JSON.parse(agent.flow);
          } else if (agent.flow && typeof agent.flow === 'object') {
            flowData = agent.flow;
          }

          // Ensure we have a valid flow object with nodes and edges
          if (flowData && (flowData.nodes || flowData.edges)) {
            console.log(`Valid flow data found for agent ${agent.id}:`, flowData);
            return {
              ...agent,
              flow: {
                nodes: flowData.nodes || [],
                edges: flowData.edges || []
              }
            };
          } else if (flowData?.flow && (flowData.flow.nodes || flowData.flow.edges)) {
            // Handle nested flow data
            console.log(`Nested flow data found for agent ${agent.id}:`, flowData.flow);
            return {
              ...agent,
              flow: {
                nodes: flowData.flow.nodes || [],
                edges: flowData.flow.edges || []
              }
            };
          } else {
            console.log(`No valid flow data found for agent ${agent.id}`);
            return {
              ...agent,
              flow: {
                nodes: [],
                edges: []
              }
            };
          }
        } catch (e) {
          console.error(`Error parsing flow for agent ${agent.id}:`, e);
          return {
            ...agent,
            flow: {
              nodes: [],
              edges: []
            }
          };
        }
      }) as Agent[];
    },
  });

  const handleDeleteAgent = async (agentId: string) => {
    try {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', agentId);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['agents'] });

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
      throw error;
    }
  };

  const handleCreateSuccess = async (agentId: string) => {
    await queryClient.invalidateQueries({ queryKey: ['agents'] });
    setIsCreating(false);
    toast({
      title: "Success",
      description: "Agent created successfully",
    });
  };

  const handleCancel = () => {
    setIsCreating(false);
  };

  return (
    <div className="w-full p-8 bg-background text-foreground relative">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Agents</h1>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Agent
        </Button>
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
