
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Send, Webhook, Mail, ArrowRight } from "lucide-react";

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
      <DialogContent className="sm:max-w-md overflow-hidden">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-primary/10 p-3 rounded-full animate-fade-in">
          <Sparkles className="h-8 w-8 text-primary animate-pulse" />
        </div>
        
        <DialogHeader className="pt-6">
          <DialogTitle className="text-xl text-center font-semibold animate-fade-in">
            {feature} Coming Soon
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 animate-fade-in">
          <p className="text-center text-muted-foreground">
            {feature} functionality is currently in development and will be available soon.
          </p>
          
          <div className="grid grid-cols-1 gap-4 mt-6">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 p-5 rounded-xl border border-blue-100 dark:border-blue-900/50 animate-enter">
              <h3 className="font-medium mb-3 text-blue-700 dark:text-blue-300 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-800 flex items-center justify-center">
                  <Send className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <span>SMS Actions</span>
              </h3>
              <p className="text-sm text-blue-600/70 dark:text-blue-400/80 ml-10">
                Send text messages to your customers at specific points in the conversation flow.
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 dark:from-purple-950/40 dark:to-fuchsia-950/40 p-5 rounded-xl border border-purple-100 dark:border-purple-900/50 animate-enter delay-100">
              <h3 className="font-medium mb-3 text-purple-700 dark:text-purple-300 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-800 flex items-center justify-center">
                  <Webhook className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
                <span>Webhook Actions</span>
              </h3>
              <p className="text-sm text-purple-600/70 dark:text-purple-400/80 ml-10">
                Connect to your existing systems and APIs to fetch or send data during conversations.
              </p>
            </div>
            
            <div className="bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-950/40 dark:to-teal-950/40 p-5 rounded-xl border border-green-100 dark:border-green-900/50 animate-enter delay-200">
              <h3 className="font-medium mb-3 text-green-700 dark:text-green-300 flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center">
                  <Mail className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <span>Email Actions</span>
              </h3>
              <p className="text-sm text-green-600/70 dark:text-green-400/80 ml-10">
                Send personalized emails with information collected during the conversation.
              </p>
            </div>
          </div>
          
          <div className="pt-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/40 dark:to-purple-950/40 border-blue-200 dark:border-blue-800/50 hover:border-blue-300 dark:hover:border-blue-700/50 h-11 transition-all"
            >
              <span>Got it</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
