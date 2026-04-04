import { useState, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
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
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/context/workspace-context";
import { useQuery } from "@tanstack/react-query";
import { Pipeline, convertJsonToPipeline } from "@/types/pipeline";

interface WorkspaceTag {
  id: string;
  name: string;
  color: string;
}

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
  selectedLeads,
}: BulkActionsDialogProps) {
  const [activeTab, setActiveTab] = useState("tags");
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");
  const [selectedStage, setSelectedStage] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const { currentWorkspace } = useWorkspace();

  // Fetch workspace tags
  const { data: workspaceTags = [] } = useQuery({
    queryKey: ["tags", currentWorkspace?.id],
    queryFn: async (): Promise<WorkspaceTag[]> => {
      if (!currentWorkspace?.id) return [];
      const { data, error } = await supabase
        .from("tags")
        .select("id, name, color")
        .eq("workspace_id", currentWorkspace.id)
        .order("name");
      if (error) {
        console.error("Failed to fetch workspace tags:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!currentWorkspace?.id && isOpen,
  });

  // Fetch workspace pipelines
  const { data: workspacePipelines = [] } = useQuery({
    queryKey: ["pipelines", currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];
      const { data, error } = await supabase
        .from("pipelines")
        .select("*")
        .eq("workspace_id", currentWorkspace.id)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("Failed to fetch pipelines:", error);
        return [];
      }
      return (data || []).map(convertJsonToPipeline);
    },
    enabled: !!currentWorkspace?.id && isOpen,
  });

  const selectedPipeline = workspacePipelines.find(
    (p: Pipeline) => p.id === selectedPipelineId,
  );
  const stages = selectedPipeline?.columns ?? [];

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedTagIds([]);
      setSelectedPipelineId("");
      setSelectedStage("");
      setSelectedStatus("");
      setActiveTab("tags");
    }
  }, [isOpen]);

  // Reset status when pipeline changes (status depends on pipeline stages)
  useEffect(() => {
    setSelectedStatus("");
  }, [selectedPipelineId]);

  const handleToggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const handlePipelineChange = (pipelineId: string) => {
    setSelectedPipelineId(pipelineId);
    const pipeline = workspacePipelines.find(
      (p: Pipeline) => p.id === pipelineId,
    );
    if (pipeline?.columns?.length) {
      setSelectedStage(pipeline.columns[0].title);
    } else {
      setSelectedStage("");
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      if (activeTab === "tags") {
        if (selectedTagIds.length === 0) {
          toast.error("Please select at least one tag to assign.");
          setIsLoading(false);
          return;
        }
        if (onAssignTags) {
          await onAssignTags();
        }
        toast.success(`${selectedLeadIds.length} lead(s) updated`);
      }

      if (activeTab === "pipeline") {
        if (!selectedPipelineId) {
          toast.error("Please select a pipeline.");
          setIsLoading(false);
          return;
        }
        if (!selectedStage) {
          toast.error("Please select a stage.");
          setIsLoading(false);
          return;
        }
        if (onChangePipeline) {
          await onChangePipeline(
            selectedLeadIds,
            selectedPipelineId,
            selectedStage,
          );
        }
        toast.success(`${selectedLeadIds.length} lead(s) updated`);
      }

      if (activeTab === "status") {
        if (!selectedStatus) {
          toast.error("Please select a status.");
          setIsLoading(false);
          return;
        }
        if (onChangeStatus) {
          await onChangeStatus(selectedLeadIds, selectedStatus);
        }
        toast.success(`${selectedLeadIds.length} lead(s) updated`);
      }

      if (activeTab === "delete") {
        if (onDeleteLeads) {
          await onDeleteLeads();
        }
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

            {/* Tags Tab */}
            <TabsContent value="tags" className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  Select Tags to Add
                </Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Add or remove tags from the selected leads
                </p>
              </div>
              {workspaceTags.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No tags found in this workspace. Create tags first from a lead
                  detail view.
                </p>
              ) : (
                <div className="space-y-2">
                  {workspaceTags.map((tag) => (
                    <label
                      key={tag.id}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <Checkbox
                        checked={selectedTagIds.includes(tag.id)}
                        onCheckedChange={() => handleToggleTag(tag.id)}
                      />
                      <span className="text-sm">{tag.name}</span>
                    </label>
                  ))}
                </div>
              )}
              {selectedTagIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
                  {selectedTagIds.map((tagId) => {
                    const tag = workspaceTags.find((t) => t.id === tagId);
                    if (!tag) return null;
                    return (
                      <Badge key={tag.id} variant="secondary">
                        {tag.name}
                      </Badge>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Pipeline Tab */}
            <TabsContent value="pipeline" className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-1 block">
                  Move to Pipeline & Stage
                </Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Move the selected leads to a different pipeline and stage
                </p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="bulk-pipeline" className="text-sm">
                    Pipeline
                  </Label>
                  <Select
                    value={selectedPipelineId}
                    onValueChange={handlePipelineChange}
                  >
                    <SelectTrigger id="bulk-pipeline" className="w-full">
                      <SelectValue placeholder="Select pipeline" />
                    </SelectTrigger>
                    <SelectContent>
                      {workspacePipelines.length === 0 ? (
                        <SelectItem value="no-pipelines" disabled>
                          No pipelines found
                        </SelectItem>
                      ) : (
                        workspacePipelines.map((pipeline: Pipeline) => (
                          <SelectItem key={pipeline.id} value={pipeline.id}>
                            {pipeline.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bulk-stage" className="text-sm">
                    Stage
                  </Label>
                  <Select
                    value={selectedStage}
                    onValueChange={setSelectedStage}
                    disabled={stages.length === 0}
                  >
                    <SelectTrigger id="bulk-stage" className="w-full">
                      <SelectValue
                        placeholder={
                          selectedPipelineId
                            ? "Select stage"
                            : "Select a pipeline first"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.title}>
                          <span className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full shrink-0"
                              style={{ backgroundColor: stage.color }}
                            />
                            {stage.title}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Status Tab */}
            <TabsContent value="status" className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-1 block">
                  Update Status
                </Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Change the status of the selected leads
                </p>
              </div>

              {!selectedPipelineId ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Select a pipeline first to see available statuses.
                  </p>
                  <div className="space-y-1.5">
                    <Label htmlFor="status-pipeline" className="text-sm">
                      Pipeline
                    </Label>
                    <Select
                      value={selectedPipelineId}
                      onValueChange={handlePipelineChange}
                    >
                      <SelectTrigger id="status-pipeline" className="w-full">
                        <SelectValue placeholder="Select pipeline" />
                      </SelectTrigger>
                      <SelectContent>
                        {workspacePipelines.length === 0 ? (
                          <SelectItem value="no-pipelines" disabled>
                            No pipelines found
                          </SelectItem>
                        ) : (
                          workspacePipelines.map((pipeline: Pipeline) => (
                            <SelectItem key={pipeline.id} value={pipeline.id}>
                              {pipeline.name}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label
                      htmlFor="status-pipeline-display"
                      className="text-sm"
                    >
                      Pipeline
                    </Label>
                    <Select
                      value={selectedPipelineId}
                      onValueChange={handlePipelineChange}
                    >
                      <SelectTrigger
                        id="status-pipeline-display"
                        className="w-full"
                      >
                        <SelectValue placeholder="Select pipeline" />
                      </SelectTrigger>
                      <SelectContent>
                        {workspacePipelines.map((pipeline: Pipeline) => (
                          <SelectItem key={pipeline.id} value={pipeline.id}>
                            {pipeline.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="bulk-status" className="text-sm">
                      Status
                    </Label>
                    <Select
                      value={selectedStatus}
                      onValueChange={setSelectedStatus}
                    >
                      <SelectTrigger id="bulk-status" className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {stages.map((stage) => (
                          <SelectItem key={stage.id} value={stage.title}>
                            <span className="flex items-center gap-2">
                              <span
                                className="h-2 w-2 rounded-full shrink-0"
                                style={{ backgroundColor: stage.color }}
                              />
                              {stage.title}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Delete Tab */}
            <TabsContent value="delete" className="space-y-4">
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                <Label className="text-sm font-medium">Delete Leads</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone
              </p>
              <div className="bg-destructive/10 p-4 rounded-md border border-destructive/20">
                <p className="text-sm">
                  Are you sure you want to delete {selectedLeadIds.length} lead
                  {selectedLeadIds.length !== 1 ? "s" : ""}? This will
                  permanently remove them from your CRM.
                </p>
              </div>
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
              variant={activeTab === "delete" ? "destructive" : "default"}
              className="w-full sm:w-auto"
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
