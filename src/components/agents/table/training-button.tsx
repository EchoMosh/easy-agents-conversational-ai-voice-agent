
import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgentTrainingPopup } from '@/components/agents/training/agent-training-popup';
import { Agent } from '@/types/agent';

interface TrainingButtonProps {
  agent: Agent;
}

export function TrainingButton({ agent }: TrainingButtonProps) {
  const [isTrainingOpen, setIsTrainingOpen] = useState(false);

  return (
    <>
      <Button 
        variant="ghost" 
        size="sm" 
        className="h-8 px-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
        onClick={() => setIsTrainingOpen(true)}
        title="Train Agent"
      >
        <BookOpen className="h-4 w-4" />
        <span className="sr-only">Train Agent</span>
      </Button>
      
      <AgentTrainingPopup 
        agent={agent}
        open={isTrainingOpen}
        onOpenChange={setIsTrainingOpen}
      />
    </>
  );
}
