import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Wand2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { Agent } from "@/types/agent";

interface TemplateStepProps {
  selectedTemplate: string;
  onTemplateSelect: (templateId: string, role: Agent["role"]) => void;
  onNext: (vAgentId?: string) => void;
  onBack: () => void;
  showOnlyScratch?: boolean;
  agentName?: string;
}

export function TemplateStep({ 
  selectedTemplate, 
  onTemplateSelect, 
  onNext, 
  onBack,
  showOnlyScratch = false,
  agentName = "New Agent",
}: TemplateStepProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [creationStatus, setCreationStatus] = useState<string | null>(null);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && selectedTemplate) {
      e.preventDefault();
      handleContinueClick();
    }
  };

  const handleTemplateClick = () => {
    if (selectedTemplate === '') {
      onTemplateSelect('not_selected', 'virtual_assistant');
    } else {
      onTemplateSelect('', 'virtual_assistant');
    }
  };

  const handleContinueClick = async () => {
    if (!selectedTemplate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a template first",
      });
      return;
    }
    
    setIsLoading(true);
    setCreationStatus("Creating agent through n8n webhook...");
    
    try {
      const webhookUrl = "https://moshi.app.n8n.cloud/webhook/create-agent";
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentName: agentName,
          role: "virtual_assistant",
          language: "en"
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create agent via n8n webhook: ${response.statusText}`);
      }
      
      let data;
      try {
        data = await response.json();
        console.log('n8n webhook response:', data);
      } catch (error) {
        console.error('Failed to parse webhook response:', error);
        throw new Error('Invalid response from n8n webhook');
      }
      
      if (!data || !data.v_agent_id) {
        console.error('No v_agent_id in response:', data);
        throw new Error('No v_agent_id returned from n8n webhook');
      }
      
      const vAgentId = data.v_agent_id;
      console.log('Received v_agent_id:', vAgentId);
      
      toast({
        title: "Success",
        description: "Agent created successfully via n8n",
      });
      
      await onNext(vAgentId);
      
    } catch (error) {
      console.error('Error creating agent:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create agent",
      });
    } finally {
      setIsLoading(false);
      setCreationStatus(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Choose Template</h2>
        <p className="text-muted-foreground">Start from scratch and build your own flow</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card 
          className={`cursor-pointer transition-all duration-200 h-[140px] flex flex-col justify-center ${
            selectedTemplate === '' ? 
              'hover:border-blue-400 hover:shadow-md' : 
              'ring-4 ring-blue-500 bg-blue-50 dark:bg-blue-950/30 transform scale-[1.02] shadow-lg'
          }`}
          onClick={handleTemplateClick}
        >
          <CardHeader className="p-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wand2 className="h-5 w-5" />
              Start from Scratch
            </CardTitle>
            <CardDescription className="text-sm">
              Create a custom agent with your own flow
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          className="w-full" 
          size="lg"
          onClick={onBack}
        >
          Back
        </Button>
        <Button 
          className="w-full relative"
          size="lg"
          onClick={handleContinueClick}
          disabled={!selectedTemplate || isLoading}
        >
          {isLoading ? (
            <>Creating<span className="loading ml-2">...</span></>
          ) : (
            <>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
