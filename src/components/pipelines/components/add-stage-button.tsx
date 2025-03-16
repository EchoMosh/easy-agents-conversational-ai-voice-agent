
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Plus } from "lucide-react";

interface AddStageButtonProps {
  onAddStage: () => void;
  isLoading?: boolean;
}

export function AddStageButton({ onAddStage, isLoading = false }: AddStageButtonProps) {
  return (
    <Button
      onClick={onAddStage}
      variant="outline"
      disabled={isLoading}
      className="h-auto py-10 px-6 border border-dashed hover:border-primary/50 hover:bg-primary/5 transition-all min-w-40 flex flex-col gap-2 rounded-lg backdrop-blur-sm bg-background/80"
    >
      <div className="h-10 w-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center shadow-sm">
        {isLoading ? (
          <LoadingSpinner className="h-5 w-5" />
        ) : (
          <Plus className="h-5 w-5 text-gray-700 dark:text-gray-300" />
        )}
      </div>
      <span className="font-medium text-gray-600 dark:text-gray-300">
        {isLoading ? "Adding..." : "Add Stage"}
      </span>
    </Button>
  );
}
