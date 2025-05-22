import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

interface VapiCall {
  id: string;
  assistantId?: string;
  createdAt: string;
  summary?: string;
  // Add other relevant fields from Vapi call object
}

interface Agent {
  id: string;
  name: string;
  assistantId: string;
  workspace_id: string;
}

interface CallListProps {
  calls: VapiCall[];
  agents: Agent[]; // To map assistantId to agent name
  onViewTranscript: (callId: string) => void;
  isLoading?: boolean; // This might not be needed if parent handles loading state
}

const CallList: React.FC<CallListProps> = ({ calls, agents, onViewTranscript }) => {
  // Loading and empty states are now handled by the parent TranscriptionsPage component.
  // This component will only render the list if calls are provided.
  if (calls.length === 0) {
    // This case should ideally be handled by the parent, 
    // but as a fallback or if used standalone:
    return null; 
  }

  const getAgentName = (assistantId?: string) => {
    if (!assistantId) return 'N/A';
    const agent = agents.find(a => a.assistantId === assistantId);
    return agent ? agent.name : 'Unknown Agent';
  };

  return (
    <div className="space-y-4"> {/* Removed mt-6 as parent now controls spacing */}
      {calls.map((call) => {
        const agentName = getAgentName(call.assistantId);
        const callTimestamp = new Date(call.createdAt).toLocaleString();

        return (
          <Card key={call.id} className="bg-card hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="pb-3"> {/* Reduced padding */}
              <CardTitle className="flex justify-between items-center text-lg">
                <span>Agent: {agentName}</span>
                <span className="text-sm font-normal text-muted-foreground">{callTimestamp}</span>
              </CardTitle>
              {call.assistantId && (
                <CardDescription>Assistant ID: {call.assistantId}</CardDescription>
              )}
            </CardHeader>
            {call.summary && (
              <CardContent className="text-sm text-muted-foreground pt-0 pb-4"> {/* Adjusted padding */}
                <p className="line-clamp-3">{call.summary}</p> {/* Using line-clamp for controlled summary length */}
              </CardContent>
            )}
            <CardFooter>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewTranscript(call.id)}
              >
                View Transcript
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
};

export default CallList;
