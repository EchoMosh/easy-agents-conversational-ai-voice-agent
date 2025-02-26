
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pipeline } from "@/types/pipeline";

type LeadHandlingOption = "keep" | "move" | "delete";

interface DeletePipelineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (option: LeadHandlingOption, targetPipelineId?: string) => void;
  isDeleting: boolean;
  hasLeads: boolean;
  otherPipelines: Pipeline[];
}

export function DeletePipelineDialog({
  open,
  onOpenChange,
  onDelete,
  isDeleting,
  hasLeads,
  otherPipelines,
}: DeletePipelineDialogProps) {
  const [leadHandling, setLeadHandling] = useState<LeadHandlingOption>("keep");
  const [targetPipelineId, setTargetPipelineId] = useState<string>("");

  const handleDelete = () => {
    onDelete(leadHandling, leadHandling === "move" ? targetPipelineId : undefined);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Delete Pipeline</SheetTitle>
          <SheetDescription>
            {hasLeads 
              ? "This pipeline contains leads. What would you like to do with them?"
              : "Are you sure you want to delete this pipeline? This action cannot be undone."}
          </SheetDescription>
        </SheetHeader>

        {hasLeads && (
          <div className="my-6">
            <RadioGroup
              value={leadHandling}
              onValueChange={(value) => setLeadHandling(value as LeadHandlingOption)}
              className="space-y-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="keep" id="keep" />
                <Label htmlFor="keep">Keep leads without a pipeline</Label>
              </div>
              
              {otherPipelines.length > 0 && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="move" id="move" />
                  <Label htmlFor="move">Move leads to another pipeline</Label>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <RadioGroupItem value="delete" id="delete" />
                <Label htmlFor="delete">Delete all leads in this pipeline</Label>
              </div>
            </RadioGroup>

            {leadHandling === "move" && otherPipelines.length > 0 && (
              <div className="mt-4">
                <Label htmlFor="target-pipeline">Select target pipeline</Label>
                <Select
                  value={targetPipelineId}
                  onValueChange={setTargetPipelineId}
                >
                  <SelectTrigger id="target-pipeline" className="w-full">
                    <SelectValue placeholder="Select a pipeline" />
                  </SelectTrigger>
                  <SelectContent>
                    {otherPipelines.map((pipeline) => (
                      <SelectItem key={pipeline.id} value={pipeline.id}>
                        {pipeline.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}

        <SheetFooter className="mt-4">
          <div className="flex justify-end gap-4 w-full">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={isDeleting || (leadHandling === "move" && !targetPipelineId)}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
