import { Checkbox } from "@/components/ui/checkbox";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LeadTableHeaderProps } from "../types/lead-types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { HelpCircle, Info } from "lucide-react";

export function LeadTableHeader({
  onToggleSelectAll,
  isAllSelected,
  isDeleting,
  selectAllMode,
  visibleCount,
  totalCount,
  onSelectAllMatching,
}: LeadTableHeaderProps) {
  return (
    <TableRow className="border-b">
      <TableHead className="w-[180px] p-0 pl-2 bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={onToggleSelectAll}
              disabled={isDeleting}
              className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground rounded-sm"
              aria-label="Select all visible leads"
            />
            <span className="text-xs text-muted-foreground">Visible</span>
          </div>

          {isAllSelected && onSelectAllMatching && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onSelectAllMatching}
                    className="h-6 text-xs px-2"
                  >
                    Select All Matching
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-[200px]">
                  <p className="text-xs">
                    Select all {totalCount} leads matching your current filters
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {selectAllMode === "all" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-primary ml-1" />
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p className="text-xs">
                    {totalCount
                      ? `All ${totalCount} leads are selected`
                      : "All matching leads are selected"}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </TableHead>
      <TableHead className="font-medium bg-muted/30 py-3 w-[250px]">
        Name
      </TableHead>
      <TableHead className="font-medium bg-muted/30 py-3 w-[250px]">
        Email
      </TableHead>
      <TableHead className="font-medium bg-muted/30 py-3 w-[150px]">
        Phone
      </TableHead>
      <TableHead className="font-medium bg-muted/30 py-3 w-[150px]">
        Source
      </TableHead>
      <TableHead className="font-medium text-center bg-muted/30 py-3 w-[100px]">
        Variables
      </TableHead>
      <TableHead className="font-medium text-center bg-muted/30 py-3 w-[60px]">
        Edit
      </TableHead>
    </TableRow>
  );
}
