
import { format } from "date-fns";
import { Mail, Phone, StickyNote, Clock, Pencil, Check, X, UserCog, Tag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { TimelineItem } from "../types/timeline-types";

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
        return <UserCog className="h-4 w-4" />;
      case 'contact_update':
        return content.includes('Email') ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />;
      case 'name_update':
        return <User className="h-4 w-4" />;
      case 'variable_add':
        return <Tag className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: TimelineItem['type']) => {
    switch (type) {
      case 'note':
        return 'bg-purple-100 text-purple-600';
      case 'status_change':
        return 'bg-amber-100 text-amber-600';
      case 'contact_update':
        return 'bg-indigo-100 text-indigo-600';
      case 'name_update':
        return 'bg-rose-100 text-rose-600';
      case 'variable_add':
        return 'bg-teal-100 text-teal-600';
    }
  };

  return (
    <div className="relative">
      <div className="flex items-start gap-3">
        <div className="relative z-10">
          <div className={`rounded-full p-2 ${getActivityColor(item.type)} bg-background`}>
            {getActivityIcon(item.type, item.type === 'note' ? 'Note Added' : item.content)}
          </div>
          {!isLast && (
            <Separator orientation="vertical" className="absolute h-full top-8 left-1/2 -translate-x-1/2" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="p-3 border rounded-lg bg-background">
            {item.type === 'note' && editingNoteId === item.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editedContent}
                  onChange={(e) => onEditContentChange(e.target.value)}
                  className="min-h-[60px]"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onEditNote(item.id)}
                    className="h-7"
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
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">
                    {item.type === 'note' ? "Note Added" : item.content}
                  </p>
                  {item.type === 'note' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEditNote(item.id)}
                      className="h-7 px-2"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {item.type === 'note' && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                    {item.content}
                  </p>
                )}
                {'old_value' in item && item.type !== 'note' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.old_value && <span>From: {item.old_value}</span>}
                    {item.old_value && item.new_value && <span> → </span>}
                    {item.new_value && <span>To: {item.new_value}</span>}
                  </p>
                )}
                <div className="flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <time className="text-xs text-muted-foreground">
                    {format(new Date(item.timestamp), 'MMM d, yyyy h:mm a')}
                  </time>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
