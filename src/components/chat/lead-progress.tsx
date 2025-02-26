
import { Check } from "lucide-react";

const stages = [
  { id: 'new', label: 'New Lead' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'qualified', label: 'Qualified' },
  { id: 'proposal', label: 'Proposal' },
  { id: 'closed', label: 'Closed' }
];

interface LeadProgressProps {
  currentStage: string;
}

export function LeadProgress({ currentStage }: LeadProgressProps) {
  const currentIndex = stages.findIndex(stage => stage.id === currentStage) || 0;

  return (
    <div className="flex items-center gap-2">
      {stages.map((stage, index) => (
        <div key={stage.id} className="flex items-center">
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
      ))}
    </div>
  );
}
