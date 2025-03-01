
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PlusIcon, X } from 'lucide-react';
import { NodeAction } from '@/types/agent-types';
import { ActionConfig } from '../actions/action-config';

interface ActionsSectionProps {
  actions: NodeAction[];
  showActions: boolean;
  setShowActions: (show: boolean) => void;
  addAction: () => void;
  updateAction: (id: string, config: any) => void;
  deleteAction: (id: string) => void;
}

export function ActionsSection({ 
  actions, 
  showActions, 
  setShowActions, 
  addAction, 
  updateAction, 
  deleteAction 
}: ActionsSectionProps) {
  return (
    <Collapsible open={showActions} onOpenChange={setShowActions}>
      <CollapsibleTrigger className="w-full text-left rounded-md border border-gray-300 dark:border-gray-600 shadow-sm p-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 dark:focus:ring-offset-gray-800 dark:bg-gray-700 dark:text-gray-200">
        <div className="flex items-center justify-between">
          <span>Actions</span>
          {showActions ? <X className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2 space-y-2">
        {actions.map((action) => (
          <ActionConfig
            key={action.id}
            action={action}
            onChange={(updatedAction) => updateAction(updatedAction.id, updatedAction.config)}
            onDelete={deleteAction}
          />
        ))}
        <Button variant="outline" size="sm" className="w-full justify-center" onClick={addAction}>
          Add Action
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
}
