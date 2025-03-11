
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Rocket, ArrowRight, Webhook, Mail, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const [animationStates, setAnimationStates] = useState({
    title: false,
    description: false,
    cards: false,
    button: false,
    rocket: false
  });

  // Staggered animation when dialog opens
  useEffect(() => {
    if (open) {
      // Reset animation states
      setAnimationStates({
        title: false,
        description: false,
        cards: false,
        button: false,
        rocket: false
      });
      
      // Stagger animations with longer delays for a more elegant feel
      const timers = [
        setTimeout(() => setAnimationStates(prev => ({ ...prev, title: true })), 300),
        setTimeout(() => setAnimationStates(prev => ({ ...prev, description: true })), 500),
        setTimeout(() => setAnimationStates(prev => ({ ...prev, rocket: true })), 700),
        setTimeout(() => setAnimationStates(prev => ({ ...prev, cards: true })), 900),
        setTimeout(() => setAnimationStates(prev => ({ ...prev, button: true })), 1200)
      ];
      
      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden bg-white dark:bg-slate-900 border-none shadow-lg">
        <button 
          onClick={() => onOpenChange(false)}
          className="absolute z-10 right-4 top-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </button>
        
        <div className="p-8 md:p-10">
          {/* Header section with minimal styling */}
          <div className="flex items-center mb-6">
            <div 
              className={cn(
                "h-12 w-12 mr-4 rounded-full flex items-center justify-center bg-blue-50 dark:bg-blue-900/30 transition-all duration-700 ease-out",
                animationStates.rocket ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
            >
              <Rocket 
                className={cn(
                  "h-6 w-6 text-blue-500 dark:text-blue-400 transition-transform",
                  animationStates.rocket && "animate-float"
                )} 
                strokeWidth={1.5} 
              />
            </div>
            <div>
              <h2 
                className={cn(
                  "text-2xl font-semibold text-gray-800 dark:text-gray-100 transition-all duration-500 ease-out",
                  animationStates.title ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
              >
                {feature} Coming Soon
              </h2>
              <p 
                className={cn(
                  "text-gray-500 dark:text-gray-400 mt-1 transition-all duration-500 ease-out",
                  animationStates.description ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                )}
              >
                We're building powerful automation tools to enhance your workflow.
              </p>
            </div>
          </div>

          {/* Feature cards with minimal styling */}
          <div 
            className={cn(
              "grid grid-cols-1 md:grid-cols-3 gap-5 transition-all duration-700 ease-out",
              animationStates.cards ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
            )}
          >
            {/* SMS Card */}
            <div className="bg-gray-50 dark:bg-slate-800/60 rounded-lg p-6 hover:shadow-md transition-all border border-gray-100 dark:border-slate-700/40 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-50 dark:bg-blue-900/20">
                  <Send className="h-5 w-5 text-blue-500 dark:text-blue-400" strokeWidth={1.5} />
                </div>
              </div>
              <h3 className="font-medium mb-2 text-gray-800 dark:text-gray-200">SMS Actions</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Send timely text messages with personalized information to your customers.
              </p>
              <div className="h-6 flex items-center">
                <span className="text-xs text-blue-500 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                  Learn more <ArrowRight className="ml-1 h-3 w-3" />
                </span>
              </div>
            </div>
            
            {/* Webhook Card */}
            <div className="bg-gray-50 dark:bg-slate-800/60 rounded-lg p-6 hover:shadow-md transition-all border border-gray-100 dark:border-slate-700/40 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-50 dark:bg-purple-900/20">
                  <Webhook className="h-5 w-5 text-purple-500 dark:text-purple-400" strokeWidth={1.5} />
                </div>
              </div>
              <h3 className="font-medium mb-2 text-gray-800 dark:text-gray-200">API Integration</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Connect to third-party services and fetch real-time data during conversations.
              </p>
              <div className="h-6 flex items-center">
                <span className="text-xs text-purple-500 dark:text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                  Learn more <ArrowRight className="ml-1 h-3 w-3" />
                </span>
              </div>
            </div>
            
            {/* Email Card */}
            <div className="bg-gray-50 dark:bg-slate-800/60 rounded-lg p-6 hover:shadow-md transition-all border border-gray-100 dark:border-slate-700/40 group">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-pink-50 dark:bg-pink-900/20">
                  <Mail className="h-5 w-5 text-pink-500 dark:text-pink-400" strokeWidth={1.5} />
                </div>
              </div>
              <h3 className="font-medium mb-2 text-gray-800 dark:text-gray-200">Email Actions</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Send beautiful, branded emails with information collected during conversations.
              </p>
              <div className="h-6 flex items-center">
                <span className="text-xs text-pink-500 dark:text-pink-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                  Learn more <ArrowRight className="ml-1 h-3 w-3" />
                </span>
              </div>
            </div>
          </div>
          
          {/* Button with minimal styling */}
          <div className="mt-8">
            <Button
              onClick={() => onOpenChange(false)}
              className={cn(
                "w-full bg-blue-500 hover:bg-blue-600 text-white border-none transition-all duration-700 ease-out",
                animationStates.button ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
            >
              <span>Got it</span>
              <Sparkles className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
