
import { Tag } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Tag className="w-8 h-8 mb-3 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">
        No variables added yet
      </p>
      <p className="text-xs text-muted-foreground/80">
        Click "Add Variable" to start adding custom fields to this lead
      </p>
    </div>
  );
}
