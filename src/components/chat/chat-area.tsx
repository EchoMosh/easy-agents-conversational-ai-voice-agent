
import { Lead } from "@/pages/dashboard/leads";
import { MessageComposer } from "./message-composer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Pipeline, convertJsonToPipeline } from "@/types/pipeline";
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ChatMessages } from "./chat-messages";
import { ActivityMonitor } from "./activity-monitor";
import useChatStore from "@/hooks/use-chat-store";
import { Mail } from "lucide-react";
import { fetchLeadActivities } from "@/utils/supabase-activity-utils";
import { ActivityType } from "./types/activity-types";

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

  useEffect(() => {
    if (selectedLead) {
      setSelectedLeadId(selectedLead.id);
    } else {
      setSelectedLeadId(null);
    }
    setMessageType(messageType);
  }, [selectedLead, messageType, setSelectedLeadId, setMessageType]);

  const { data: pipeline } = useQuery({
    queryKey: ["pipeline", selectedLead?.pipeline_id],
    queryFn: async () => {
      if (!selectedLead?.pipeline_id) return null;
      
      const { data, error } = await supabase
        .from("pipelines")
        .select("*")
        .eq("id", selectedLead.pipeline_id)
        .single();
        
      if (error) {
        console.error("Error fetching pipeline:", error);
        return null;
      }
      
      return data ? convertJsonToPipeline(data) : null;
    },
    enabled: !!selectedLead?.pipeline_id,
  });

  const { data: activities } = useQuery({
    queryKey: ["lead-activities", selectedLead?.id],
    queryFn: async () => {
      if (!selectedLead?.id) return [];
      
      try {
        const activities = await fetchLeadActivities(selectedLead.id, 30);
        
        return activities.map(activity => {
          let activityType: ActivityType = "note";
          
          if (activity.content.toLowerCase().includes('email')) {
            activityType = "email";
          } else if (activity.content.toLowerCase().includes('sms')) {
            activityType = "sms";
          } else if (activity.content.toLowerCase().includes('note')) {
            activityType = "note";
          } else if (activity.content.toLowerCase().includes('status')) {
            activityType = "status_change";
          } else if (activity.content.toLowerCase().includes('created')) {
            activityType = "lead_created";
          } else if (activity.content.toLowerCase().includes('tag')) {
            activityType = "tag_added";
          }
          
          const metadata: Record<string, any> = {};
          if (activity.old_value) metadata.old_status = activity.old_value;
          if (activity.new_value) metadata.new_status = activity.new_value;
          
          return {
            id: activity.id,
            type: activityType,
            content: activity.content || `Activity related to ${selectedLead.name}`,
            timestamp: activity.created_at,
            metadata
          };
        });
      } catch (error) {
        console.error("Error fetching lead activities:", error);
        return [];
      }
    },
    enabled: !!selectedLead?.id,
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
  }, [selectedLead?.pipeline_id, pipeline, selectedLead, toast]);

  if (!selectedLead) {
    return (
      <div className="flex-1 flex items-center justify-center h-[calc(100vh-4rem)]">
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
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <div className="w-[75%] flex flex-col border-r">
        <div className="border-b p-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
              {selectedLead.name[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                {selectedLead.name}
              </h2>
              <p className="text-xs text-muted-foreground">
                {selectedLead.email || selectedLead.phone || "No contact info"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <ChatMessages lead={selectedLead} />
        </div>

        <div className="flex-shrink-0">
          <MessageComposer
            messageType={messageType}
            onMessageTypeChange={onMessageTypeChange}
            leadId={selectedLead.id}
          />
        </div>
      </div>

      <div className="w-[25%]">
        <ActivityMonitor lead={selectedLead} activities={activities || []} />
      </div>
    </div>
  );
}
