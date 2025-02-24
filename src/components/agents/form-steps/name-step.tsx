
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

interface NameStepProps {
  name: string;
  onNameChange: (name: string) => void;
  onNext: () => void;
}

export function NameStep({ name, onNameChange, onNext }: NameStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Name Your Agent</h2>
        <p className="text-muted-foreground">Choose a name that reflects your agent's purpose</p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="name">What would you like to name your agent?</Label>
        <Input
          id="name"
          placeholder="Enter agent name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          className="text-lg py-6"
        />
      </div>
      <Button 
        className="w-full relative" 
        size="lg"
        onClick={onNext}
        disabled={!name}
      >
        Continue
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </motion.div>
  );
}
