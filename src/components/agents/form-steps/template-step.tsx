
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Wand2, Car, Store, Construction } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { Agent } from "@/types/agent";
import { Badge } from "@/components/ui/badge";

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
    if (selectedTemplate !== 'not_selected') {
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
      
      if (!data) {
        console.error('No data in response');
        throw new Error('No data returned from n8n webhook');
      }
      
      const vAgentId = data.v_agent_id;
      console.log('Received v_agent_id:', vAgentId);
      
      if (!vAgentId) {
        console.error('No v_agent_id in response:', data);
        throw new Error('No v_agent_id returned from n8n webhook');
      }
      
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
      className="flex flex-col h-full"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <div className="space-y-4 p-6">
        {/* Template Options */}
        <div 
          className={`border rounded-lg p-4 cursor-pointer transition-all ${
            selectedTemplate === 'not_selected' ? 'border-2 border-[#4f85e7]' : 'border-gray-700 hover:border-gray-600'
          }`}
          onClick={handleTemplateClick}
        >
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-4 text-[#4f85e7]">
              <Wand2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Start from Scratch</h3>
              <p className="text-gray-400 mt-1">Create a custom agent with your own flow</p>
            </div>
          </div>
        </div>
        
        {/* Car Dealership - Coming Soon */}
        <div className="border border-gray-700 rounded-lg p-4 opacity-70">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-4 text-gray-500">
              <Car className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-gray-400">Car Dealership</h3>
                <Badge className="ml-2 bg-amber-600/90 text-white border-none px-2 py-1">
                  Coming Soon
                </Badge>
              </div>
              <p className="text-gray-500 mt-1">Handles inquiries about vehicles and schedules test drives</p>
            </div>
          </div>
        </div>
        
        {/* Retail Assistant - Coming Soon */}
        <div className="border border-gray-700 rounded-lg p-4 opacity-70">
          <div className="flex items-center">
            <div className="flex-shrink-0 mr-4 text-gray-500">
              <Store className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center">
                <h3 className="text-lg font-semibold text-gray-400">Retail Assistant</h3>
                <Badge className="ml-2 bg-amber-600/90 text-white border-none px-2 py-1">
                  Coming Soon
                </Badge>
              </div>
              <p className="text-gray-500 mt-1">Helps customers with product information and processes orders</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-auto p-6 flex justify-end">
        <Button 
          className="bg-[#4f85e7] hover:bg-[#3a6dc7] text-white px-8 py-2 rounded-lg flex items-center"
          onClick={handleContinueClick}
          disabled={selectedTemplate !== 'not_selected' || isLoading}
        >
          {isLoading ? (
            <>Creating<span className="loading ml-2">...</span></>
          ) : (
            <>
              Continue
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
