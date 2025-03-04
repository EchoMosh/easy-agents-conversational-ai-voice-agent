
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Computer, Smartphone, X } from "lucide-react";
import { Agent } from "@/types/agent";
import { ElevenLabsWidget } from "./elevenlabs-widget";
import { useToast } from "@/hooks/use-toast";

interface CallOptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent;
}

export function CallOptionDialog({
  open,
  onOpenChange,
  agent,
}: CallOptionDialogProps) {
  const [showWidget, setShowWidget] = useState(false);
  const [widgetError, setWidgetError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSelectDesktop = () => {
    setShowWidget(true);
    setWidgetError(null);
  };

  const handleCloseWidget = () => {
    setShowWidget(false);
    setWidgetError(null);
  };

  const handleWidgetError = (error: string) => {
    console.error("Widget error:", error);
    setWidgetError(error);
    toast({
      variant: "destructive",
      title: "Error loading voice call",
      description: error,
    });
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      // Reset widget state when closing the dialog
      setShowWidget(false);
      setWidgetError(null);
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className={`sm:max-w-${showWidget ? 'xl' : 'md'} p-0 gap-0`}>
        {!showWidget ? (
          <>
            <DialogHeader className="p-6 pb-2">
              <DialogTitle>Choose Call Method</DialogTitle>
              <DialogDescription>
                Select how you would like to receive the call
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4 p-6">
              <div className="flex flex-col items-center gap-2">
                <Button 
                  onClick={handleSelectDesktop}
                  className="w-full h-24 flex flex-col items-center justify-center gap-2"
                  variant="outline"
                >
                  <Computer className="h-8 w-8" />
                  <span>Desktop</span>
                </Button>
                <p className="text-xs text-muted-foreground">Use your computer's microphone</p>
              </div>
              
              <div className="flex flex-col items-center gap-2">
                <Button
                  disabled
                  className="w-full h-24 flex flex-col items-center justify-center gap-2"
                  variant="outline"
                >
                  <Smartphone className="h-8 w-8" />
                  <span>Mobile</span>
                </Button>
                <p className="text-xs text-muted-foreground">
                  <span className="text-xs font-semibold text-amber-500">Coming Soon</span>
                </p>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between items-center p-6 pb-2">
              <div>
                <DialogTitle className="mb-1">Voice Call with {agent.name}</DialogTitle>
                <DialogDescription>
                  Speak naturally with the agent using your microphone
                </DialogDescription>
              </div>
              <Button
                variant="ghost" 
                size="icon" 
                onClick={handleCloseWidget}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {widgetError ? (
              <div className="p-6 text-center">
                <p className="text-destructive mb-4">{widgetError}</p>
                <Button onClick={handleCloseWidget}>Back to Call Options</Button>
              </div>
            ) : (
              <div className="p-6 pt-2">
                <ElevenLabsWidget agent={agent} onError={handleWidgetError} />
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
