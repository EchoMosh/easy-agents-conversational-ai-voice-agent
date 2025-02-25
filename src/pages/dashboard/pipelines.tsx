
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "@/pages/dashboard/leads";
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { LeadCard } from "@/components/leads/lead-card";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const statusColumns = [
  { id: "new", title: "New", color: "bg-blue-500" },
  { id: "contacted", title: "Contacted", color: "bg-yellow-500" },
  { id: "qualified", title: "Qualified", color: "bg-green-500" },
  { id: "converted", title: "Converted", color: "bg-purple-500" },
  { id: "lost", title: "Lost", color: "bg-red-500" },
];

export default function PipelinesPage() {
  const { toast } = useToast();
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const { data: leads = [], refetch } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Lead[];
    },
  });

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const leadId = active.id;
    const newStatus = over.id as Lead["status"];

    try {
      const { error } = await supabase
        .from("leads")
        .update({ status: newStatus })
        .eq("id", leadId);

      if (error) throw error;

      toast({
        title: "Lead status updated",
        description: `Lead moved to ${newStatus}`,
      });

      refetch();
    } catch (error) {
      console.error("Error updating lead status:", error);
      toast({
        title: "Error",
        description: "Failed to update lead status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container py-6">
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-5 gap-4">
          {statusColumns.map((column) => {
            const columnLeads = leads.filter((lead) => lead.status === column.id);
            
            return (
              <Card key={column.id} id={column.id} className="bg-muted/50">
                <CardHeader className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${column.color}`} />
                    <CardTitle className="text-base font-medium">
                      {column.title}
                    </CardTitle>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {columnLeads.length} leads
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {columnLeads.map((lead) => (
                    <LeadCard key={lead.id} lead={lead} />
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}
