
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, TimelineItem as TimelineItemType, Note } from "./types/timeline-types";
import { TimelineItemComponent } from "./components/timeline-item";
import { TimelineControls } from "./components/timeline-controls";

interface TimelineTabProps {
  leadId: string;
}

export function TimelineTab({ leadId }: TimelineTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<Set<TimelineItemType["type"]>>(
    new Set(["note", "status_change", "contact_update", "name_update", "variable_add", "lead_created"])
  );

  const { data: activities } = useQuery({
    queryKey: ['lead_activities', leadId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('lead_activities')
        .select('*')
        .eq('lead_id', leadId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      // Map the database records to our Activity type
      return (data || []).map(activity => {
        let activityType: Activity['type'];

        // Determine the activity type based on the content
        if (activity.content.toLowerCase().includes('status')) {
          activityType = 'status_change';
        } else if (activity.content.toLowerCase().includes('email') || 
                  activity.content.toLowerCase().includes('phone')) {
          activityType = 'contact_update';
        } else if (activity.content.toLowerCase().includes('name')) {
          activityType = 'name_update';
        } else if (activity.content.toLowerCase().includes('variable')) {
          activityType = 'variable_add';
        } else if (activity.content.toLowerCase().includes('created')) {
          activityType = 'lead_created';
        } else {
          activityType = 'status_change'; // Default type
        }

        return {
          ...activity,
          type: activityType
        } as Activity;
      });
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
      
      // Map the database records to our Note type
      return (data || []).map(note => ({
        ...note,
        type: 'note' as const
      })) as Note[];
    }
  });

  const allItems = [
    ...(activities || []),
    ...(notes || [])
  ].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const handleToggleType = (type: TimelineItemType["type"]) => {
    const newTypes = new Set(selectedTypes);
    if (newTypes.has(type)) {
      newTypes.delete(type);
    } else {
      newTypes.add(type);
    }
    setSelectedTypes(newTypes);
  };

  const filteredItems = allItems.filter((item) => {
    if (!selectedTypes.has(item.type)) return false;
    if (!searchQuery) return true;
    return item.content.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full">
      <TimelineControls 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTypes={selectedTypes}
        onToggleType={handleToggleType}
      />
      <ScrollArea className="flex-1 overflow-auto max-h-[500px]">
        <div className="space-y-4 p-4">
          {filteredItems.map((item, index) => (
            <TimelineItemComponent 
              key={`${item.type}-${item.id}`} 
              item={item}
              isLast={index === filteredItems.length - 1}
              editingNoteId={null}
              editedContent=""
              onEditNote={() => {}}
              onEditContentChange={() => {}}
              onCancelEdit={() => {}}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
