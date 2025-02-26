
import { format } from "date-fns";
import { 
  Mail, 
  Phone, 
  StickyNote, 
  Clock, 
  Pencil, 
  Check, 
  X, 
  UserPlus,
  Tags,
  User,
  ArrowRightLeft,
  MessageSquare,
  Binary,
  GitBranch
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { TimelineItem, Note } from "../types/timeline-types";

interface TimelineItemProps {
  item: TimelineItem;
  isLast: boolean;
  editingNoteId: string | null;
  editedContent: string;
  onEditNote: (noteId: string) => void;
  onEditContentChange: (content: string) => void;
  onCancelEdit: () => void;
}

export function TimelineItemComponent({
  item,
  isLast,
  editingNoteId,
  editedContent,
  onEditNote,
  onEditContentChange,
  onCancelEdit,
}: TimelineItemProps) {
  const getActivityIcon = (type: TimelineItem['type'], content: string) => {
    switch (type) {
      case 'note':
        return <StickyNote className="h-4 w-4" />;
      case 'status_change':
        return <GitBranch className="h-4 w-4" />;
      case 'contact_update':
        if (content.toLowerCase().includes('email')) {
          return <Mail className="h-4 w-4" />;
        } else if (content.toLowerCase().includes('phone')) {
          return <Phone className="h-4 w-4" />;
        }
        return <MessageSquare className="h-4 w-4" />;
      case 'name_update':
        return <User className="h-4 w-4" />;
      case 'variable_add':
        return <Binary className="h-4 w-4" />;
      case 'lead_created':
        return <UserPlus className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: TimelineItem['type']) => {
    switch (type) {
      case 'note':
        return 'bg-purple-100 text-purple-600';
      case 'status_change':
        return 'bg-amber-100 text-amber-600';
      case 'contact_update':
        return 'bg-blue-100 text-blue-600';
      case 'name_update':
        return 'bg-rose-100 text-rose-600';
      case 'variable_add':
        return 'bg-teal-100 text-teal-600';
      case 'lead_created':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const isNote = (item: TimelineItem): item is Note => {
    return item.type === 'note';
  };

  return (
    <div className="relative px-4 py-2">
      <div className="flex items-start gap-3">
        <div className="relative z-10">
          <div className={`rounded-full p-2 ${getActivityColor(item.type)}`}>
            {getActivityIcon(item.type, item.content)}
          </div>
          {!isLast && (
            <Separator orientation="vertical" className="absolute h-full top-8 left-1/2 -translate-x-1/2 bg-gray-200" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="py-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900">
                {isNote(item) ? "Note Added" : item.content}
              </p>
              {isNote(item) && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEditNote(item.id)}
                  className="h-7 px-2 hover:bg-gray-100"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            {isNote(item) && !editingNoteId && (
              <p className="text-sm text-gray-600 mt-1">
                {item.content}
              </p>
            )}
            {isNote(item) && editingNoteId === item.id && (
              <div className="space-y-2 mt-2">
                <Textarea
                  value={editedContent}
                  onChange={(e) => onEditContentChange(e.target.value)}
                  className="min-h-[60px] bg-gray-50 border-gray-200"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onEditNote(item.id)}
                    className="h-7 bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onCancelEdit}
                    className="h-7"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            {!isNote(item) && (
              <p className="text-xs text-gray-500 mt-1">
                {item.old_value && <span>From: {item.old_value}</span>}
                {item.old_value && item.new_value && <span> → </span>}
                {item.new_value && <span>To: {item.new_value}</span>}
              </p>
            )}
            <div className="flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3 text-gray-400" />
              <time className="text-xs text-gray-400">
                {format(new Date(item.timestamp), 'MMM d, yyyy h:mm a')}
              </time>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
