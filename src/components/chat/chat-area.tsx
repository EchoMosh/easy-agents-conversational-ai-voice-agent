
import { Lead } from "@/pages/dashboard/leads";
import { useEffect, useState } from "react";
import useChatStore from "@/hooks/use-chat-store";
import { useIsMobile } from "@/hooks/use-mobile";
import { EmptyState } from "./chat-area/empty-state";
import { ChatHeader } from "./chat-area/chat-header";
import { ChatContainer } from "./chat-area/chat-container";
import { useChatActivities } from "./chat-area/use-chat-activities";
import { usePipelineData } from "./chat-area/use-pipeline-data";
import { Activity } from "./types/activity-types";

interface ChatAreaProps {
  selectedLead: Lead | undefined;
  messageType: "email" | "sms" | "note";
  onMessageTypeChange: (type: "email" | "sms" | "note") => void;
  onBack?: () => void;
}

export function ChatArea({
  selectedLead,
  messageType,
  onMessageTypeChange,
  onBack,
}: ChatAreaProps) {
  const { setSelectedLeadId, setMessageType } = useChatStore();
  const isMobile = useIsMobile();
  const [showActivityMonitor, setShowActivityMonitor] = useState(false);

  // Set selected lead ID and message type in store
  useEffect(() => {
    if (selectedLead) {
      setSelectedLeadId(selectedLead.id);
    } else {
      setSelectedLeadId(null);
    }
    setMessageType(messageType);
  }, [selectedLead, messageType, setSelectedLeadId, setMessageType]);

  // Get pipeline data for selected lead
  usePipelineData(selectedLead);

  // Get activities for selected lead
  const { data: activities = [] } = useChatActivities(selectedLead?.id);

  if (!selectedLead) {
    return <EmptyState />;
  }

  // For mobile, use a different layout with fixed height
  if (isMobile) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <ChatHeader 
          selectedLead={selectedLead} 
          showActivityMonitor={showActivityMonitor}
          setShowActivityMonitor={setShowActivityMonitor}
          onBack={onBack}
        />

        <ChatContainer 
          selectedLead={selectedLead}
          messageType={messageType}
          onMessageTypeChange={onMessageTypeChange}
          showActivityMonitor={showActivityMonitor}
          activities={activities}
          onCloseActivityMonitor={() => setShowActivityMonitor(false)}
        />
      </div>
    );
  }

  // For desktop, use a more flexible layout with correct height constraints
  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      <ChatHeader 
        selectedLead={selectedLead} 
        showActivityMonitor={showActivityMonitor}
        setShowActivityMonitor={setShowActivityMonitor}
        activitiesCount={activities.length}
      />

      <ChatContainer 
        selectedLead={selectedLead}
        messageType={messageType}
        onMessageTypeChange={onMessageTypeChange}
        showActivityMonitor={showActivityMonitor}
        activities={activities}
        onCloseActivityMonitor={() => setShowActivityMonitor(false)}
      />
    </div>
  );
}
