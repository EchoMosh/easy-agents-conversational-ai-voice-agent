
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

interface ComingSoonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
}

export function ComingSoonDialog({
  open,
  onOpenChange,
  feature = "Actions",
}: ComingSoonDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md animate-fade-in">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-primary/10 p-3 rounded-full">
          <Sparkles className="h-8 w-8 text-primary animate-pulse" />
        </div>
        
        <DialogHeader className="pt-6">
          <DialogTitle className="text-xl text-center font-semibold">
            Coming Soon
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-center text-muted-foreground">
              {feature} functionality is currently in development.
            </p>
            
            <div className="bg-muted/40 p-4 rounded-lg border border-border/40 mt-4">
              <h3 className="font-medium mb-2 text-foreground">What are Actions?</h3>
              <p className="text-sm text-muted-foreground">
                Actions will allow your AI agent to perform specific tasks during a conversation, such as:
              </p>
              <ul className="text-sm mt-2 space-y-1 text-muted-foreground">
                <li>• Capturing and storing user information</li>
                <li>• Looking up data from external systems</li>
                <li>• Scheduling appointments and follow-ups</li>
                <li>• Creating tasks and tickets</li>
              </ul>
            </div>
          </div>
          
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Got it
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
