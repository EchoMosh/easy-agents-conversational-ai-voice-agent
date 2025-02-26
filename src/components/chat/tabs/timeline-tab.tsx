
import { Mail, Phone, StickyNote, Clock } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TimelineItem {
  id: string;
  type: 'email' | 'sms' | 'note';
  content: string;
  timestamp: string;
}

interface TimelineTabProps {
  leadId: string;
}

export function TimelineTab({ leadId }: TimelineTabProps) {
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
    },
    enabled: !!leadId,
  });

  // Convert notes to timeline items
  const timelineItems: TimelineItem[] = [
    ...(notes?.map(note => ({
      id: note.id,
      type: 'note' as const,
      content: note.content,
      timestamp: note.created_at
    })) || []),
  ];

  return (
    <div className="space-y-4">
      {timelineItems.map((item) => (
        <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg bg-background">
          <div className={`rounded-full p-2 ${
            item.type === 'email' 
              ? 'bg-blue-100 text-blue-600' 
              : item.type === 'sms'
              ? 'bg-green-100 text-green-600'
              : 'bg-purple-100 text-purple-600'
          }`}>
            {item.type === 'email' ? (
              <Mail className="h-4 w-4" />
            ) : item.type === 'sms' ? (
              <Phone className="h-4 w-4" />
            ) : (
              <StickyNote className="h-4 w-4" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm">{item.content}</p>
            <div className="flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <time className="text-xs text-muted-foreground">
                {format(new Date(item.timestamp), 'MMM d, yyyy h:mm a')}
              </time>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
