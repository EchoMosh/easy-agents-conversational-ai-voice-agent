import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { NewLeadForm } from "@/components/leads/new-lead-form";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AddLeadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

// Single Lead dialog component
export function AddLeadDialog({
  isOpen,
  onOpenChange,
  onSuccess,
}: AddLeadDialogProps) {
  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <Button
        onClick={() => onOpenChange(true)}
        className="bg-primary hover:bg-primary/90 transition-colors h-10"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Lead
      </Button>

      <DialogContent className="p-0 overflow-hidden border shadow-xl rounded-xl will-change-transform z-[101] bg-background sm:max-w-[550px]">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="text-xl font-semibold">
            Add New Lead
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Fill in the details to create a new lead in your CRM.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[80vh]">
          <motion.div
            className="py-4 px-6 pb-6"
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={fadeVariants}
          >
            <NewLeadForm
              onSuccess={() => {
                handleClose();
                onSuccess();
              }}
            />
          </motion.div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
