
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddStageButtonProps {
  onAddStage: () => void;
}

export function AddStageButton({ onAddStage }: AddStageButtonProps) {
  return (
    <Button
      variant="outline"
      className="h-full min-h-[300px] w-[350px] shrink-0 border-2 border-dashed hover:border-solid"
      onClick={onAddStage}
    >
      <Plus className="w-6 h-6 mr-2" />
      Add Stage
    </Button>
  );
}
