
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Lead } from "@/pages/dashboard/leads";
import { 
  DndContext, 
  DragEndEvent, 
  MouseSensor, 
  TouchSensor, 
  useSensor, 
  useSensors,
  useDroppable 
} from "@dnd-kit/core";
import { LeadCard } from "@/components/leads/lead-card";
import { useToast } from "@/components/ui/use-toast";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const statusColumns = [
  { id: "new", title: "New", color: "bg-blue-500" },
  { id: "contacted", title: "Contacted", color: "bg-yellow-500" },
  { id: "qualified", title: "Qualified", color: "bg-green-500" },
  { id: "converted", title: "Converted", color: "bg-purple-500" },
  { id: "lost", title: "Lost", color: "bg-red-500" },
];

function DroppableColumn({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id });
  return <div ref={setNodeRef}>{children}</div>;
}

export default function PipelinesPage() {
  const { toast } = useToast();
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
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

    const leadId = String(active.id);
    const newStatus = over.id as Lead["status"];

    // Don't update if dropping in the same column
    const lead = leads.find(l => l.id === leadId);
    if (lead?.status === newStatus) return;

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
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Pipeline</h1>
        <p className="text-muted-foreground mt-2">
          Manage and track your leads through different stages of your sales process.
        </p>
      </div>

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 auto-rows-fr">
          {statusColumns.map((column) => {
            const columnLeads = leads.filter((lead) => lead.status === column.id);
            
            return (
              <DroppableColumn key={column.id} id={column.id}>
                <Card className="bg-muted/50 flex flex-col">
                  <CardHeader className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${column.color}`} />
                      <CardTitle className="text-lg font-semibold">
                        {column.title}
                      </CardTitle>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {columnLeads.length} lead{columnLeads.length !== 1 ? 's' : ''}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 flex-1 min-h-[200px] p-4">
                    {columnLeads.map((lead) => (
                      <LeadCard 
                        key={lead.id} 
                        lead={lead}
                        onClick={() => setSelectedLead(lead)} 
                      />
                    ))}
                    {columnLeads.length === 0 && (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-sm text-muted-foreground text-center">
                          No leads in this stage
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </DroppableColumn>
            );
          })}
        </div>
      </DndContext>

      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Lead Details</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h3 className="font-medium">Contact Information</h3>
                <div className="text-sm space-y-2">
                  <p><span className="text-muted-foreground">Name:</span> {selectedLead.name}</p>
                  {selectedLead.email && <p><span className="text-muted-foreground">Email:</span> {selectedLead.email}</p>}
                  {selectedLead.phone && <p><span className="text-muted-foreground">Phone:</span> {selectedLead.phone}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="font-medium">Status</h3>
                <Badge variant="secondary" className={`${statusColumns.find(s => s.id === selectedLead.status)?.color} text-white`}>
                  {selectedLead.status}
                </Badge>
              </div>

              {selectedLead.variables && selectedLead.variables.length > 0 && (
                <div className="space-y-1">
                  <h3 className="font-medium">Variables</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {selectedLead.variables.map((variable, index) => (
                      <div key={index} className="space-y-1">
                        <p className="text-muted-foreground">{variable.name}</p>
                        <p>{variable.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <h3 className="font-medium">Created</h3>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(selectedLead.created_at), 'PPP')}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
