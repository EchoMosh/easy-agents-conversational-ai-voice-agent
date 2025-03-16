
import { Mail, MessageCircle, StickyNote } from "lucide-react";
import { Lead } from "@/pages/dashboard/leads";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MessageComposer } from "./message-composer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Pipeline, convertJsonToPipeline } from "@/types/pipeline";
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

interface ChatAreaProps {
  selectedLead: Lead | undefined;
  messageType: 'email' | 'sms' | 'note';
  onMessageTypeChange: (type: 'email' | 'sms' | 'note') => void;
}

export function ChatArea({ 
  selectedLead, 
  messageType, 
  onMessageTypeChange 
}: ChatAreaProps) {
  const { toast } = useToast();

  const { data: pipeline } = useQuery({
    queryKey: ['pipeline', selectedLead?.pipeline_id],
    queryFn: async () => {
      if (!selectedLead?.pipeline_id) return null;
      
      const { data, error } = await supabase
        .from('pipelines')
        .select('*')
        .eq('id', selectedLead.pipeline_id)
        .single();
      
      if (error) throw error;
      return convertJsonToPipeline(data);
    },
    enabled: !!selectedLead?.pipeline_id
  });

  useEffect(() => {
    const updateLeadStatus = async () => {
      if (!selectedLead || !pipeline) return;
      
      const firstStage = pipeline.columns[0]?.title;
      if (!firstStage || selectedLead.status === firstStage) return;

      const { error } = await supabase
        .from('leads')
        .update({ status: firstStage })
        .eq('id', selectedLead.id);

      if (error) {
        console.error('Error updating lead status:', error);
        toast({
          title: "Error",
          description: "Failed to update lead status",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Lead Updated",
        description: `Lead moved to ${firstStage} stage`
      });
    };

    updateLeadStatus();
  }, [selectedLead?.pipeline_id, pipeline]);

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
              <h2 className="text-xl font-bold text-foreground">{selectedLead.name}</h2>
              <p className="text-sm text-muted-foreground">
                {selectedLead.email || selectedLead.phone || "No contact info"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1">
        {/* Chat messages will go here */}
      </div>

      <MessageComposer 
        messageType={messageType}
        onMessageTypeChange={onMessageTypeChange}
        leadId={selectedLead.id}
      />
    </div>
  );
}
