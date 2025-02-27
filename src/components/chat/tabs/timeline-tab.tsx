
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, TimelineItem as TimelineItemType } from "./types/timeline-types";
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
      return data as Activity[];
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
      <ScrollArea className="flex-1">
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
