
import { Mail, Phone } from "lucide-react";

interface Activity {
  id: string;
  type: 'email' | 'sms';
  content: string;
  timestamp: string;
}

interface ActivityTabProps {
  activities: Activity[];
}

export function ActivityTab({ activities }: ActivityTabProps) {
  return (
    <div className="space-y-4">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg bg-background">
          <div className={`rounded-full p-2 ${
            activity.type === 'email' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
          }`}>
            {activity.type === 'email' ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm">{activity.content}</p>
            <time className="text-xs text-muted-foreground">
              {new Date(activity.timestamp).toLocaleString()}
            </time>
          </div>
        </div>
      ))}
    </div>
  );
}
