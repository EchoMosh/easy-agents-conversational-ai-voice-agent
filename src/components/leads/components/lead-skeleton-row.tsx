import { Skeleton } from "@/components/ui/skeleton";
import { TableCell, TableRow } from "@/components/ui/table";

export function LeadSkeletonRow() {
  return (
    <TableRow className="animate-in fade-in-0 border-border dark:border-zinc-900">
      <TableCell className="p-0 pl-2">
        <div className="py-3">
          <Skeleton className="h-4 w-4 rounded-sm" />
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <Skeleton className="h-4 w-[120px]" />
          <Skeleton className="h-3 w-[80px]" />
        </div>
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-[180px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-[100px]" />
      </TableCell>
      <TableCell>
        <Skeleton className="h-4 w-[80px]" />
      </TableCell>
      <TableCell className="text-center">
        <div className="flex justify-center">
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex justify-center">
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
      </TableCell>
    </TableRow>
  );
}

export function LeadSkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <LeadSkeletonRow key={i} />
      ))}
    </>
  );
}
