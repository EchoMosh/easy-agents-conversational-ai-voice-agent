
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Send, Webhook, Mail, ArrowRight, Rocket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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
      <DialogContent className="sm:max-w-md overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-950/90 dark:to-slate-900/90 border-none shadow-xl">
        <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-500/20 dark:via-purple-500/20 dark:to-pink-500/20" />
        
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-2xl opacity-70" />
        
        <div className="relative z-10 flex items-center justify-center mb-4 mt-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full animate-pulse bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 blur-md" />
            <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 shadow-lg">
              <Rocket className="h-7 w-7 text-white" strokeWidth={1.5} />
            </div>
          </div>
        </div>
        
        <DialogHeader className="relative z-10">
          <DialogTitle className="text-2xl text-center font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 animate-fade-in pb-1">
            {feature} Coming Soon
          </DialogTitle>
          <p className="text-center text-sm text-slate-600 dark:text-slate-400 max-w-xs mx-auto mt-2 animate-fade-in delay-75">
            We're building something amazing! {feature} functionality will be available soon.
          </p>
        </DialogHeader>
        
        <div className="relative z-10 space-y-5 animate-fade-in delay-150">
          <div className="grid grid-cols-1 gap-3">
            {/* SMS Card */}
            <Card className="overflow-hidden border-none shadow-md group hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 h-full w-1 bg-gradient-to-b from-blue-400 to-blue-600 dark:from-blue-500 dark:to-blue-700" />
              <CardContent className="p-4 pl-5">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/40">
                      <Send className="h-5 w-5 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-medium text-blue-700 dark:text-blue-400">SMS Actions</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Send text messages to your customers at specific points in the conversation flow.
                    </p>
                  </div>
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all duration-300">
                  <ArrowRight className="h-5 w-5 text-blue-500" strokeWidth={1.5} />
                </div>
              </CardContent>
            </Card>
            
            {/* Webhook Card */}
            <Card className="overflow-hidden border-none shadow-md group hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 h-full w-1 bg-gradient-to-b from-purple-400 to-purple-600 dark:from-purple-500 dark:to-purple-700" />
              <CardContent className="p-4 pl-5">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-100 dark:bg-purple-900/40">
                      <Webhook className="h-5 w-5 text-purple-600 dark:text-purple-400" strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-medium text-purple-700 dark:text-purple-400">Webhook Actions</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Connect to your existing systems and APIs to fetch or send data during conversations.
                    </p>
                  </div>
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all duration-300">
                  <ArrowRight className="h-5 w-5 text-purple-500" strokeWidth={1.5} />
                </div>
              </CardContent>
            </Card>
            
            {/* Email Card */}
            <Card className="overflow-hidden border-none shadow-md group hover:shadow-lg transition-all duration-300">
              <div className="absolute top-0 h-full w-1 bg-gradient-to-b from-emerald-400 to-emerald-600 dark:from-emerald-500 dark:to-emerald-700" />
              <CardContent className="p-4 pl-5">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-emerald-100 dark:bg-emerald-900/40">
                      <Mail className="h-5 w-5 text-emerald-600 dark:text-emerald-400" strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-medium text-emerald-700 dark:text-emerald-400">Email Actions</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Send personalized emails with information collected during the conversation.
                    </p>
                  </div>
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-4 transition-all duration-300">
                  <ArrowRight className="h-5 w-5 text-emerald-500" strokeWidth={1.5} />
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="pt-3">
            <Button
              onClick={() => onOpenChange(false)}
              className="w-full flex items-center justify-center gap-2 py-5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 hover:from-blue-600 hover:via-purple-600 hover:to-pink-600 text-white border-none shadow-md hover:shadow-lg transition-all"
            >
              <span>Got it</span>
              <Sparkles className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
