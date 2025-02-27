
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, PhoneCall, Settings } from "lucide-react";
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
    <div className="relative h-16 bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl flex items-center justify-between px-8 z-50 shadow-[0_1px_0_0_rgba(0,0,0,0.05)]">
      <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-white/30 to-white/60 dark:from-gray-900/60 dark:via-gray-800/30 dark:to-gray-900/60 pointer-events-none" />
      
      <div className="flex items-center gap-6 relative">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack}
          className="hover:bg-gray-900/5 dark:hover:bg-white/5 transition-all duration-300 rounded-full"
        >
          <ArrowLeft className="h-4 w-4 text-gray-700 dark:text-gray-300" />
        </Button>
        <div className="flex flex-col">
          <h1 className="font-medium text-gray-900 dark:text-white">{agent.name}</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{agent.role.replace('_', ' ')}</p>
        </div>
      </div>

      <div className="flex items-center gap-3 relative">
        <AgentSettings
          agentId={agent.id}
          currentVoice={agent.voice_id || undefined}
          currentLanguage={agent.language}
          onUpdateSettings={onUpdateSettings}
        >
          <Button 
            variant="ghost" 
            size="icon"
            className="h-10 w-10 rounded-full hover:bg-gray-900/5 dark:hover:bg-white/5"
          >
            <Settings className="h-5 w-5 text-gray-700 dark:text-gray-300" />
          </Button>
        </AgentSettings>
        <ThemeToggle />
        <div className="flex items-center gap-2 ml-2">
          <Button 
            variant="secondary"
            className="bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 text-gray-900 dark:text-white backdrop-blur-xl transition-all duration-300"
          >
            <PhoneCall className="h-4 w-4 mr-2" />
            Call Me
          </Button>
          <Button 
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium transition-all duration-300"
          >
            <Play className="h-4 w-4 mr-2" />
            Train {agent.name}
          </Button>
        </div>
      </div>
    </div>
  );
}
