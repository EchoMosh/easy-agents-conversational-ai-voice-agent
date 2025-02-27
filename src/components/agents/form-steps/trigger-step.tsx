
import { motion } from "framer-motion";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TriggerStepProps {
  platform: string;
  action: string;
  onPlatformChange: (platform: string) => void;
  onActionChange: (action: string) => void;
  onBack: () => void;
  onSubmit: () => Promise<void>;
  isCreating: boolean;
  platforms: Array<{ value: string; label: string }>;
  platformActions: Record<string, Array<{ value: string; label: string }>>;
}

export function TriggerStep({
  platform,
  action,
  onPlatformChange,
  onActionChange,
  onBack,
  onSubmit,
  isCreating,
  platforms,
  platformActions,
}: TriggerStepProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && platform && action && !isCreating) {
      e.preventDefault();
      onSubmit();
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
        <h2 className="text-2xl font-bold">Set Up Triggers</h2>
        <p className="text-muted-foreground">Configure when your agent should be activated</p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>When would you like this agent to be triggered?</Label>
          <Select
            value={platform}
            onValueChange={onPlatformChange}
          >
            <SelectTrigger className="text-lg py-6">
              <SelectValue placeholder="Select platform" />
            </SelectTrigger>
            <SelectContent>
              {platforms.map((platform) => (
                <SelectItem key={platform.value} value={platform.value}>
                  {platform.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {platform && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-2"
          >
            <Label>Select the trigger event</Label>
            <Select
              value={action}
              onValueChange={onActionChange}
            >
              <SelectTrigger className="text-lg py-6">
                <SelectValue placeholder="Select trigger event" />
              </SelectTrigger>
              <SelectContent>
                {platformActions[platform]?.map((action) => (
                  <SelectItem key={action.value} value={action.value}>
                    {action.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>
        )}
      </div>

      <div className="flex gap-3">
        <Button 
          variant="outline" 
          className="w-full" 
          size="lg"
          onClick={onBack}
          disabled={isCreating}
        >
          Back
        </Button>
        <Button 
          className="w-full relative"
          size="lg"
          onClick={onSubmit}
          disabled={isCreating || !platform || !action}
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
    </motion.div>
  );
}
