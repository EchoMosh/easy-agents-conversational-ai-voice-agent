
import React, { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Rocket, ArrowRight, Webhook, Mail, Send } from "lucide-react";
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
    header: false,
    description: false,
    cards: false,
    button: false
  });

  // Staggered animation when dialog opens
  useEffect(() => {
    if (open) {
      // Reset animation states
      setAnimationStates({
        header: false,
        description: false,
        cards: false,
        button: false
      });
      
      // Stagger animations
      const timers = [
        setTimeout(() => setAnimationStates(prev => ({ ...prev, header: true })), 200),
        setTimeout(() => setAnimationStates(prev => ({ ...prev, description: true })), 400),
        setTimeout(() => setAnimationStates(prev => ({ ...prev, cards: true })), 600),
        setTimeout(() => setAnimationStates(prev => ({ ...prev, button: true })), 1000)
      ];
      
      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] p-0 overflow-hidden bg-gradient-to-tr from-gray-50 to-white dark:from-slate-900 dark:to-slate-800/90 border-none shadow-xl">
        <div className="flex flex-col md:flex-row w-full">
          {/* Left section with rocket animation */}
          <div className="bg-gradient-to-br from-blue-500/80 via-purple-500/80 to-pink-500/80 p-8 md:w-1/3 flex items-center justify-center md:relative">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJzdGFycyIgeD0iMCIgeT0iMCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48Y2lyY2xlIGN4PSIxIiBjeT0iMSIgcj0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjMpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3N0YXJzKSIvPjwvc3ZnPg==')]
                  opacity-20 mix-blend-overlay" />
            
            <div className="relative z-10">
              <div className={cn("transform transition-all duration-1000", 
                animationStates.header ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0")}>
                <div className="relative">
                  <div className="absolute -inset-4 rounded-full animate-pulse bg-white/20 blur-xl"></div>
                  <div className="relative flex h-24 w-24 mx-auto items-center justify-center rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 shadow-lg">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[wave_3s_ease-in-out_infinite]"></div>
                    <Rocket 
                      className="h-12 w-12 text-white animate-[bounce_4s_ease-in-out_infinite] drop-shadow-lg" 
                      strokeWidth={1.5} 
                    />
                  </div>
                </div>
                
                <div className="mt-8 text-center text-white">
                  <h2 className="text-xl font-bold drop-shadow-md">Ready for Liftoff</h2>
                  <p className="mt-2 text-white/80">We're working on something amazing for you</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right section with content */}
          <div className="p-8 md:w-2/3">
            <div className={cn("transform transition-all duration-500",
              animationStates.header ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0")}>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400">
                {feature} Coming Soon
              </h2>
              
              <p className={cn("text-slate-600 dark:text-slate-300 mt-2 transform transition-all duration-500",
                animationStates.description ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0")}>
                We're building powerful automation tools to help you engage with customers more effectively.
              </p>
            </div>

            <div className={cn("mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 transform transition-all duration-500", 
              animationStates.cards ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0")}>
              {/* SMS Card */}
              <div className="bg-white dark:bg-slate-800/50 rounded-lg p-5 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-slate-700/50 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/40">
                    <Send className="h-5 w-5 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-medium text-blue-700 dark:text-blue-400">SMS Actions</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Send timely text messages to your customers with personalized information.
                </p>
                <ArrowRight className="absolute bottom-4 right-4 h-5 w-5 text-blue-500 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
              </div>
              
              {/* Webhook Card */}
              <div className="bg-white dark:bg-slate-800/50 rounded-lg p-5 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-slate-700/50 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-100 dark:bg-purple-900/40">
                    <Webhook className="h-5 w-5 text-purple-600 dark:text-purple-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-medium text-purple-700 dark:text-purple-400">API Integration</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Connect to third-party services and fetch real-time data during conversations.
                </p>
                <ArrowRight className="absolute bottom-4 right-4 h-5 w-5 text-purple-500 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
              </div>
              
              {/* Email Card */}
              <div className="bg-white dark:bg-slate-800/50 rounded-lg p-5 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-slate-700/50 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500/5 to-pink-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-pink-100 dark:bg-pink-900/40">
                    <Mail className="h-5 w-5 text-pink-600 dark:text-pink-400" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-medium text-pink-700 dark:text-pink-400">Email Actions</h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Send beautiful, branded emails with information collected during conversations.
                </p>
                <ArrowRight className="absolute bottom-4 right-4 h-5 w-5 text-pink-500 opacity-0 group-hover:opacity-100 transform group-hover:translate-x-1 transition-all" />
              </div>
            </div>
            
            <div className="mt-6">
              <Button
                onClick={() => onOpenChange(false)}
                className={cn("w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white border-none shadow-md hover:shadow-lg transition-all transform", 
                  animationStates.button ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0")}
              >
                <span>Can't wait to try it!</span>
                <Sparkles className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
