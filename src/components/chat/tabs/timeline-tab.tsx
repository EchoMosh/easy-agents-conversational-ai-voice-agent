
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LeadActivity } from "./types/timeline-types";
import { TimelineItem } from "./components/timeline-item";
import { TimelineControls } from "./components/timeline-controls";

interface TimelineTabProps {
  leadId: string;
}

export function TimelineTab({ leadId }: TimelineTabProps) {
  const { data: activities } = useQuery({
    queryKey: ['lead_activities', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as LeadActivity[];
    }
  });

  const { data: notes } = useQuery({
    queryKey: ['lead_notes', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_notes')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const allItems = [
    ...(activities || []).map(activity => ({
      ...activity,
      type: 'activity' as const
    })),
    ...(notes || []).map(note => ({
      ...note,
      type: 'note' as const
    }))
  ].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="flex flex-col h-full">
      <TimelineControls />
      <ScrollArea className="flex-1">
        <div className="space-y-4 p-4">
          {allItems.map((item) => (
            <TimelineItem 
              key={`${item.type}-${item.id}`} 
              item={item}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
