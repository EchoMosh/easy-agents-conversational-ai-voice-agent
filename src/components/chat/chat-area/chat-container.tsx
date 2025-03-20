
import { Lead } from "@/pages/dashboard/leads";
import { ChatMessages } from "../chat-messages";
import { MessageComposer } from "../message-composer";
import { useIsMobile } from "@/hooks/use-mobile";
import { AnimatePresence } from "framer-motion";
import { ActivityMonitorDrawer } from "./activity-monitor-drawer";
import { ActivityType } from "../types/activity-types";

interface ChatContainerProps {
  selectedLead: Lead;
  messageType: "email" | "sms" | "note";
  onMessageTypeChange: (type: "email" | "sms" | "note") => void;
  showActivityMonitor: boolean;
  activities: ActivityType[];
  onCloseActivityMonitor: () => void;
}

export function ChatContainer({
  selectedLead,
  messageType,
  onMessageTypeChange,
  showActivityMonitor,
  activities,
  onCloseActivityMonitor
}: ChatContainerProps) {
  const isMobile = useIsMobile();

  return (
    <>
      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 overflow-y-auto">
          <ChatMessages lead={selectedLead} />
        </div>
        
        <AnimatePresence>
          {showActivityMonitor && (
            <ActivityMonitorDrawer 
              show={showActivityMonitor}
              onClose={onCloseActivityMonitor}
              lead={selectedLead}
              activities={activities}
            />
          )}
        </AnimatePresence>
      </div>

      <div className="flex-shrink-0 mt-auto">
        <MessageComposer
          messageType={messageType}
          onMessageTypeChange={onMessageTypeChange}
          leadId={selectedLead.id}
        />
      </div>
    </>
  );
}
