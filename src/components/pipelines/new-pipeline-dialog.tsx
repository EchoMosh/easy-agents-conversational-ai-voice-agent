
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, KeyboardEvent } from "react";
import { NewPipelineDialogProps } from "@/types/pipeline-types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function NewPipelineDialog({
  open,
  onOpenChange,
  onSubmit,
}: NewPipelineDialogProps) {
  const [newPipelineName, setNewPipelineName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!newPipelineName.trim()) {
      toast.error("Please enter a pipeline name");
      return;
    }

    setIsLoading(true);
    
    try {
      // Check auth status first
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session) {
        toast.error("You must be logged in to create a pipeline. Please refresh and try again.");
        return;
      }
      
      await onSubmit(newPipelineName);
      setNewPipelineName("");
      // Close the dialog after successful pipeline creation
      onOpenChange(false);
    } catch (error) {
      console.error("Error in pipeline dialog:", error);
      toast.error("Failed to create pipeline. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Pipeline</DialogTitle>
          <DialogDescription>
            Enter a name for your new pipeline. You can add and customize stages later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Pipeline Name</Label>
            <Input
              id="name"
              value={newPipelineName}
              onChange={(e) => setNewPipelineName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter pipeline name..."
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Pipeline"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
