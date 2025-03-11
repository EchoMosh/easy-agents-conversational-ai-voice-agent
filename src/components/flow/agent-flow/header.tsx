
import { useState } from 'react';
import { ArrowLeft, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Agent } from '@/types/agent-types';
import { AgentSettings } from '@/components/agents/flow/agent-settings';

interface HeaderProps {
  agent: Agent;
  onBack: () => void;
  onUpdateSettings: (settings: {
    voiceId?: string;
    language?: string;
    humorLevel?: number;
    maxDurationSeconds?: number;
    first_message?: string;
    first_message_mode?: 'assistant-speaks-first' | 'user-speaks-first';
    end_call_message?: string;
    background_sound?: 'off' | 'office' | 'cafe' | 'nature';
    background_denoising_enabled?: boolean;
  }) => Promise<void>;
}

export function Header({ agent, onBack, onUpdateSettings }: HeaderProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <header className="flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-4 py-3 sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">{agent?.name || 'Flow Editor'}</h1>
          <p className="text-sm text-muted-foreground">
            {agent?.role === 'virtual_assistant' 
              ? 'Virtual Assistant' 
              : agent?.role?.replace('_', ' ')}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Agent Settings</DialogTitle>
            </DialogHeader>
            <AgentSettings 
              agent={agent} 
              onUpdateSettings={async (settings) => {
                await onUpdateSettings(settings);
                setIsSettingsOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>
    </header>
  );
}
