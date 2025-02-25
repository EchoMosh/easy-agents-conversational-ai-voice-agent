
import { Lead } from "@/pages/dashboard/leads";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tag } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { LeadVariables } from "./lead-variables";

interface LeadsTableProps {
  leads: Lead[];
  isLoading: boolean;
  onLeadUpdated: () => void;
}

const statusColors = {
  new: "bg-blue-500",
  contacted: "bg-yellow-500",
  qualified: "bg-green-500",
  converted: "bg-purple-500",
  lost: "bg-red-500",
};

export function LeadsTable({ leads, isLoading, onLeadUpdated }: LeadsTableProps) {
  if (isLoading) {
    return <div className="text-center py-4">Loading leads...</div>;
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        No leads found. Add your first lead to get started.
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Variables</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell>{lead.name}</TableCell>
              <TableCell>{lead.email || "-"}</TableCell>
              <TableCell>{lead.phone || "-"}</TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={`${statusColors[lead.status]} text-white`}
                >
                  {lead.status}
                </Badge>
              </TableCell>
              <TableCell>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Tag className="h-4 w-4 mr-2" />
                      {lead.variables?.length || 0} Variables
                    </Button>
                  </SheetTrigger>
                  <SheetContent>
                    <SheetHeader>
                      <SheetTitle>Lead Variables</SheetTitle>
                    </SheetHeader>
                    <LeadVariables
                      leadId={lead.id}
                      variables={lead.variables || []}
                      onVariablesUpdated={onLeadUpdated}
                    />
                  </SheetContent>
                </Sheet>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
