import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type Agent = {
  id: string;
  name: string;
  role: 'receptionist' | 'sales_agent' | 'customer_support' | 'technical_advisor' | 'appointment_scheduler' | 'product_specialist' | 'virtual_assistant';
  voice_id: string | null;
  interaction_type: string[];
  is_active: boolean;
  created_at: string;
};

const AGENT_ROLES = [
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'sales_agent', label: 'Sales Agent' },
  { value: 'customer_support', label: 'Customer Support' },
  { value: 'technical_advisor', label: 'Technical Advisor' },
  { value: 'appointment_scheduler', label: 'Appointment Scheduler' },
  { value: 'product_specialist', label: 'Product Specialist' },
  { value: 'virtual_assistant', label: 'Virtual Assistant' },
] as const;

const AgentsPage = () => {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [newAgent, setNewAgent] = useState({
    name: '',
    role: 'virtual_assistant' as Agent['role'],
    interaction_type: ['inbound'] as string[],
  });

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

  const handleCreateAgent = async () => {
    if (!newAgent.name || !newAgent.role || !newAgent.interaction_type.length) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    // Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to create an agent",
      });
      return;
    }

    const { error } = await supabase
      .from('agents')
      .insert({
        name: newAgent.name,
        role: newAgent.role,
        interaction_type: newAgent.interaction_type,
        user_id: session.user.id,
      });

    if (error) {
      console.error('Error creating agent:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create agent",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Agent created successfully",
    });

    setIsCreating(false);
    setNewAgent({
      name: '',
      role: 'virtual_assistant',
      interaction_type: ['inbound'],
    });
    refetch();
  };

  const handleInteractionTypeChange = (types: string[]) => {
    if (types.length === 0) return; // Ensure at least one type is selected
    setNewAgent(prev => ({ ...prev, interaction_type: types }));
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Agents</h1>
        </div>
        <div className="text-center py-8">Loading agents...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Agents</h1>
        </div>
        <div className="text-center py-8 text-destructive">
          Failed to load agents. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Agents</h1>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Agent
        </Button>
      </div>

      {agents?.length ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">{agent.name}</TableCell>
                  <TableCell className="capitalize">
                    {agent.role.replace('_', ' ')}
                  </TableCell>
                  <TableCell>
                    {agent.interaction_type.map((type) => (
                      <span
                        key={type}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-1"
                      >
                        {type}
                      </span>
                    ))}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      agent.is_active 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                    }`}>
                      {agent.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(agent.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12">
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

      <Sheet open={isCreating} onOpenChange={setIsCreating}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Create New Agent</SheetTitle>
            <SheetDescription>
              Add a new voice agent to your team. Fill in the details below.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="Enter agent name"
                value={newAgent.name}
                onChange={(e) => setNewAgent(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={newAgent.role}
                onValueChange={(value: Agent['role']) => 
                  setNewAgent(prev => ({ ...prev, role: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {AGENT_ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Interaction Type</Label>
              <ToggleGroup 
                type="multiple" 
                value={newAgent.interaction_type}
                onValueChange={handleInteractionTypeChange}
                className="justify-start"
              >
                <ToggleGroupItem value="inbound" aria-label="Toggle inbound">
                  Inbound
                </ToggleGroupItem>
                <ToggleGroupItem value="outbound" aria-label="Toggle outbound">
                  Outbound
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <Button className="w-full" onClick={handleCreateAgent}>
              Create Agent
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AgentsPage;
