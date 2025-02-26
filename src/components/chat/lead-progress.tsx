
import { Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Stage {
  id: string;
  label: string;
}

interface LeadProgressProps {
  currentStage: string;
  stages: Stage[];
}

export function LeadProgress({ currentStage, stages }: LeadProgressProps) {
  const currentIndex = stages.findIndex(stage => stage.label.toLowerCase() === currentStage.toLowerCase()) || 0;

  return (
    <ScrollArea className="max-w-[500px]" type="scroll">
      <div className="flex items-center gap-2 px-4">
        {stages.map((stage, index) => (
          <div key={stage.id} className="flex flex-col items-center min-w-fit">
            <div className="flex items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs 
                  ${index <= currentIndex 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted border-2 border-muted-foreground/20'
                  }`}
              >
                {index <= currentIndex ? (
                  <Check className="h-3 w-3" />
                ) : (
                  index + 1
                )}
              </div>
              {index < stages.length - 1 && (
                <div 
                  className={`w-12 h-0.5 mx-1 
                    ${index < currentIndex ? 'bg-primary' : 'bg-muted-foreground/20'}`}
                />
              )}
            </div>
            <span className="text-xs text-muted-foreground mt-1 whitespace-nowrap">
              {stage.label}
            </span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
