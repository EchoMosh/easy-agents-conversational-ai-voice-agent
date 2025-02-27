
import { Button } from "@/components/ui/button";
import { Lead } from "@/pages/dashboard/leads";
import { Pencil, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Pipeline } from "@/types/pipeline";

interface InfoTabProps {
  lead: Lead;
}

export function InfoTab({ lead }: InfoTabProps) {
  const { data: pipeline } = useQuery({
    queryKey: ['pipeline', lead.pipeline_id],
    queryFn: async () => {
      if (!lead.pipeline_id) return null;
      const { data, error } = await supabase
        .from('pipelines')
        .select('*')
        .eq('id', lead.pipeline_id)
        .single();

      if (error) throw error;
      return data as Pipeline;
    },
    enabled: !!lead.pipeline_id
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">Contact Information</h3>
          <Button size="sm" variant="ghost" className="h-8 px-2">
            <Pencil className="h-4 w-4" />
            <span className="ml-2">Edit</span>
          </Button>
        </div>
        <div className="bg-card rounded-lg border shadow-sm">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-foreground">{lead.name[0].toUpperCase()}</span>
              </div>
              <div>
                <p className="font-medium text-foreground">{lead.name}</p>
                <p className="text-sm text-muted-foreground">
                  {lead.email || "Not provided"}
                </p>
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Email:</span>{" "}
                {lead.email || "Not provided"}
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Phone:</span>{" "}
                {lead.phone || "Not provided"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">Pipeline</h3>
        </div>
        <div className="bg-card rounded-lg border shadow-sm">
          <div className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Pipeline:</span>{" "}
                {pipeline?.name || "Not assigned"}
              </p>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Stage:</span>{" "}
                {lead.status || "Not set"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">Tags</h3>
          <Button size="sm" variant="ghost" className="h-8 px-2">
            <Plus className="h-4 w-4" />
            <span className="ml-2">Add Tag</span>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {lead.tags?.length ? (
            lead.tags.map((tag) => (
              <div
                key={tag.id}
                className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-primary text-primary-foreground"
              >
                {tag.name}
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No tags added yet</p>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">Lead Variables</h3>
          <Button size="sm" variant="ghost" className="h-8 px-2">
            <Plus className="h-4 w-4" />
            <span className="ml-2">Add Variable</span>
          </Button>
        </div>
        <div className="space-y-2">
          {lead.variables?.length ? (
            lead.variables.map((variable) => (
              <div
                key={variable.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{variable.name}</p>
                  <p className="text-sm text-muted-foreground">{variable.value}</p>
                </div>
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No variables added yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
