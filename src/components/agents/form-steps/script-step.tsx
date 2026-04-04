import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface ScriptStepProps {
  scriptText: string;
  onScriptChange: (text: string) => void;
  onNext: () => void;
  onBack: () => void;
  isProcessing: boolean;
}

export function ScriptStep({
  scriptText,
  onScriptChange,
  onNext,
  onBack,
  isProcessing,
}: ScriptStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5"
    >
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Paste Your Script</h2>
        <p className="text-muted-foreground text-sm">
          Paste your sales script below and we'll auto-build your agent's
          conversation flow using AI
        </p>
      </div>

      <Textarea
        placeholder="Paste your sales script here...

Example:
Hi {name}, this is Alex from Acme Corp. I'm reaching out because we noticed your application came through and we have some great news...

Is now a good time to chat for a quick minute?

Great! So we've been able to get you approved for..."
        value={scriptText}
        onChange={(e) => onScriptChange(e.target.value)}
        className="min-h-[220px] resize-y text-sm"
        disabled={isProcessing}
      />

      <div className="flex gap-2">
        <Button
          variant="outline"
          size="lg"
          onClick={onBack}
          disabled={isProcessing}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Button
          className="flex-1"
          size="lg"
          onClick={onNext}
          disabled={isProcessing}
        >
          {isProcessing ? (
            "Analyzing script..."
          ) : scriptText.trim() ? (
            <>
              Create Agent
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          ) : (
            <>
              Skip & Create Agent
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
