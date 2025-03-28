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
import { BulkActionsDialogProps } from "@/components/leads/types/lead-types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { AlertTriangle, Tag, GitBranch, FileText, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function BulkActionsDialog({
  isOpen,
  onOpenChange,
  selectedLeadIds,
  onLeadsUpdated,
  onAssignTags,
  onRemoveTags,
  onChangePipeline,
  onChangeStatus,
  onDeleteLeads,
  pipelines,
  selectedLeads,
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
      toast.error("Please select a pipeline.");
      setIsLoading(false);
      return;
    }

    if (activeTab === "status") {
      if (!selectedStatus) {
        toast.error("Please enter a status.");
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
          await onAssignTags();
          toast.success(`${selectedLeadIds.length} lead(s) updated`);
        } else {
          toast.error("Please select at least one tag to assign.");
          setIsLoading(false);
          return;
        }
      }

      if (activeTab === "pipeline") {
        await onChangePipeline(selectedLeadIds, selectedPipeline);
        toast.success(`${selectedLeadIds.length} lead(s) updated`);
      }

      if (activeTab === "status") {
        await onChangeStatus();
        toast.success(`${selectedLeadIds.length} lead(s) updated`);
      }

      if (activeTab === "delete") {
        await onDeleteLeads();
        toast.success(`${selectedLeadIds.length} lead(s) deleted`);
      }

      onOpenChange(false);
      onLeadsUpdated();
    } catch (error) {
      console.error("Error in bulk action:", error);
      toast.error("Failed to perform bulk action");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="text-xl">Bulk Actions</SheetTitle>
          <SheetDescription>
            <Badge
              variant="outline"
              className="bg-primary/10 text-primary font-medium"
            >
              {selectedLeadIds.length} lead
              {selectedLeadIds.length !== 1 ? "s" : ""} selected
            </Badge>
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-200px)] pr-4 my-6">
          <Tabs defaultValue="tags" onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-6">
              <TabsTrigger value="tags" className="flex items-center gap-1.5">
                <Tag className="h-4 w-4" />
                <span className="hidden sm:inline">Tags</span>
              </TabsTrigger>
              <TabsTrigger
                value="pipeline"
                className="flex items-center gap-1.5"
              >
                <GitBranch className="h-4 w-4" />
                <span className="hidden sm:inline">Pipeline</span>
              </TabsTrigger>
              <TabsTrigger value="status" className="flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Status</span>
              </TabsTrigger>
              <TabsTrigger value="delete" className="flex items-center gap-1.5">
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Delete</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tags">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Manage Tags</CardTitle>
                  <CardDescription>
                    Add or remove tags from the selected leads
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="tags" className="mb-1.5 block">
                        Select Tags to Add
                      </Label>
                      <Select
                        onValueChange={(value) =>
                          setSelectedTags(value ? [value] : [])
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
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pipeline">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Change Pipeline</CardTitle>
                  <CardDescription>
                    Move the selected leads to a different pipeline
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="pipeline" className="mb-1.5 block">
                        Select Pipeline
                      </Label>
                      <Select onValueChange={setSelectedPipeline}>
                        <SelectTrigger id="pipeline" className="w-full">
                          <SelectValue placeholder="Select pipeline" />
                        </SelectTrigger>
                        <SelectContent>
                          {pipelines?.map((pipeline) => (
                            <SelectItem key={pipeline.id} value={pipeline.id}>
                              {pipeline.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="status">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Update Status</CardTitle>
                  <CardDescription>
                    Change the status of the selected leads
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="status" className="mb-1.5 block">
                        Enter Status
                      </Label>
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
                        <p className="text-sm text-red-500 mt-1.5">
                          Status cannot be empty.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="delete">
              <Card className="border-destructive/20">
                <CardHeader>
                  <CardTitle className="text-base text-destructive flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Delete Leads
                  </CardTitle>
                  <CardDescription>
                    This action cannot be undone
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-destructive/10 p-4 rounded-md border border-destructive/20">
                    <p className="text-sm">
                      Are you sure you want to delete {selectedLeadIds.length}{" "}
                      lead{selectedLeadIds.length !== 1 ? "s" : ""}? This will
                      permanently remove them from your CRM.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        <SheetFooter className="border-t pt-4">
          <div className="flex justify-end gap-4 w-full">
            <SheetClose asChild>
              <Button
                variant="outline"
                disabled={isLoading}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
            </SheetClose>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className={`w-full sm:w-auto ${
                activeTab === "delete"
                  ? "bg-destructive hover:bg-destructive/90"
                  : ""
              }`}
            >
              {isLoading ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Processing...
                </>
              ) : activeTab === "delete" ? (
                "Delete Leads"
              ) : (
                "Apply Changes"
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
