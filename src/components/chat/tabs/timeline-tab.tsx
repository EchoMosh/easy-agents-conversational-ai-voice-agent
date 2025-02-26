
import { Mail, Phone, StickyNote, Clock, Pencil, Check, X, UserCog, Tag, User } from "lucide-react";
import { format } from "date-fns";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Note {
  id: string;
  type: 'note';
  content: string;
  timestamp: string;
}

interface Activity {
  id: string;
  type: 'status_change' | 'contact_update' | 'name_update' | 'variable_add';
  content: string;
  timestamp: string;
  old_value: string | null;
  new_value: string | null;
}

type TimelineItem = Note | Activity;

interface TimelineTabProps {
  leadId: string;
}

export function TimelineTab({ leadId }: TimelineTabProps) {
  const queryClient = useQueryClient();
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState("");

  const { data: activities } = useQuery({
    queryKey: ['lead_activities', leadId],
    queryFn: async () => {
      const [notesResponse, activitiesResponse] = await Promise.all([
        supabase
          .from('lead_notes')
          .select('*')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false }),
        supabase
          .from('lead_activities')
          .select('*')
          .eq('lead_id', leadId)
          .order('created_at', { ascending: false })
      ]);

      if (notesResponse.error) throw notesResponse.error;
      if (activitiesResponse.error) throw activitiesResponse.error;

      const notes: Note[] = (notesResponse.data || []).map(note => ({
        id: note.id,
        type: 'note',
        content: note.content,
        timestamp: note.created_at,
      }));

      const activities: Activity[] = (activitiesResponse.data || []).map(activity => ({
        id: activity.id,
        type: activity.content.includes('Email') ? 'contact_update' :
              activity.content.includes('Phone') ? 'contact_update' :
              activity.content.includes('Name') ? 'name_update' :
              activity.content.includes('Status') ? 'status_change' :
              activity.content.includes('variable') ? 'variable_add' :
              'status_change', // fallback
        content: activity.content,
        timestamp: activity.created_at,
        old_value: activity.old_value,
        new_value: activity.new_value,
      }));

      return [...notes, ...activities].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
    },
    enabled: !!leadId,
  });

  const handleEditNote = async (noteId: string) => {
    if (editingNoteId === noteId) {
      try {
        const { error } = await supabase
          .from('lead_notes')
          .update({ content: editedContent })
          .eq('id', noteId);

        if (error) throw error;

        toast.success("Note updated successfully");
        setEditingNoteId(null);
        queryClient.invalidateQueries({ queryKey: ['lead_activities', leadId] });
      } catch (error) {
        toast.error("Failed to update note");
        console.error("Error updating note:", error);
      }
    } else {
      const note = activities?.find(a => a.id === noteId && a.type === 'note') as Note;
      if (note) {
        setEditedContent(note.content);
        setEditingNoteId(noteId);
      }
    }
  };

  const getActivityIcon = (type: TimelineItem['type']) => {
    switch (type) {
      case 'note':
        return <StickyNote className="h-4 w-4" />;
      case 'status_change':
        return <UserCog className="h-4 w-4" />;
      case 'contact_update':
        return <Phone className="h-4 w-4" />;
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

  const renderValue = (value: string | null) => {
    if (value === null) return 'None';
    return value;
  };

  return (
    <div className="space-y-4">
      {activities?.map((item) => (
        <div key={item.id} className="flex items-start gap-3 p-3 border rounded-lg bg-background">
          <div className={`rounded-full p-2 ${getActivityColor(item.type)}`}>
            {getActivityIcon(item.type)}
          </div>
          <div className="flex-1 min-w-0">
            {item.type === 'note' && editingNoteId === item.id ? (
              <div className="space-y-2">
                <Textarea
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className="min-h-[60px]"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleEditNote(item.id)}
                    className="h-7"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setEditingNoteId(null)}
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
                  <p className="text-sm">{item.content}</p>
                  {item.type === 'note' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEditNote(item.id)}
                      className="h-7 px-2"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {item.type !== 'note' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.old_value && <span>From: {renderValue(item.old_value)}</span>}
                    {item.old_value && item.new_value && <span> → </span>}
                    {item.new_value && <span>To: {renderValue(item.new_value)}</span>}
                  </p>
                )}
              </>
            )}
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
