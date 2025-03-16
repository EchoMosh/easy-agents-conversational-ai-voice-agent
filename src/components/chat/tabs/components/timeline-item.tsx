
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
  Tag,
  User,
  Variable,
  MessageSquare,
  GitBranch,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TimelineItem, Note } from "../types/timeline-types";
import { cn } from "@/lib/utils";

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
        return <Variable className="h-4 w-4" />;
      case 'lead_created':
        return <UserPlus className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: TimelineItem['type']) => {
    switch (type) {
      case 'note':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300 border-purple-200 dark:border-purple-800/30';
      case 'status_change':
        return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800/30';
      case 'contact_update':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800/30';
      case 'name_update':
        return 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-300 border-rose-200 dark:border-rose-800/30';
      case 'variable_add':
        return 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-300 border-teal-200 dark:border-teal-800/30';
      case 'lead_created':
        return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800/30';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const isNote = (item: TimelineItem): item is Note => {
    return item.type === 'note';
  };

  const getTimelineBg = (type: TimelineItem['type']) => {
    switch (type) {
      case 'note':
        return 'bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800/20';
      case 'status_change':
        return 'bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-800/20';
      case 'contact_update':
        return 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/20';
      case 'name_update':
        return 'bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-800/20';
      case 'variable_add':
        return 'bg-teal-50 dark:bg-teal-900/10 border-teal-100 dark:border-teal-800/20';
      case 'lead_created':
        return 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-800/20';
      default:
        return 'bg-muted/50 border-muted';
    }
  };

  return (
    <div className={cn(
      "relative rounded-lg border p-3 transition-all",
      getTimelineBg(item.type)
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex-shrink-0 rounded-full p-2 border",
          getActivityColor(item.type)
        )}>
          {getActivityIcon(item.type, item.content)}
        </div>
        
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium text-foreground leading-tight">
              {isNote(item) ? "Note Added" : item.content}
            </p>
            {isNote(item) && editingNoteId !== item.id && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEditNote(item.id)}
                className="h-7 w-7 p-0 rounded-full flex items-center justify-center hover:bg-purple-100 hover:text-purple-600 dark:hover:bg-purple-900/20"
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          
          {isNote(item) && editingNoteId !== item.id && (
            <p className="text-sm text-muted-foreground">
              {item.content}
            </p>
          )}
          
          {isNote(item) && editingNoteId === item.id && (
            <div className="space-y-2 mt-1">
              <Textarea
                value={editedContent}
                onChange={(e) => onEditContentChange(e.target.value)}
                className="min-h-[60px] bg-background border-muted"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => onEditNote(item.id)}
                  className="h-8 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Check className="h-3.5 w-3.5 mr-1" />
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCancelEdit}
                  className="h-8"
                >
                  <X className="h-3.5 w-3.5 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          )}
          
          {!isNote(item) && item.old_value && item.new_value && (
            <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground mt-1 bg-background/80 rounded-md py-1 px-2">
              <span className="line-through">{item.old_value}</span>
              <span>→</span>
              <span className="font-medium text-foreground">{item.new_value}</span>
            </div>
          )}
          
          <div className="flex items-center gap-1 mt-0.5">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <time className="text-xs text-muted-foreground">
              {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
            </time>
          </div>
        </div>
      </div>
    </div>
  );
}
