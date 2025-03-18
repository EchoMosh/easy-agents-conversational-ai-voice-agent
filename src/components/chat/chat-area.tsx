
import { Lead } from "@/pages/dashboard/leads";
import { MessageComposer } from "./message-composer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Pipeline, convertJsonToPipeline } from "@/types/pipeline";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ChatMessages } from "./chat-messages";
import { ActivityMonitor } from "./activity-monitor";
import useChatStore from "@/hooks/use-chat-store";
import { ChevronLeft, BarChart2, X } from "lucide-react";
import { fetchLeadActivities } from "@/utils/supabase-activity-utils";
import { ActivityType } from "./types/activity-types";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";

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
  const { toast } = useToast();
  const { setSelectedLeadId, setMessageType } = useChatStore();
  const isMobile = useIsMobile();
  const [showActivityMonitor, setShowActivityMonitor] = useState(false);

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
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center space-y-2">
          <Button variant="ghost" className="size-12 rounded-full mx-auto">
            <ChevronLeft className="h-5 w-5 text-muted-foreground" />
          </Button>
          <p className="text-muted-foreground">
            Select a lead to start messaging
          </p>
        </div>
      </div>
    );
  }

  // For mobile, use a different layout
  if (isMobile) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="border-b p-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {onBack && (
                <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
                {selectedLead.name[0].toUpperCase()}
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">
                  {selectedLead.name}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {selectedLead.email || selectedLead.phone || "No contact info"}
                </p>
              </div>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setShowActivityMonitor(!showActivityMonitor)}
            >
              <BarChart2 className={cn("h-4 w-4", showActivityMonitor && "text-primary")} />
            </Button>
          </div>
        </div>

        <div className="relative flex-1 overflow-hidden">
          <ChatMessages lead={selectedLead} />
          
          <AnimatePresence>
            {showActivityMonitor && (
              <motion.div 
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                className="absolute inset-0 bg-background z-10"
              >
                <div className="flex items-center justify-between border-b p-2">
                  <h3 className="text-sm font-medium">Activity & Insights</h3>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7" 
                    onClick={() => setShowActivityMonitor(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="overflow-y-auto h-[calc(100%-40px)]">
                  <ActivityMonitor lead={selectedLead} activities={activities || []} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-shrink-0">
          <MessageComposer
            messageType={messageType}
            onMessageTypeChange={onMessageTypeChange}
            leadId={selectedLead.id}
          />
        </div>
      </div>
    );
  }

  // For desktop, use a single panel with activity drawer
  return (
    <div className="flex flex-col h-full overflow-hidden relative">
      <div className="border-b p-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs">
              {selectedLead.name[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                {selectedLead.name}
              </h2>
              <p className="text-xs text-muted-foreground">
                {selectedLead.email || selectedLead.phone || "No contact info"}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge 
              variant={showActivityMonitor ? "default" : "outline"} 
              className="flex gap-1.5 items-center cursor-pointer"
              onClick={() => setShowActivityMonitor(!showActivityMonitor)}
            >
              <BarChart2 className="h-3.5 w-3.5" />
              <span>Activity</span>
              {activities && activities.length > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-background text-[10px] text-foreground">
                  {activities.length}
                </span>
              )}
            </Badge>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <div className="h-full">
          <ChatMessages lead={selectedLead} />
        </div>

        <AnimatePresence>
          {showActivityMonitor && (
            <motion.div 
              initial={{ x: '100%', opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0.5 }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              className="absolute inset-y-0 right-0 w-[320px] bg-background border-l z-10"
            >
              <div className="flex items-center justify-between border-b p-2">
                <h3 className="text-sm font-medium">Activity & Insights</h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={() => setShowActivityMonitor(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="overflow-y-auto h-[calc(100%-40px)]">
                <ActivityMonitor lead={selectedLead} activities={activities || []} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-shrink-0">
        <MessageComposer
          messageType={messageType}
          onMessageTypeChange={onMessageTypeChange}
          leadId={selectedLead.id}
        />
      </div>
    </div>
  );
}
