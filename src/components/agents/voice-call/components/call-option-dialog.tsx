
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Computer, Smartphone } from "lucide-react";
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
  };

  const handleCloseWidget = () => {
    setShowWidget(false);
    setWidgetError(null);
  };

  const handleWidgetError = (error: string) => {
    setWidgetError(error);
    toast({
      variant: "destructive",
      title: "Error loading voice call",
      description: error,
    });
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          // Reset widget state when closing the dialog
          setShowWidget(false);
          setWidgetError(null);
        }
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className={`sm:max-w-${showWidget ? 'xl' : 'md'}`}>
        {!showWidget ? (
          <>
            <DialogHeader>
              <DialogTitle>Choose Call Method</DialogTitle>
              <DialogDescription>
                Select how you would like to receive the call
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-4 py-4">
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
            <DialogHeader>
              <DialogTitle>Voice Call with {agent.name}</DialogTitle>
              <DialogDescription>
                Speak naturally with the agent using your microphone
              </DialogDescription>
            </DialogHeader>
            
            {widgetError ? (
              <div className="py-6 text-center">
                <p className="text-destructive mb-4">{widgetError}</p>
                <Button onClick={handleCloseWidget}>Back to Call Options</Button>
              </div>
            ) : (
              <>
                <div className="py-4">
                  <ElevenLabsWidget agent={agent} onError={handleWidgetError} />
                </div>
                
                <div className="flex justify-end">
                  <Button variant="outline" onClick={handleCloseWidget}>
                    Close Call
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
