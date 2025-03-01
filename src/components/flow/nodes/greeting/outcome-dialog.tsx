
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';

interface OutcomeDialogProps {
  showDialog: boolean;
  setShowDialog: (show: boolean) => void;
  newOutcome: string;
  setNewOutcome: (value: string) => void;
  isEditing: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export function OutcomeDialog({ 
  showDialog, 
  setShowDialog, 
  newOutcome, 
  setNewOutcome, 
  isEditing, 
  onSave, 
  onCancel 
}: OutcomeDialogProps) {
  return (
    <Dialog open={showDialog} onOpenChange={setShowDialog}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Outcome' : 'Add New Outcome'}</DialogTitle>
          <DialogDescription>
            Create outcomes that represent user responses to your message. These become branching paths in your conversation flow.
            <span className="block mt-1">The AI is smart enough to recognize similar responses, so you don't need to create multiple outcomes for the same intent.</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-4">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Be specific and descriptive</h4>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-lg">
                  <p className="font-semibold text-red-600 dark:text-red-400 mb-1">⛔ Poor examples:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                    <li>"Yes"</li>
                    <li>"No"</li>
                    <li>"Maybe"</li>
                    <li>"I agree"</li>
                  </ul>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded-lg">
                  <p className="font-semibold text-green-600 dark:text-green-400 mb-1">✅ Good examples:</p>
                  <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                    <li>"I'm interested in learning more about your pricing"</li>
                    <li>"What features does your product offer?"</li>
                    <li>"I'm not ready to purchase yet"</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 rounded-lg text-xs">
              <p className="font-semibold text-blue-600 dark:text-blue-400 mb-1">💡 Remember:</p>
              <p className="text-gray-700 dark:text-gray-300">
                One outcome covers similar responses. For example, "I'm interested in pricing" will also match "Tell me about your prices" or "How much does it cost?" — you don't need separate outcomes for these variations.
              </p>
            </div>
            
            <Input 
              value={newOutcome} 
              onChange={e => setNewOutcome(e.target.value)} 
              placeholder="Enter a detailed potential response..." 
              className="text-sm" 
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button 
              className="bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 text-white" 
              onClick={onSave}
              disabled={!newOutcome.trim() || newOutcome.trim().length < 5}
            >
              {isEditing ? 'Save Changes' : 'Add Outcome'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
