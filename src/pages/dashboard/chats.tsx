
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "./leads";
import { LeadSidebar } from "@/components/chat/lead-sidebar";
import { ChatArea } from "@/components/chat/chat-area";
import useChatStore from "@/hooks/use-chat-store";
import { useIsMobile } from "@/hooks/use-mobile";
import { useWorkspace } from "@/context/workspace-context";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ChatsPage() {
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"email" | "sms" | "note">("email");
  const {
    setMessages,
    updateLeadActivity
  } = useChatStore();
  const isMobile = useIsMobile();
  const [showSidebar, setShowSidebar] = useState(!isMobile);
  const { currentWorkspace } = useWorkspace();
  
  useEffect(() => {
    setShowSidebar(!isMobile);
  }, [isMobile]);
  
  useEffect(() => {
    // Clear selected lead when workspace changes
    setSelectedLeadId(null);
    setMessages([]);
  }, [currentWorkspace, setMessages]);

  const {
    data: leads,
    isLoading: leadsLoading,
    error: leadsError
  } = useQuery({
    queryKey: ["leads", currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) {
        return [];
      }
      
      const {
        data,
        error
      } = await supabase.from("leads").select(`
          *,
          variables:lead_variables(*),
          tags:lead_tags(
            tag:tags(*)
          )
        `)
        .eq("workspace_id", currentWorkspace.id);
        
      if (error) {
        console.error("Error fetching leads:", error);
        throw error;
      }
      
      return (data || []).map(lead => ({
        ...lead,
        tags: (lead.tags || []).map((tagRelation: any) => tagRelation.tag)
      })) as Lead[];
    },
    enabled: !!currentWorkspace?.id
  });
  
  const selectedLead = leads?.find(lead => lead.id === selectedLeadId);
  
  const {
    data: leadMessages
  } = useQuery({
    queryKey: ["lead_messages", selectedLeadId],
    queryFn: async () => {
      if (!selectedLeadId) return [];
      const {
        data,
        error
      } = await supabase.from("lead_notes").select("*").eq("lead_id", selectedLeadId).order("created_at", {
        ascending: true
      });
      if (error) {
        console.error("Error fetching lead notes:", error);
        throw error;
      }
      const {
        data: {
          user: currentUser
        }
      } = await supabase.auth.getUser();
      return (data || []).map(note => {
        const userName = currentUser?.email?.split("@")[0] || `User_${note.user_id.substring(0, 5)}`;
        return {
          id: note.id,
          leadId: note.lead_id,
          content: note.content,
          type: "note" as const,
          createdAt: note.created_at,
          userId: note.user_id,
          userName: userName,
          userAvatar: currentUser?.user_metadata?.avatar_url
        };
      });
    },
    enabled: !!selectedLeadId
  });
  
  const {
    data: leadActivities
  } = useQuery({
    queryKey: ["lead_activities", selectedLeadId],
    queryFn: async () => {
      if (!selectedLeadId) return [];
      const {
        data,
        error
      } = await supabase.from("lead_activities").select("*").eq("lead_id", selectedLeadId).order("created_at", {
        ascending: false
      }).limit(20);
      if (error) {
        console.error("Error fetching lead activities:", error);
        throw error;
      }
      return data || [];
    },
    enabled: !!selectedLeadId
  });
  
  useEffect(() => {
    if (leadMessages) {
      setMessages(leadMessages);
    }
  }, [leadMessages, setMessages]);
  
  useEffect(() => {
    if (selectedLeadId && leadActivities && leadActivities.length > 0) {
      const notesCount = leadMessages?.filter(m => m.type === "note").length || 0;
      updateLeadActivity(selectedLeadId, {
        lastActive: leadActivities[0].created_at,
        activityHistory: leadActivities,
        messageCount: {
          email: 0,
          sms: 0,
          note: notesCount,
          total: notesCount
        }
      });
    }
  }, [selectedLeadId, leadActivities, leadMessages, updateLeadActivity]);
  
  if (!currentWorkspace) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription>
            Please select a workspace to view chats.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (leadsError) {
    console.error("Lead query error:", leadsError);
    return (
      <div className="h-full flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-5 w-5" />
          <AlertDescription>
            Error loading contacts. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (leads?.length === 0 && !leadsLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <div className="bg-primary/10 p-4 rounded-full inline-block">
            <UserPlus className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold">No contacts found</h3>
          <p className="text-muted-foreground">
            Create contacts in the Leads section to start chatting with them.
          </p>
          <Button>Go to Leads</Button>
        </div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="h-full bg-background flex flex-col">
        {!selectedLead ? (
          <LeadSidebar 
            leads={leads} 
            selectedLeadId={selectedLeadId} 
            onLeadSelect={id => {
              setSelectedLeadId(id);
            }} 
            className="h-full" 
          />
        ) : (
          <ChatArea 
            selectedLead={selectedLead} 
            messageType={messageType} 
            onMessageTypeChange={setMessageType} 
            onBack={() => setSelectedLeadId(null)} 
          />
        )}
      </div>
    );
  }
  
  return (
    <div className="h-full bg-background flex overflow-hidden">
      <div className="w-[250px] flex-shrink-0 border-r">
        <LeadSidebar 
          leads={leads} 
          selectedLeadId={selectedLeadId} 
          onLeadSelect={id => {
            setSelectedLeadId(id);
          }} 
          className="h-full" 
        />
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ChatArea 
          selectedLead={selectedLead} 
          messageType={messageType} 
          onMessageTypeChange={setMessageType} 
        />
      </div>
    </div>
  );
}
