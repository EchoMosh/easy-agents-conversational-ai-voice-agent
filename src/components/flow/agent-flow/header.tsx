
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, PhoneCall } from "lucide-react";
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
        <Button 
          variant="outline"
          className="bg-white/40 dark:bg-gray-800/40 hover:bg-white/80 dark:hover:bg-gray-800/80 text-gray-900 dark:text-white border border-gray-200/20 dark:border-gray-700/20 backdrop-blur-xl transition-all duration-300"
        >
          <PhoneCall className="h-4 w-4 mr-2" />
          Call Me
        </Button>
        <div className="h-6 w-[1px] bg-gradient-to-b from-gray-200/0 via-gray-200/50 to-gray-200/0 dark:from-gray-700/0 dark:via-gray-700/50 dark:to-gray-700/0" />
        <AgentSettings
          agentId={agent.id}
          currentVoice={agent.voice_id || undefined}
          currentLanguage={agent.language}
          onUpdateSettings={onUpdateSettings}
        />
        <ThemeToggle />
        <div className="h-6 w-[1px] bg-gradient-to-b from-gray-200/0 via-gray-200/50 to-gray-200/0 dark:from-gray-700/0 dark:via-gray-700/50 dark:to-gray-700/0" />
        <Button 
          className="bg-purple-600 hover:bg-purple-700 text-white font-medium transition-all duration-300"
        >
          <Play className="h-4 w-4 mr-2" />
          Train {agent.name}
        </Button>
      </div>
    </div>
  );
}
