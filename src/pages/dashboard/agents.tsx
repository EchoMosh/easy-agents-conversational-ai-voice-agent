
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AgentsTable } from "@/components/agents/agents-table";
import { CreateAgentForm } from "@/components/agents/create-agent-form";
import { Agent } from "@/types/agent";

const AgentsPage = () => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const { data: agents, isLoading, refetch } = useQuery({
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

      // Properly map the data to match the Agent type
      return (data || []).map(agent => ({
        ...agent,
        flow: agent.flow ? {
          nodes: (agent.flow as any).nodes || [],
          edges: (agent.flow as any).edges || []
        } : undefined
      })) as Agent[];
    },
  });

  const handleDeleteAgent = async (agentId: string) => {
    try {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', agentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Agent deleted successfully",
      });
      refetch();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete agent",
      });
    }
  };

  const handleCreateSuccess = () => {
    setIsCreating(false);
    refetch();
    toast({
      title: "Success",
      description: "Agent created successfully",
    });
  };

  const handleCancel = () => {
    setIsCreating(false);
  };

  return (
    <div className="w-full p-8 bg-background text-foreground">
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

      {!isLoading && agents && <AgentsTable agents={agents} onDelete={handleDeleteAgent} />}

      <Dialog open={isCreating} onOpenChange={setIsCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Agent</DialogTitle>
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
