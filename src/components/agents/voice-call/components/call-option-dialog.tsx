
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Computer, Smartphone } from "lucide-react";

interface CallOptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectDesktop: () => void;
}

export function CallOptionDialog({
  open,
  onOpenChange,
  onSelectDesktop,
}: CallOptionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Call Method</DialogTitle>
          <DialogDescription>
            Select how you would like to receive the call
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="flex flex-col items-center gap-2">
            <Button 
              onClick={onSelectDesktop}
              className="w-full h-24 flex flex-col items-center justify-center gap-2"
              variant="outline"
            >
              <Computer className="h-8 w-8" />
              <span>Desktop</span>
            </Button>
            <p className="text-xs text-muted-foreground">Use your computer's microphone</p>
          </div>
          
          <div className="flex flex-col items-center gap-2">
            <Button
              disabled
              className="w-full h-24 flex flex-col items-center justify-center gap-2"
              variant="outline"
            >
              <Smartphone className="h-8 w-8" />
              <span>Mobile</span>
            </Button>
            <p className="text-xs text-muted-foreground">
              <span className="text-xs font-semibold text-amber-500">Coming Soon</span>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
