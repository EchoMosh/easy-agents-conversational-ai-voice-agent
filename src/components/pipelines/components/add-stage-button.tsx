import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface AddStageButtonProps {
  onAddStage: () => void;
  isLoading?: boolean;
}

export function AddStageButton({
  onAddStage,
  isLoading = false,
}: AddStageButtonProps) {
  return (
    <Button
      onClick={onAddStage}
      variant="outline"
      className="flex items-center gap-2 border-dashed"
      disabled={isLoading}
    >
      {isLoading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
      <span>Add Stage</span>
    </Button>
  );
}
