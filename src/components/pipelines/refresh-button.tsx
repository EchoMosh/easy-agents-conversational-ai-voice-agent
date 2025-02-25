
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface RefreshButtonProps {
  isRefreshing: boolean;
  onRefresh: () => void;
}

export function RefreshButton({ isRefreshing, onRefresh }: RefreshButtonProps) {
  return (
    <Button
      variant="outline"
      size="icon"
      onClick={onRefresh}
      disabled={isRefreshing}
      className="w-8 h-8"
    >
      <Loader2 className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
    </Button>
  );
}
