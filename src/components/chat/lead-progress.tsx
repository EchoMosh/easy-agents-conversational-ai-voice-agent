
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
      <div className="flex items-start gap-1 px-4 py-2">
        {stages.map((stage, index) => (
          <div key={stage.id} className="flex flex-col items-center min-w-[60px] max-w-[60px]">
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
                  className={`w-8 h-0.5 mx-0.5
                    ${index < currentIndex ? 'bg-primary' : 'bg-muted-foreground/20'}`}
                />
              )}
            </div>
            <span 
              className="text-[10px] text-muted-foreground mt-2 text-center origin-top-left transform -rotate-45 translate-x-3 inline-block w-16"
            >
              {stage.label}
            </span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
