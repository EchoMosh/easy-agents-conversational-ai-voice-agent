
import { Lead } from "@/pages/dashboard/leads";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MessageComposer } from "./message-composer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Pipeline, convertJsonToPipeline } from "@/types/pipeline";
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ChatMessages } from "./chat-messages";
import { ActivityMonitor } from "./activity-monitor";
import useChatStore from "@/hooks/use-chat-store";
import { Mail, MessageCircle, StickyNote } from "lucide-react";
import { fetchLeadActivities } from "@/utils/supabase-activity-utils";

interface ChatAreaProps {
  selectedLead: Lead | undefined;
  messageType: "email" | "sms" | "note";
  onMessageTypeChange: (type: "email" | "sms" | "note") => void;
}

export function ChatArea({
  selectedLead,
  messageType,
  onMessageTypeChange,
}: ChatAreaProps) {
  const { toast } = useToast();
  const { setSelectedLeadId, setMessageType } = useChatStore();

  // Keep the Zustand store in sync with the parent component's state
  useEffect(() => {
    if (selectedLead) {
      setSelectedLeadId(selectedLead.id);
    } else {
      setSelectedLeadId(null);
    }
    setMessageType(messageType);
  }, [selectedLead, messageType, setSelectedLeadId, setMessageType]);

  // Fetch activities for the selected lead
  const { data: activities } = useQuery({
    queryKey: ["lead-activities", selectedLead?.id],
    queryFn: async () => {
      if (!selectedLead?.id) return [];
      
      try {
        const activities = await fetchLeadActivities(selectedLead.id, 30);
        
        // Transform activities to the format expected by ActivityTab
        return activities.map(activity => ({
          id: activity.id,
          type: activity.activity_type as any || "note",
          content: activity.content || `Activity related to ${selectedLead.name}`,
          timestamp: activity.created_at,
          metadata: activity.metadata || {}
        }));
      } catch (error) {
        console.error("Error fetching lead activities:", error);
        return [];
      }
    },
    enabled: !!selectedLead?.id,
  });

  const { data: pipeline } = useQuery({
    queryKey: ["pipeline", selectedLead?.pipeline_id],
    queryFn: async () => {
      if (!selectedLead?.pipeline_id) return null;

      const { data, error } = await supabase
        .from("pipelines")
        .select("*")
        .eq("id", selectedLead.pipeline_id)
        .single();

      if (error) throw error;
      return convertJsonToPipeline(data);
    },
    enabled: !!selectedLead?.pipeline_id,
  });

  useEffect(() => {
    const updateLeadStatus = async () => {
      if (!selectedLead || !pipeline) return;

      const firstStage = pipeline.columns[0]?.title;
      if (!firstStage || selectedLead.status === firstStage) return;

      const { error } = await supabase
        .from("leads")
        .update({ status: firstStage })
        .eq("id", selectedLead.id);

      if (error) {
        console.error("Error updating lead status:", error);
        toast({
          title: "Error",
          description: "Failed to update lead status",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Lead Updated",
        description: `Lead moved to ${firstStage} stage`,
      });
    };

    updateLeadStatus();
  }, [selectedLead?.pipeline_id, pipeline]);

  if (!selectedLead) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center space-y-2">
          <Mail className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="text-muted-foreground">
            Select a lead to start messaging
          </p>
        </div>
      </div>
    );
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="flex-1">
      <ResizablePanel defaultSize={70} minSize={40}>
        <div className="flex flex-col h-full">
          <div className="border-b p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-lg">
                  {selectedLead.name[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-foreground">
                    {selectedLead.name}
                  </h2>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {selectedLead.email ||
                      selectedLead.phone ||
                      "No contact info"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <ChatMessages lead={selectedLead} />
          </div>

          <MessageComposer
            messageType={messageType}
            onMessageTypeChange={onMessageTypeChange}
            leadId={selectedLead.id}
          />
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={30} minSize={25}>
        <ActivityMonitor lead={selectedLead} activities={activities || []} />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
