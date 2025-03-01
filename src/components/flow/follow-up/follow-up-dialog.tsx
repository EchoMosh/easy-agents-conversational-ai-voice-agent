
import { ReactFlowProvider } from '@xyflow/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FollowUpFlow } from './follow-up-flow';
import { Check } from 'lucide-react';

interface FollowUpDialogProps {
  agentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FollowUpDialog({ agentId, open, onOpenChange }: FollowUpDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] md:max-w-[800px] lg:max-w-[1000px] p-0 flex flex-col h-[750px] max-h-[85vh] overflow-hidden bg-background">
        <DialogHeader className="p-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-left">Follow-up Automation</DialogTitle>
              <DialogDescription className="text-left">
                Configure actions that happen after conversation outcomes
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden p-0 bg-white dark:bg-gray-900/90">
          <ReactFlowProvider>
            <FollowUpFlow agentId={agentId} />
          </ReactFlowProvider>
        </div>

        <DialogFooter className="p-4 border-t bg-white dark:bg-gray-950">
          <div className="flex justify-end">
            <Button onClick={() => onOpenChange(false)} className="text-sm">
              <Check className="h-4 w-4 mr-1" />
              Done
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
