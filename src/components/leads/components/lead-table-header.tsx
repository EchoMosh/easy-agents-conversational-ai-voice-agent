
import { Checkbox } from "@/components/ui/checkbox";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LeadTableHeaderProps } from "../types/lead-types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, Info } from "lucide-react";

export function LeadTableHeader({ 
  onToggleSelectAll, 
  isAllSelected, 
  isDeleting,
  selectAllMode,
  visibleCount,
  totalCount
}: LeadTableHeaderProps) {
  return (
    <TableHeader className="bg-muted/30">
      <TableRow>
        <TableHead className="w-12">
          <div className="flex items-center gap-1">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={onToggleSelectAll}
              disabled={isDeleting}
              className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground rounded-sm"
              aria-label="Select all leads"
            />
            
            {selectAllMode === 'all' && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-primary" />
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="text-xs">
                      {totalCount 
                        ? `All ${totalCount} leads are selected` 
                        : "All matching leads are selected"
                      }
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </TableHead>
        <TableHead className="font-medium">Name</TableHead>
        <TableHead className="font-medium">Email</TableHead>
        <TableHead className="font-medium">Phone</TableHead>
        <TableHead className="font-medium">
          <div className="flex items-center gap-1">
            Status
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs text-xs">Lead status indicates where they are in your sales process</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </TableHead>
        <TableHead className="font-medium">Pipeline</TableHead>
        <TableHead className="font-medium">Actions</TableHead>
      </TableRow>
    </TableHeader>
  );
}
