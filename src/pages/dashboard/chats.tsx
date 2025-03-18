import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "./leads";
import { LeadSidebar } from "@/components/chat/lead-sidebar";
import { ChatArea } from "@/components/chat/chat-area";
import { History, Mail, Inbox } from "lucide-react";
import useChatStore from "@/hooks/use-chat-store";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

export default function ChatsPage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"email" | "sms" | "note">(
    "email"
  );
  const { setMessages, updateLeadActivity } = useChatStore();

  // Fetch leads
  const {
    data: leads,
    isLoading: leadsLoading,
    error: leadsError,
  } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select(`
          *,
          variables:lead_variables(*),
          tags:lead_tags(
            tag:tags(*)
          )
        `);

      if (error) {
        console.error("Error fetching leads:", error);
        throw error;
      }

      return (data || []).map((lead) => ({
        ...lead,
        tags: (lead.tags || []).map((tagRelation: any) => tagRelation.tag),
      })) as Lead[];
    },
  });

  // Find the selected lead
  const selectedLead = leads?.find((lead) => lead.id === selectedLeadId);

  // Fetch messages for the selected lead
  const { data: leadMessages } = useQuery({
    queryKey: ["lead_messages", selectedLeadId],
    queryFn: async () => {
      if (!selectedLeadId) return [];

      // For now, we'll fetch notes as a sample of messages
      const { data, error } = await supabase
        .from("lead_notes")
        .select("*")
        .eq("lead_id", selectedLeadId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching lead notes:", error);
        throw error;
      }

      // We'll use the authenticated user info for all messages for simplicity
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      // Transform notes to our message format
      return (data || []).map((note) => {
        // Generate a placeholder user name from the user ID
        const userName =
          currentUser?.email?.split("@")[0] ||
          `User_${note.user_id.substring(0, 5)}`;

        return {
          id: note.id,
          leadId: note.lead_id,
          content: note.content,
          type: "note" as const,
          createdAt: note.created_at,
          userId: note.user_id,
          userName: userName,
          userAvatar: currentUser?.user_metadata?.avatar_url,
        };
      });
    },
    enabled: !!selectedLeadId,
  });

  // Fetch lead activities
  const { data: leadActivities } = useQuery({
    queryKey: ["lead_activities", selectedLeadId],
    queryFn: async () => {
      if (!selectedLeadId) return [];

      const { data, error } = await supabase
        .from("lead_activities")
        .select("*")
        .eq("lead_id", selectedLeadId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) {
        console.error("Error fetching lead activities:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!selectedLeadId,
  });

  // Update the chat store with the fetched messages and activities
  useEffect(() => {
    if (leadMessages) {
      setMessages(leadMessages);
    }
  }, [leadMessages, setMessages]);

  // Update lead activities in the store when they change
  useEffect(() => {
    if (selectedLeadId && leadActivities && leadActivities.length > 0) {
      // Calculate message counts
      const notesCount =
        leadMessages?.filter((m) => m.type === "note").length || 0;

      // Create activity summary
      updateLeadActivity(selectedLeadId, {
        lastActive: leadActivities[0].created_at,
        activityHistory: leadActivities,
        messageCount: {
          email: 0, // This would be from real email data
          sms: 0, // This would be from real SMS data
          note: notesCount,
          total: notesCount,
        },
      });
    }
  }, [selectedLeadId, leadActivities, leadMessages, updateLeadActivity]);

  // Log any lead loading errors
  if (leadsError) {
    console.error("Lead query error:", leadsError);
  }

  return (
    <ResizablePanelGroup
      direction="horizontal"
      className="h-full bg-background"
    >
      <ResizablePanel
        defaultSize={20}
        minSize={10}
        maxSize={35}
        collapsible={true}
      >
        <LeadSidebar
          leads={leads}
          selectedLeadId={selectedLeadId}
          onLeadSelect={(id) => {
            setSelectedLeadId(id);
          }}
          className="h-full"
        />
      </ResizablePanel>

      <ResizableHandle withHandle />

      <ResizablePanel defaultSize={80}>
        <ChatArea
          selectedLead={selectedLead}
          messageType={messageType}
          onMessageTypeChange={setMessageType}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
