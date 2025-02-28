
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
          <Skeleton className="h-12 w-12 rounded" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      ))}
    </div>
  );
}
