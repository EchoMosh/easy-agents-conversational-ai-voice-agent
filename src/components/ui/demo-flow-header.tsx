import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react"; 
import { Agent } from "@/types/agent";
import { useState } from "react";
import { SignInDialog } from "./sign-in-dialog";

interface DemoFlowHeaderProps {
  agent: Agent;
  onBack: () => void;
}

export function DemoFlowHeader({ agent, onBack }: DemoFlowHeaderProps) {
  const [showSignInDialog, setShowSignInDialog] = useState(false);
  return (
    <div className="relative h-auto min-h-16 w-full bg-white dark:bg-slate-900 flex items-center px-6 py-3 z-50 border-b border-gray-100 dark:border-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
      <div className="flex-1 flex items-center gap-3.5"> 
        <Button
          variant="ghost"
          size="icon"
          onClick={onBack}
          className="h-9 w-9 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="h-[18px] w-[18px] text-gray-700 dark:text-gray-300" />
        </Button>
        <div className="flex flex-col">
          <div className="flex items-center gap-2.5">
            <h1 className="font-semibold text-lg text-slate-800 dark:text-slate-100">
              {agent.name || "Unnamed Agent"}
            </h1>
            <div className="relative flex items-center">
              <div className="w-3 h-3 rounded-full flex-shrink-0 bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </div>
          </div>
          {agent.id && (
            <div className="mt-0.5 flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-full text-xs text-slate-500 dark:text-slate-400">
              <span className="font-mono truncate max-w-[120px]">{agent.id}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <Button
          variant="default"
          className="rounded-full px-4 py-2 h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow transition-all" 
          onClick={() => setShowSignInDialog(true)}
        >
          <span className="text-sm font-medium">Call Agent</span>
        </Button>
        
        <SignInDialog 
          isOpen={showSignInDialog} 
          onClose={() => setShowSignInDialog(false)} 
        />
      </div>
    </div>
  );
}
