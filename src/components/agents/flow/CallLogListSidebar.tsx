import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import CallLogListItem from './CallLogListItem';
import { VoiceCall } from './AgentCallLogsModal'; // Assuming VoiceCall type is exported here

interface CallLogListSidebarProps {
  calls: VoiceCall[];
  selectedCallId: string | null;
  onCallSelect: (callId: string) => void;
  isLoading?: boolean; // Optional loading prop for skeleton
  agentName?: string; // To pass to list items
}

const CallLogListSidebar: React.FC<CallLogListSidebarProps> = ({
  calls,
  selectedCallId,
  onCallSelect,
  isLoading,
  agentName,
}) => {
  if (isLoading) {
    // Parent modal already shows a more comprehensive skeleton for the whole content area.
    // We can show a simpler one here or rely on parent. For now, simple message.
    // Or, if we want specific sidebar skeleton:
    // return (
    //   <div className="p-2 space-y-2">
    //     {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-md" />)}
    //   </div>
    // );
    return null; // Rely on parent's skeleton for now
  }

  if (calls.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400 h-full flex items-center justify-center">
        No calls to display.
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        {calls.map((call) => (
          <CallLogListItem
            key={call.id}
            call={call}
            isSelected={call.id === selectedCallId}
            onSelect={() => onCallSelect(call.id)}
            agentName={agentName}
          />
        ))}
      </div>
    </ScrollArea>
  );
};

export default CallLogListSidebar;
