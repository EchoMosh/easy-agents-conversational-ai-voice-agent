
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TimelineControls } from "./components/timeline-controls";
import { TimelineItemComponent } from "./components/timeline-item";
import { TimelineItem, Note, Activity } from "./types/timeline-types";

interface TimelineTabProps {
  leadId: string;
}

export function TimelineTab({ leadId }: TimelineTabProps) {
  const queryClient = useQueryClient();
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<Set<TimelineItem['type']>>(
    new Set(['note', 'status_change', 'contact_update', 'name_update', 'variable_add'])
  );

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
        type: activity.content.includes('Email updated') ? 'contact_update' :
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

  const filteredActivities = activities?.filter(item => {
    const matchesSearch = item.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ('old_value' in item && item.old_value?.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         ('new_value' in item && item.new_value?.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesType = selectedTypes.has(item.type);
    return matchesSearch && matchesType;
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
      const note = activities?.find(a => a.type === 'note' && a.id === noteId) as Note | undefined;
      if (note) {
        setEditedContent(note.content);
        setEditingNoteId(noteId);
      }
    }
  };

  const toggleType = (type: TimelineItem['type']) => {
    const newTypes = new Set(selectedTypes);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    setSelectedTypes(newTypes);
  };

  return (
    <div className="space-y-4">
      <TimelineControls
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTypes={selectedTypes}
        onToggleType={toggleType}
      />

      <ScrollArea className="h-[calc(100vh-220px)]">
        <div className="space-y-4 pr-4">
          {filteredActivities?.map((item, index) => (
            <TimelineItemComponent
              key={item.id}
              item={item}
              isLast={index === filteredActivities.length - 1}
              editingNoteId={editingNoteId}
              editedContent={editedContent}
              onEditNote={handleEditNote}
              onEditContentChange={setEditedContent}
              onCancelEdit={() => setEditingNoteId(null)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
