
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Wand2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { Agent } from "@/types/agent";

interface TemplateStepProps {
  selectedTemplate: string;
  onTemplateSelect: (templateId: string, role: Agent['role']) => void;
  onNext: () => void;
  onBack: () => void;
  showOnlyScratch?: boolean;
}

export function TemplateStep({ 
  selectedTemplate, 
  onTemplateSelect, 
  onNext, 
  onBack,
  showOnlyScratch = false,
}: TemplateStepProps) {
  const { toast } = useToast();
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && selectedTemplate) {
      e.preventDefault();
      onNext();
    }
  };

  const handleTemplateClick = () => {
    // Toggle selection - if already selected, deselect it, otherwise select it
    if (selectedTemplate === '') {
      onTemplateSelect('not_selected', 'virtual_assistant');
    } else {
      onTemplateSelect('', 'virtual_assistant');
    }
  };

  const handleContinueClick = async () => {
    // Validate that a template is selected before proceeding
    if (!selectedTemplate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a template first",
      });
      return;
    }
    
    try {
      // Send a direct POST request to the n8n webhook
      const response = await fetch('https://moshi.app.n8n.cloud/webhook/create-agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: "New Agent",
          role: "virtual_assistant",
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Webhook response:', data);
      
      toast({
        title: "Success",
        description: "Agent creation request sent successfully",
      });
      
      onNext();
    } catch (error) {
      console.error('Error sending webhook:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send agent creation request",
      });
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
          disabled={!selectedTemplate}
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
