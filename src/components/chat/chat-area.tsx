
import { Mail, MessageCircle, StickyNote } from "lucide-react";
import { Lead } from "@/pages/dashboard/leads";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { LeadProgress } from "./lead-progress";
import { MessageComposer } from "./message-composer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Pipeline, convertJsonToPipeline } from "@/types/pipeline";

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
  // Fetch the current pipeline to get its stages
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

  // Get the current stage index from the pipeline columns
  const currentStageIndex = pipeline?.columns.findIndex(
    col => col.title.toLowerCase() === selectedLead.status.toLowerCase()
  ) ?? 0;

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
          {pipeline && (
            <LeadProgress 
              currentStage={selectedLead.status} 
              stages={pipeline.columns.map(col => ({
                id: col.id,
                label: col.title
              }))}
            />
          )}
        </div>

        <div className="mt-6">
          <ToggleGroup 
            type="single" 
            value={messageType}
            onValueChange={(value) => value && onMessageTypeChange(value as 'email' | 'sms' | 'note')}
            className="justify-start"
          >
            <ToggleGroupItem value="email" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              Email
            </ToggleGroupItem>
            <ToggleGroupItem value="sms" size="sm">
              <MessageCircle className="h-4 w-4 mr-2" />
              SMS
            </ToggleGroupItem>
            <ToggleGroupItem value="note" size="sm">
              <StickyNote className="h-4 w-4 mr-2" />
              Note
            </ToggleGroupItem>
          </ToggleGroup>
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
