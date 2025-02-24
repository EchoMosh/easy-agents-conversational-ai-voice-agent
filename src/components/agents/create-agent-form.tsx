
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Agent, AGENT_ROLES } from "@/types/agent";

interface CreateAgentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const DEFAULT_FLOW = {
  nodes: [
    {
      id: 'greeting-1',
      type: 'greetingNode',
      position: { x: 100, y: 100 },
      data: {
        greeting: "Hello! How can I help you today?",
        outcomes: ["I need help with a product", "I have a question"]
      }
    },
    {
      id: 'speak-1',
      type: 'speakNode',
      position: { x: 500, y: 100 },
      data: {
        message: "I'd be happy to assist you. Please let me know what you need help with.",
        outcomes: ["Thanks, that's all", "I have another question"]
      }
    },
    {
      id: 'end-1',
      type: 'endNode',
      position: { x: 900, y: 100 },
      data: {}
    }
  ],
  edges: [
    {
      id: 'greeting-to-speak',
      source: 'greeting-1',
      target: 'speak-1',
      sourceHandle: 'outcome-0'
    },
    {
      id: 'speak-to-end',
      source: 'speak-1',
      target: 'end-1',
      sourceHandle: 'outcome-0'
    }
  ]
};

export function CreateAgentForm({ onSuccess, onCancel }: CreateAgentFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [newAgent, setNewAgent] = useState({
    name: '',
    role: 'virtual_assistant' as Agent['role'],
  });

  const handleCreateAgent = async () => {
    if (!newAgent.name || !newAgent.role) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required fields",
      });
      return;
    }

    setIsCreating(true);

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "You must be logged in to create an agent",
      });
      setIsCreating(false);
      return;
    }

    const { data, error } = await supabase
      .from('agents')
      .insert({
        name: newAgent.name,
        role: newAgent.role,
        user_id: session.user.id,
        flow: DEFAULT_FLOW
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating agent:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create agent",
      });
      setIsCreating(false);
      return;
    }

    toast({
      title: "Success",
      description: "Agent created successfully",
    });

    // Simulate a loading delay for better UX
    setTimeout(() => {
      setIsCreating(false);
      onSuccess();
      // Navigate to the flow page with a nice fade animation
      navigate(`/dashboard/agents/flow/${data.id}`, { replace: true });
    }, 1500);
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

      <Button 
        className="w-full relative" 
        onClick={handleCreateAgent} 
        disabled={isCreating}
      >
        {isCreating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Agent...
          </>
        ) : (
          'Create Agent'
        )}
      </Button>
    </div>
  );
}
