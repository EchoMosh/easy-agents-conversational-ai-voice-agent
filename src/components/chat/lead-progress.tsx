import { Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface Stage {
  id: string;
  label: string;
}

interface LeadProgressProps {
  currentStage: string;
  stages: Stage[];
  vertical?: boolean;
  showLabels?: boolean;
}

export function LeadProgress({ 
  currentStage, 
  stages, 
  vertical = false,
  showLabels = true 
}: LeadProgressProps) {
  const currentIndex = stages.findIndex(stage => stage.label.toLowerCase() === currentStage.toLowerCase());

  if (vertical) {
    return (
      <div className="flex flex-col items-start gap-1">
        {stages.map((stage, index) => (
          <div key={stage.id} className="flex items-center w-full mb-4">
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors duration-200 shrink-0",
                index < currentIndex 
                  ? 'bg-primary text-primary-foreground' // Completed stages
                  : index === currentIndex
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2' // Current stage
                  : 'bg-muted border-2 border-muted-foreground/20' // Future stages
              )}
            >
              {index < currentIndex ? (
                <Check className="h-3 w-3" />
              ) : (
                index + 1
              )}
            </div>
            
            {showLabels && (
              <div className="ml-3 flex-1">
                <span className="text-sm">{stage.label}</span>
                {index === currentIndex && (
                  <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                    Current
                  </span>
                )}
              </div>
            )}
            
            {index < stages.length - 1 && (
              <div 
                className={cn(
                  "w-0.5 h-8 ml-3 my-0.5 transition-colors duration-200 absolute translate-y-7",
                  index < currentIndex ? 'bg-primary' : 'bg-muted-foreground/20'
                )}
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <ScrollArea className="max-w-[500px]" type="scroll">
      <div className="flex items-start gap-1 px-4 py-2">
        {stages.map((stage, index) => (
          <div key={stage.id} className="flex flex-col items-center min-w-[60px] max-w-[60px]">
            <div className="flex items-center">
              <div
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-xs transition-colors duration-200",
                  index < currentIndex 
                    ? 'bg-primary text-primary-foreground' // Completed stages
                    : index === currentIndex
                    ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2' // Current stage (including first stage)
                    : 'bg-muted border-2 border-muted-foreground/20' // Future stages
                )}
              >
                {index < currentIndex ? (
                  <Check className="h-3 w-3" />
                ) : (
                  index + 1
                )}
              </div>
              {index < stages.length - 1 && (
                <div 
                  className={cn(
                    "w-8 h-0.5 mx-0.5 transition-colors duration-200",
                    index < currentIndex ? 'bg-primary' : 'bg-muted-foreground/20'
                  )}
                />
              )}
            </div>
            {showLabels && (
              <span 
                className="text-[10px] text-muted-foreground mt-2 text-center origin-top transform -rotate-45 translate-y-1 inline-block w-16"
              >
                {stage.label}
              </span>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
