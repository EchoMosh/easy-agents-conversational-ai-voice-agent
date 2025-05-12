import {
  TableHeader,
  Table,
  TableBody,
  TableHead,
  TableRow,
} from "@/components/ui/table";
import { LeadTableHeader } from "./lead-table-header";
import { LeadSkeletonRows } from "./lead-skeleton-row";

export function LoadingLeadsTable() {
  return (
    <div className="border rounded-lg w-full flex flex-col h-full">
      <div className="w-full">
        <Table className="w-full border">
          <TableHeader className="sticky top-0 z-20 bg-background shadow-sm">
            <LeadTableHeader
              onToggleSelectAll={() => {}}
              isAllSelected={false}
              isDeleting={false}
              selectAllMode="visible"
              visibleCount={0}
              totalCount={0}
            />
          </TableHeader>

          <TableBody>
            {/* Display 6 skeleton rows during initial loading */}
            <LeadSkeletonRows count={6} />
          </TableBody>
        </Table>
      </div>

      <div className="border-t bg-background py-2 px-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">Loading leads...</div>
          <div className="text-xs text-muted-foreground">
            Getting your leads ready
          </div>
        </div>
      </div>
    </div>
  );
}
