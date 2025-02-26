
import { Mail, Phone, StickyNote, Clock } from "lucide-react";
import { format } from "date-fns";

interface TimelineItem {
  id: string;
  type: 'email' | 'sms' | 'note';
  content: string;
  timestamp: string;
}

interface TimelineTabProps {
  items: TimelineItem[];
}

export function TimelineTab({ items }: TimelineTabProps) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
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
