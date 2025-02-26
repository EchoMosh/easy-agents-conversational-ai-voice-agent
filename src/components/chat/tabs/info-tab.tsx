
import { Tag, Star, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lead } from "@/pages/dashboard/leads";

interface InfoTabProps {
  lead: Lead;
}

export function InfoTab({ lead }: InfoTabProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Contact Information</h3>
        <div className="space-y-3 bg-muted/50 rounded-lg p-4">
          <p className="text-sm"><span className="font-medium">Name:</span> {lead.name}</p>
          <p className="text-sm"><span className="font-medium">Email:</span> {lead.email || "Not provided"}</p>
          <p className="text-sm"><span className="font-medium">Phone:</span> {lead.phone || "Not provided"}</p>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Lead Variables</h3>
        <div className="flex flex-wrap gap-2">
          {lead.variables?.map((variable) => (
            <Badge key={variable.id} variant="secondary">
              <Tag className="w-3 h-3 mr-1" />
              {variable.name}: {variable.value}
            </Badge>
          ))}
          <Button variant="outline" size="sm" className="h-6">
            <PlusCircle className="w-3 h-3 mr-1" />
            Add Variable
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Tags</h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">
            <Tag className="w-3 h-3 mr-1" />
            New Lead
          </Badge>
          <Badge variant="secondary">
            <Star className="w-3 h-3 mr-1" />
            High Priority
          </Badge>
          <Button variant="outline" size="sm" className="h-6">
            <PlusCircle className="w-3 h-3 mr-1" />
            Add Tag
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground">Lead Score</h3>
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">85/100</span>
            <Badge variant="secondary" className="bg-green-100 text-green-700">High Value</Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
