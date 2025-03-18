import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { NewPipelineDialogProps } from "@/types/pipeline-types";

export function NewPipelineDialog({
  open,
  onOpenChange,
  onSubmit,
}: NewPipelineDialogProps) {
  const [newPipelineName, setNewPipelineName] = useState("");

  const handleSubmit = () => {
    if (newPipelineName.trim()) {
      onSubmit(newPipelineName);
      setNewPipelineName("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Pipeline</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Pipeline Name</Label>
            <Input
              id="name"
              value={newPipelineName}
              onChange={(e) => setNewPipelineName(e.target.value)}
              placeholder="Enter pipeline name..."
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Create Pipeline</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
