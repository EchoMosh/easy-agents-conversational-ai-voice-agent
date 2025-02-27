
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Wand2 } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AGENT_TEMPLATES } from "@/types/agent";
import type { Agent } from "@/types/agent";

interface TemplateStepProps {
  selectedTemplate: string;
  onTemplateSelect: (templateId: string, role: Agent['role']) => void;
  onNext: () => void;
  onBack: () => void;
}

export function TemplateStep({ 
  selectedTemplate, 
  onTemplateSelect, 
  onNext, 
  onBack 
}: TemplateStepProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (selectedTemplate || selectedTemplate === '')) {
      e.preventDefault();
      onNext();
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
        <p className="text-muted-foreground">Start from scratch or use a pre-built template</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card 
          className={`cursor-pointer transition-all h-[140px] flex flex-col justify-center ${
            selectedTemplate === '' ? 'ring-2 ring-primary' : 'hover:border-primary'
          }`}
          onClick={() => onTemplateSelect('', 'virtual_assistant')}
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

        {AGENT_TEMPLATES.map((template) => (
          <Card 
            key={template.id}
            className={`cursor-pointer transition-all h-[140px] flex flex-col justify-center ${
              selectedTemplate === template.id ? 'ring-2 ring-primary' : 'hover:border-primary'
            }`}
            onClick={() => onTemplateSelect(template.id, template.role)}
          >
            <CardHeader className="p-4">
              <CardTitle className="text-lg">{template.name}</CardTitle>
              <CardDescription className="text-sm">{template.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
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
          onClick={onNext}
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
