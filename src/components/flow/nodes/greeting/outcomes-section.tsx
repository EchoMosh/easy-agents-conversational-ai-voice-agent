
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { OutcomeListItem } from './outcome-list-item';

interface OutcomesSectionProps {
  outcomes: string[];
  onEditOutcome: (index: number) => void;
  onDeleteOutcome: (index: number) => void;
  onAddOutcome: () => void;
}

export function OutcomesSection({ 
  outcomes, 
  onEditOutcome, 
  onDeleteOutcome, 
  onAddOutcome 
}: OutcomesSectionProps) {
  // Only render if there are outcomes or the add button
  return (
    <div className="mt-4">
      <Label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Outcomes</Label>
      {outcomes.length > 0 && (
        <ul className="mt-2 space-y-2">
          {outcomes.map((outcome, index) => (
            <OutcomeListItem
              key={index}
              index={index}
              outcome={outcome}
              onEdit={onEditOutcome}
              onRemove={onDeleteOutcome}
            />
          ))}
        </ul>
      )}
      <Button variant="outline" size="sm" className="w-full justify-center mt-2" onClick={onAddOutcome}>
        Add Outcome
      </Button>
    </div>
  );
}
