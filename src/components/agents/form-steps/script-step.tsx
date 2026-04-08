import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowLeft, ArrowRight } from "lucide-react";

// Model slugs verified live against https://openrouter.ai/api/v1/models
// as of April 2026. The previous entries (claude-sonnet-4, claude-opus-4,
// gpt-4o, gpt-4o-mini) no longer exist on OpenRouter and returned 400
// "model not found".
//
// NOTE: Kimi K2.5 was briefly the default but it's a reasoning model —
// it returns content:null with the actual answer in a separate
// `reasoning` field, which breaks JSON generation. Claude Sonnet 4.6 is
// the Recommended default because it's non-reasoning and reliable at
// structured JSON output.
const AI_MODELS = [
  {
    id: "anthropic/claude-haiku-4.5",
    name: "Claude Haiku 4.5",
    provider: "Anthropic",
    tag: "Recommended",
  },
  {
    id: "anthropic/claude-sonnet-4.6",
    name: "Claude Sonnet 4.6",
    provider: "Anthropic",
    tag: "Higher quality (slower)",
  },
  {
    id: "anthropic/claude-opus-4.6",
    name: "Claude Opus 4.6",
    provider: "Anthropic",
    tag: "Most powerful",
  },
  {
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    tag: "Fastest",
  },
  {
    id: "meta-llama/llama-3.3-70b-instruct",
    name: "Llama 3.3 70B",
    provider: "Meta",
    tag: "Free",
  },
] as const;

interface ScriptStepProps {
  scriptText: string;
  onScriptChange: (text: string) => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  onNext: () => void;
  onBack: () => void;
  isProcessing: boolean;
}

export function ScriptStep({
  scriptText,
  onScriptChange,
  selectedModel,
  onModelChange,
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
        className="min-h-[200px] resize-y text-sm"
        disabled={isProcessing}
      />

      {scriptText.trim() && (
        <div className="space-y-1.5">
          <Label className="text-sm">AI Model for Script Analysis</Label>
          <Select value={selectedModel} onValueChange={onModelChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AI_MODELS.map((model) => (
                <SelectItem key={model.id} value={model.id}>
                  <span className="flex items-center gap-2">
                    <span>{model.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {model.provider}
                    </span>
                    {model.tag && (
                      <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        {model.tag}
                      </span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

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
