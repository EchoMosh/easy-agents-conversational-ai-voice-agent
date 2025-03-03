
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Settings, BookOpen } from "lucide-react";
import { AgentSettings } from "@/components/agents/flow/agent-settings";
import { TrainingExamplesManager } from "@/components/agents/training/training-examples-manager";
import { Agent } from "@/types/agent-types";

interface HeaderProps {
  agent: Agent;
  onBack: () => void;
  onUpdateSettings: (settings: {
    voiceId?: string;
    language?: string;
    humorLevel?: number;
    maxDurationSeconds?: number;
  }) => void;
}

export function Header({ agent, onBack, onUpdateSettings }: HeaderProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showTrainingManager, setShowTrainingManager] = useState(false);

  return (
    <div className="border-b bg-white dark:bg-gray-950 h-14 px-4 flex items-center justify-between">
      <div className="flex items-center">
        <Button variant="ghost" onClick={onBack} size="icon">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="ml-2">
          <h1 className="text-lg font-medium">{agent.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
            {agent.role.replace('_', ' ')}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          onClick={() => setShowTrainingManager(true)}
        >
          <BookOpen className="h-4 w-4" />
          <span>Training Examples</span>
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setShowSettings(true)}
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>
      
      <AgentSettings
        agent={agent}
        open={showSettings}
        onOpenChange={setShowSettings}
        onUpdateSettings={onUpdateSettings}
      />
      
      <TrainingExamplesManager
        agent={agent}
        open={showTrainingManager}
        onOpenChange={setShowTrainingManager}
      />
    </div>
  );
}
