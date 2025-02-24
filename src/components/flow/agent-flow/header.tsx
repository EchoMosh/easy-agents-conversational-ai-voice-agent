
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { AgentSettings } from "@/components/agents/flow/agent-settings";
import { Agent } from "@/types/agent";

interface HeaderProps {
  agent: Agent;
  onBack: () => void;
  onUpdateSettings: (settings: { voiceId?: string; language?: string }) => Promise<void>;
}

export function Header({ agent, onBack, onUpdateSettings }: HeaderProps) {
  return (
    <div className="relative h-16 border-b border-gray-200/10 dark:border-gray-700/10 bg-white/60 dark:bg-gray-900/60 backdrop-blur-2xl flex items-center justify-between px-8 z-50">
      <div className="absolute inset-0 bg-gradient-to-r from-gray-50/30 via-white/30 to-gray-50/30 dark:from-gray-900/30 dark:via-gray-800/30 dark:to-gray-900/30 pointer-events-none" />
      
      <div className="flex items-center gap-6 relative">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack} 
          className="hover:bg-gray-900/5 dark:hover:bg-white/5 transition-all duration-300 rounded-full"
        >
          <ArrowLeft className="h-4 w-4 text-gray-700 dark:text-gray-300" />
        </Button>
        <div className="h-6 w-[1px] bg-gradient-to-b from-gray-200/0 via-gray-200/50 to-gray-200/0 dark:from-gray-700/0 dark:via-gray-700/50 dark:to-gray-700/0" />
        <div className="flex flex-col">
          <h1 className="font-medium text-gray-900 dark:text-white">{agent.name}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{agent.role.replace('_', ' ')}</p>
        </div>
      </div>

      <div className="flex items-center gap-4 relative">
        <AgentSettings
          agentId={agent.id}
          currentVoice={agent.voice_id || undefined}
          currentLanguage={agent.language}
          onUpdateSettings={onUpdateSettings}
        />
        <ThemeToggle />
        <div className="h-6 w-[1px] bg-gradient-to-b from-gray-200/0 via-gray-200/50 to-gray-200/0 dark:from-gray-700/0 dark:via-gray-700/50 dark:to-gray-700/0" />
        <Button 
          variant="ghost"
          className="bg-white/40 dark:bg-gray-800/40 hover:bg-white/80 dark:hover:bg-gray-800/80 text-gray-900 dark:text-white border border-gray-200/20 dark:border-gray-700/20 shadow-[0_2px_3px_-1px_rgba(0,0,0,0.1),0_1px_0_0_rgba(25,28,33,0.02),0_0_0_1px_rgba(25,28,33,0.08)] dark:shadow-[0_2px_3px_-1px_rgba(0,0,0,0.5),0_1px_0_0_rgba(255,255,255,0.02),0_0_0_1px_rgba(255,255,255,0.05)] backdrop-blur-xl transition-all duration-300"
        >
          Save Flow
        </Button>
        <Button 
          className="bg-gradient-to-b from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-[0_2px_3px_-1px_rgba(0,0,0,0.1),0_1px_0_0_rgba(25,28,33,0.02),0_0_0_1px_rgba(25,28,33,0.08)] hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.05)] dark:shadow-[0_2px_3px_-1px_rgba(0,0,0,0.5),0_1px_0_0_rgba(255,255,255,0.02),0_0_0_1px_rgba(255,255,255,0.05)] transition-all duration-300"
        >
          Deploy Agent
        </Button>
      </div>
    </div>
  );
}
