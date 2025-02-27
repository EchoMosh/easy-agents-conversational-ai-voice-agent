
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowRight, PhoneCall, PhoneForwarded } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface ObjectiveStepProps {
  objective: string;
  onObjectiveSelect: (objective: 'live_transfer' | 'answer_calls') => void;
  onNext: () => void;
  onBack: () => void;
}

export function ObjectiveStep({ 
  objective, 
  onObjectiveSelect, 
  onNext, 
  onBack 
}: ObjectiveStepProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && objective) {
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
        <h2 className="text-2xl font-bold">Choose Agent Objective</h2>
        <p className="text-muted-foreground">What would you like this agent to do?</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card 
          className={`cursor-pointer transition-all ${
            objective === 'answer_calls' ? 'ring-2 ring-primary' : 'hover:border-primary'
          }`}
          onClick={() => onObjectiveSelect('answer_calls')}
        >
          <CardHeader className="p-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <PhoneCall className="h-5 w-5" />
              Answer Calls
            </CardTitle>
            <CardDescription className="text-sm">
              Handle incoming calls and provide automated responses
            </CardDescription>
          </CardHeader>
        </Card>

        <Card 
          className={`cursor-pointer transition-all ${
            objective === 'live_transfer' ? 'ring-2 ring-primary' : 'hover:border-primary'
          }`}
          onClick={() => onObjectiveSelect('live_transfer')}
        >
          <CardHeader className="p-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <PhoneForwarded className="h-5 w-5" />
              Live Transfer
            </CardTitle>
            <CardDescription className="text-sm">
              Transfer calls to available agents or representatives
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
          onClick={onNext}
          disabled={!objective}
        >
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}
