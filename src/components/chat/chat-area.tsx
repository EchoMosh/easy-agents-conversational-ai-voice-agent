import { Mail } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lead } from "@/pages/dashboard/leads";
import { LeadProgress } from "./lead-progress";
import { MessageComposer } from "./message-composer";

interface ChatAreaProps {
  selectedLead: Lead | undefined;
  messageType: 'email' | 'sms' | 'note';
  onMessageTypeChange: (type: 'email' | 'sms' | 'note') => void;
}

export function ChatArea({ selectedLead, messageType, onMessageTypeChange }: ChatAreaProps) {
  if (!selectedLead) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <Mail className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="text-muted-foreground">Select a lead to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      <div className="border-b p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-lg">
              {selectedLead.name[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold">{selectedLead.name}</h2>
              <p className="text-sm text-muted-foreground">
                {selectedLead.email || selectedLead.phone || "No contact info"}
              </p>
            </div>
          </div>
          <LeadProgress currentStage={selectedLead.status || 'new'} />
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="space-y-4 max-w-3xl mx-auto">
          {/* Chat messages will go here when implemented */}
        </div>
      </ScrollArea>

      <MessageComposer 
        messageType={messageType} 
        onMessageTypeChange={onMessageTypeChange}
        leadId={selectedLead.id}
      />
    </div>
  );
}
