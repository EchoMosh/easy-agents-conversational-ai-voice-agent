
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex-1 flex items-center justify-center h-full">
      <div className="text-center space-y-2">
        <Button variant="ghost" className="size-12 rounded-full mx-auto">
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </Button>
        <p className="text-muted-foreground">
          Select a lead to start messaging
        </p>
      </div>
    </div>
  );
}
