
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useToast } from "@/hooks/use-toast";
import { Agent, AGENT_ROLES } from "@/types/agent";

interface CreateAgentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateAgentForm({ onSuccess, onCancel }: CreateAgentFormProps) {
  const { toast } = useToast();
  const [newAgent, setNewAgent] = useState({
    name: '',
    role: 'virtual_assistant' as Agent['role'],
    interaction_type: ['inbound'] as string[],
  });

  const handleInteractionTypeChange = (types: string[]) => {
    if (types.length === 0) return;
    setNewAgent(prev => ({ ...prev, interaction_type: types }));
  };

  const handleCreateAgent = async () => {
    if (!newAgent.name || !newAgent.role || !newAgent.interaction_type.length) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

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

    onSuccess();
  };

  return (
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
  );
}
