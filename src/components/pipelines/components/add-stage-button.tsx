
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface AddStageButtonProps {
  onAddStage: () => void;
}

export function AddStageButton({ onAddStage }: AddStageButtonProps) {
  return (
    <Button
      onClick={onAddStage}
      variant="outline"
      className="h-auto py-10 px-6 border-dashed border-2 hover:border-primary/50 hover:bg-primary/5 transition-all min-w-40 flex flex-col gap-2"
    >
      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
        <Plus className="h-5 w-5 text-primary" />
      </div>
      <span>Add Stage</span>
    </Button>
  );
}
