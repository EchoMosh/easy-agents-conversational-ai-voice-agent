
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { NewLeadForm } from "@/components/leads/new-lead-form";

interface AddLeadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddLeadDialog({ isOpen, onOpenChange, onSuccess }: AddLeadDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <Button onClick={() => onOpenChange(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Add Lead
      </Button>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add New Lead</DialogTitle>
        </DialogHeader>
        <NewLeadForm onSuccess={() => {
          onOpenChange(false);
          onSuccess();
        }} />
      </DialogContent>
    </Dialog>
  );
}
