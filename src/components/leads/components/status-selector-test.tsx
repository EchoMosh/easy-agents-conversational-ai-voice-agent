import { Button } from "@/components/ui/button";

interface StatusSelectorTestProps {
  stages: string[];
  onSelected: (status: string) => void;
}

export function StatusSelectorTest({
  stages,
  onSelected,
}: StatusSelectorTestProps) {
  return (
    <div className="space-y-2 p-4">
      <h3 className="font-medium mb-2">Select a Status:</h3>
      <div className="space-y-2">
        {stages.map((stage) => (
          <Button
            key={stage}
            variant="outline"
            className="w-full justify-start"
            onClick={() => onSelected(stage)}
          >
            {stage}
          </Button>
        ))}
      </div>
    </div>
  );
}
