import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lead } from "@/pages/dashboard/leads";
import { Tag } from "@/types/tag";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Pipeline } from "@/types/pipeline";

interface BulkActionsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLeads: Lead[];
  onAssignTags: (leadIds: string[], tagIds: string[]) => Promise<void>;
  onRemoveTags: (leadIds: string[], tagIds: string[]) => Promise<void>;
  onChangePipeline: (leadIds: string[], pipelineId: string) => Promise<void>;
  onChangeStatus: (leadIds: string[], status: string) => Promise<void>;
  onDeleteLeads: (leadIds: string[]) => Promise<void>;
  pipelines: Pipeline[];
}

export function BulkActionsDialog({
  isOpen,
  onOpenChange,
  selectedLeads,
  onAssignTags,
  onRemoveTags,
  onChangePipeline,
  onChangeStatus,
  onDeleteLeads,
  pipelines,
}: BulkActionsDialogProps) {
  const [activeTab, setActiveTab] = useState("tags");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPipeline, setSelectedPipeline] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [isStatusValid, setIsStatusValid] = useState(true);

  const validateStatus = (status: string) => {
    return status.trim() !== "";
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    if (activeTab === "pipeline" && !selectedPipeline) {
      toast({
        title: "Error",
        description: "Please select a pipeline.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (activeTab === "status") {
      if (!selectedStatus) {
        toast({
          title: "Error",
          description: "Please enter a status.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (!isStatusValid) {
        setIsLoading(false);
        return;
      }
    }

    try {
      if (activeTab === "tags") {
        if (selectedTags.length > 0) {
          await onAssignTags(
            selectedLeads.map((lead) => lead.id),
            selectedTags
          );
          toast.success(`${selectedLeads.length} lead(s) updated`);
        } else {
          toast({
            title: "No tags selected",
            description: "Please select at least one tag to assign.",
          });
          setIsLoading(false);
          return;
        }
      }

      if (activeTab === "pipeline") {
        await onChangePipeline(
          selectedLeads.map((lead) => lead.id),
          selectedPipeline
        );
        toast.success(`${selectedLeads.length} lead(s) updated`);
      }

      if (activeTab === "status") {
        await onChangeStatus(
          selectedLeads.map((lead) => lead.id),
          selectedStatus
        );
        toast.success(`${selectedLeads.length} lead(s) updated`);
      }

      if (activeTab === "delete") {
        await onDeleteLeads(selectedLeads.map((lead) => lead.id));
        toast.success(`${selectedLeads.length} lead(s) deleted`);
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error in bulk action:", error);
      toast({
        title: "Error",
        description: "Failed to perform bulk action",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Bulk Actions</SheetTitle>
          <SheetDescription>
            Apply actions to {selectedLeads.length} selected leads.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="tags" className="mt-4" onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="tags">Tags</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="delete">Delete</TabsTrigger>
          </TabsList>
          <TabsContent value="tags" className="pt-4">
            <div className="grid gap-2">
              <Label htmlFor="tags">Select Tags</Label>
              <Select
                multiple
                onValueChange={(value) =>
                  setSelectedTags(value ? (value as string[]) : [])
                }
              >
                <SelectTrigger id="tags" className="w-full">
                  <SelectValue placeholder="Select tag" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Tag 1</SelectItem>
                  <SelectItem value="2">Tag 2</SelectItem>
                  <SelectItem value="3">Tag 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="pipeline" className="pt-4">
            <div className="grid gap-2">
              <Label htmlFor="pipeline">Select Pipeline</Label>
              <Select onValueChange={setSelectedPipeline}>
                <SelectTrigger id="pipeline" className="w-full">
                  <SelectValue placeholder="Select pipeline" />
                </SelectTrigger>
                <SelectContent>
                  {pipelines.map((pipeline) => (
                    <SelectItem key={pipeline.id} value={pipeline.id}>
                      {pipeline.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          <TabsContent value="status" className="pt-4">
            <div className="grid gap-2">
              <Label htmlFor="status">Enter Status</Label>
              <Input
                id="status"
                placeholder="Enter status"
                value={selectedStatus}
                onChange={(e) => {
                  const status = e.target.value;
                  setSelectedStatus(status);
                  setIsStatusValid(validateStatus(status));
                }}
              />
              {!isStatusValid && (
                <p className="text-sm text-red-500">Status cannot be empty.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="delete" className="pt-4">
            <p>Are you sure you want to delete these leads?</p>
          </TabsContent>
        </Tabs>

        <SheetFooter className="mt-4">
          <div className="flex justify-end gap-4">
            <SheetClose asChild>
              <Button variant="outline" disabled={isLoading}>
                Cancel
              </Button>
            </SheetClose>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Loading
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
