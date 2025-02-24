
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { AgentsTable } from "@/components/agents/agents-table";
import { CreateAgentForm } from "@/components/agents/create-agent-form";
import { Agent } from "@/types/agent";

const AgentsPage = () => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);

  const { data: agents, isLoading, error, refetch } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to fetch agents",
        });
        throw error;
      }

      return data as Agent[];
    },
  });

  const handleDeleteAgent = async (agentId: string) => {
    const { error } = await supabase
      .from('agents')
      .delete()
      .eq('id', agentId);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete agent",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Agent deleted successfully",
    });
    refetch();
  };

  return (
    <div className="w-full p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Agents</h1>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Agent
        </Button>
      </div>

      {isLoading && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Loading agents...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-8">
          <p className="text-destructive">Failed to load agents. Please try again.</p>
        </div>
      )}

      {!isLoading && !error && agents?.length === 0 && (
        <div className="text-center py-12 bg-muted/10 rounded-lg border border-dashed">
          <h2 className="text-xl font-semibold mb-4">No agents found</h2>
          <p className="text-muted-foreground mb-6">
            Create your first voice agent to get started
          </p>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Agent
          </Button>
        </div>
      )}

      {!isLoading && !error && agents?.length > 0 && (
        <div className="w-full border rounded-lg bg-card">
          <AgentsTable agents={agents} onDelete={handleDeleteAgent} />
        </div>
      )}

      <Sheet open={isCreating} onOpenChange={setIsCreating}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Create New Agent</SheetTitle>
            <SheetDescription>
              Add a new voice agent to your team. Fill in the details below.
            </SheetDescription>
          </SheetHeader>
          <CreateAgentForm
            onSuccess={() => {
              setIsCreating(false);
              refetch();
            }}
            onCancel={() => setIsCreating(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AgentsPage;
