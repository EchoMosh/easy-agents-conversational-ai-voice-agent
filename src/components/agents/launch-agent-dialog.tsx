import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserRound, Users } from "lucide-react";
import { Agent } from "@/types/agent";

interface LaunchAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: Agent;
}

export function LaunchAgentDialog({
  open,
  onOpenChange,
  agent,
}: LaunchAgentDialogProps) {
  const handleSingleCall = () => {
    console.log("Single call option selected for agent:", agent.name);
    // Implementation would go here
    onOpenChange(false);
  };

  const handleBulkCall = () => {
    console.log("Bulk call option selected for agent:", agent.name);
    // Implementation would go here
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700/60 shadow-xl">
        <DialogHeader className="p-6 pb-2 border-b border-gray-100 dark:border-gray-800">
          <DialogTitle className="text-xl font-semibold">Launch Agent</DialogTitle>
          <DialogDescription className="text-gray-500 dark:text-gray-400">
            Choose how you want to launch {agent.name}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 p-6">
          <div className="flex flex-col items-center">
            <Button
              onClick={handleSingleCall}
              className="w-full h-32 flex flex-col items-center justify-center gap-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm transition-all hover:shadow-md"
            >
              <UserRound className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
              <span className="text-base font-medium">Individual Contact</span>
            </Button>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Launch a call with a single contact
            </p>
          </div>

          <div className="flex flex-col items-center">
            <Button
              onClick={handleBulkCall}
              className="w-full h-32 flex flex-col items-center justify-center gap-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm transition-all hover:shadow-md"
            >
              <Users className="h-8 w-8 text-indigo-500 dark:text-indigo-400" />
              <span className="text-base font-medium">Bulk Campaign</span>
            </Button>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Launch calls to multiple contacts at once
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
