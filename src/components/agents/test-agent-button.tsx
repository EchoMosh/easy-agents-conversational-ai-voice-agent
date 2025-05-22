import React from "react";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

interface TestAgentButtonProps {
  onClick: () => void;
}

export function TestAgentButton({ onClick }: TestAgentButtonProps) {
  return (
    <Button
      variant="outline"
      className="rounded-full px-4 py-2 h-9 border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-slate-100 transition-colors shadow-sm group relative overflow-hidden"
      onClick={onClick}
    >
      <div className="absolute inset-0 pointer-events-none group-hover:opacity-100 opacity-0 transition-opacity">
        <div className="lightning-flash-1 absolute inset-0 opacity-5"></div>
        <div className="lightning-flash-2 absolute inset-0 opacity-5"></div>
        <div className="electricity-effect rounded-full"></div>
        <svg className="absolute h-full w-full opacity-0 group-hover:opacity-10 transition-opacity" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M50,0 L60,40 L90,50 L60,60 L50,100 L40,60 L10,50 L40,40 z" fill="url(#lightning-gradient)" stroke="none" className="group-hover:animate-pulse" />
          <defs>
            <linearGradient id="lightning-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#60a5fa" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <Zap className="h-3.5 w-3.5 mr-1.5 group-hover:animate-lightning relative z-10 button-glow" />
      <span className="text-sm font-medium relative z-10">Test Agent</span>
    </Button>
  );
}
