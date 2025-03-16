
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, TimelineItem as TimelineItemType, Note } from "./types/timeline-types";
import { TimelineItemComponent } from "./components/timeline-item";
import { TimelineControls } from "./components/timeline-controls";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { History } from "lucide-react";

interface TimelineTabProps {
  leadId: string;
}

export function TimelineTab({ leadId }: TimelineTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<Set<TimelineItemType["type"]>>(
    new Set(["note", "status_change", "contact_update", "name_update", "variable_add", "lead_created"])
  );

  const { data: activities, isLoading: activitiesLoading } = useQuery({
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

  const { data: notes, isLoading: notesLoading } = useQuery({
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

  const isLoading = activitiesLoading || notesLoading;

  return (
    <div className="flex flex-col h-full bg-background">
      <TimelineControls 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedTypes={selectedTypes}
        onToggleType={handleToggleType}
      />
      
      <ScrollArea className="flex-1 px-2 py-2">
        {isLoading ? (
          <div className="flex items-center justify-center h-full py-8">
            <div className="flex flex-col items-center">
              <div className="animate-pulse w-10 h-10 bg-purple-200 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-2">
                <History className="h-5 w-5 text-purple-600 dark:text-purple-400 opacity-70" />
              </div>
              <p className="text-sm text-muted-foreground">Loading activities...</p>
            </div>
          </div>
        ) : filteredItems.length > 0 ? (
          <div className="space-y-3 pt-1 pb-3">
            {filteredItems.map((item, index) => (
              <motion.div
                key={`${item.type}-${item.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <TimelineItemComponent 
                  item={item}
                  isLast={index === filteredItems.length - 1}
                  editingNoteId={null}
                  editedContent=""
                  onEditNote={() => {}}
                  onEditContentChange={() => {}}
                  onCancelEdit={() => {}}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center py-10">
            <Card className="w-full max-w-md p-6 bg-muted/30 border-dashed border-muted-foreground/20 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center mb-3 border border-muted">
                <History className="h-6 w-6 text-muted-foreground/70" />
              </div>
              <h3 className="text-base font-medium text-foreground mb-1">No activities found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery 
                  ? "No matching activities found with your search criteria" 
                  : "There are no activities to display for this lead yet"}
              </p>
            </Card>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
