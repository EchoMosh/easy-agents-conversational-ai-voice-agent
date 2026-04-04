import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lead } from "@/pages/dashboard/leads";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWorkspace } from "@/context/workspace-context";
import { TagsManager } from "./tags/tags-manager";
import { Tag } from "@/types/tag-types";
import { ContactInfoForm } from "./contact-info-form";
import { CustomVariables } from "./custom-variables";
import { validatePhoneUniqueness } from "@/utils/phone-validation";
import { Pipeline, convertJsonToPipeline } from "@/types/pipeline";

interface EditLeadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onSuccess: () => void;
}

interface Variable {
  name: string;
  value: string;
}

interface SimpleTag {
  id: string;
  name: string;
  color: "gray" | "red" | "yellow" | "green" | "blue" | "purple" | "pink";
  user_id?: string;
}

export function EditLeadDialog({
  isOpen,
  onOpenChange,
  lead,
  onSuccess,
}: EditLeadDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [tags, setTags] = useState<SimpleTag[]>([]);
  const [existingTags, setExistingTags] = useState<SimpleTag[]>([]);
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [activeTab, setActiveTab] = useState("contact");
  const [selectedPipelineId, setSelectedPipelineId] = useState("");
  const [selectedStage, setSelectedStage] = useState("");
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  const { data: pipelines = [] } = useQuery({
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

  const selectedPipeline = pipelines.find(
    (p: Pipeline) => p.id === selectedPipelineId,
  );
  const stages = selectedPipeline?.columns ?? [];

  const fetchAllTags = async () => {
    if (!currentWorkspace?.id) return;
    try {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("workspace_id", currentWorkspace.id);
      if (error) {
        console.error("Error fetching workspace tags:", error);
        toast.error("Failed to load tags");
      } else {
        setExistingTags(data);
      }
    } catch (err) {
      console.error("Error fetching workspace tags:", err);
    }
  };

  const handleAddTag = (name: string) => {
    const newTag: SimpleTag = {
      id: `temp-${Date.now()}`,
      name,
      color: "gray",
    };
    setTags([...tags, newTag]);
  };

  const handleRemoveTag = (id: string) => {
    setTags(tags.filter((tag) => tag.id !== id));
  };

  useEffect(() => {
    if (!isOpen || !lead) return;

    const nameParts = lead.name.split(" ");
    setFirstName(nameParts[0] || "");
    setLastName(nameParts.slice(1).join(" ") || "");
    setEmail(lead.email || "");
    setPhone(lead.phone || "");
    setSelectedPipelineId(lead.pipeline_id || "");
    setSelectedStage(lead.status || "");

    if (lead.variables) {
      setVariables(
        lead.variables.map((v) => ({
          name: v.name,
          value: v.value || "",
        })),
      );
    } else {
      setVariables([]);
    }

    if (lead.tags) {
      const simpleTags = lead.tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        color: (tag.color || "gray") as SimpleTag["color"],
        user_id: tag.user_id,
      }));
      setTags(simpleTags);
    } else {
      setTags([]);
    }

    setActiveTab("contact");
    fetchAllTags();
  }, [isOpen, lead]);

  const handlePipelineChange = (pipelineId: string) => {
    setSelectedPipelineId(pipelineId);
    const pipeline = pipelines.find((p: Pipeline) => p.id === pipelineId);
    if (pipeline?.columns?.length) {
      setSelectedStage(pipeline.columns[0].title);
    } else {
      setSelectedStage("");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!lead || !currentWorkspace?.id) {
      toast.error("Missing lead or workspace information");
      return;
    }

    if (phone && phone.trim()) {
      const isPhoneValid = await validatePhoneUniqueness(
        phone,
        currentWorkspace.id,
        lead.id,
      );
      if (!isPhoneValid) {
        toast.error(
          "This phone number is already associated with another lead in this workspace",
        );
        return;
      }
    }

    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No authenticated user found");
      }

      const fullName = `${firstName} ${lastName}`.trim();

      const { error: leadError } = await supabase
        .from("leads")
        .update({
          name: fullName,
          email: email || null,
          phone: phone || null,
          status: selectedStage || lead.status || "new",
          pipeline_id: selectedPipelineId || lead.pipeline_id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", lead.id);

      if (leadError) throw leadError;

      // Handle variables updates
      const { error: deleteVarsError } = await supabase
        .from("lead_variables")
        .delete()
        .eq("lead_id", lead.id);

      if (deleteVarsError) {
        console.error("Failed to delete lead variables:", deleteVarsError);
        throw deleteVarsError;
      }

      if (variables.length > 0) {
        const { error: variablesError } = await supabase
          .from("lead_variables")
          .insert(
            variables.map((v) => ({
              lead_id: lead.id,
              name: v.name,
              value: v.value,
            })),
          );

        if (variablesError) throw variablesError;
      }

      // Handle tags updates
      const { data: currentLeadTags, error: fetchTagsError } = await supabase
        .from("lead_tags")
        .select("tag_id")
        .eq("lead_id", lead.id);

      if (fetchTagsError) {
        console.error("Failed to fetch current lead tags:", fetchTagsError);
        throw fetchTagsError;
      }

      const currentTagIds = currentLeadTags?.map((t) => t.tag_id) || [];

      const existingTagIds = tags
        .filter((t) => !t.id.startsWith("temp-"))
        .map((t) => t.id);
      const newTags = tags.filter((t) => t.id.startsWith("temp-"));

      const tagsToRemove = currentTagIds.filter(
        (id) => !existingTagIds.includes(id),
      );
      const existingTagsToAdd = existingTagIds.filter(
        (id) => !currentTagIds.includes(id),
      );

      if (tagsToRemove.length > 0) {
        const { error: removeTagsError } = await supabase
          .from("lead_tags")
          .delete()
          .eq("lead_id", lead.id)
          .in("tag_id", tagsToRemove);

        if (removeTagsError) {
          console.error("Failed to remove lead tags:", removeTagsError);
          throw removeTagsError;
        }
      }

      if (existingTagsToAdd.length > 0) {
        const tagsToInsert = existingTagsToAdd.map((tagId) => ({
          lead_id: lead.id,
          tag_id: tagId,
        }));

        const { error: addTagsError } = await supabase
          .from("lead_tags")
          .insert(tagsToInsert);

        if (addTagsError) {
          console.error("Failed to add lead tags:", addTagsError);
          throw addTagsError;
        }
      }

      for (const newTag of newTags) {
        const { data: existingTag } = await supabase
          .from("tags")
          .select("id")
          .eq("name", newTag.name)
          .eq("workspace_id", currentWorkspace.id)
          .maybeSingle();

        let tagId: string;

        if (existingTag) {
          tagId = existingTag.id;
        } else {
          const { data: createdTag, error: tagError } = await supabase
            .from("tags")
            .insert({
              name: newTag.name,
              color: newTag.color,
              user_id: user.id,
              workspace_id: currentWorkspace.id,
            })
            .select()
            .single();

          if (tagError) throw tagError;
          tagId = createdTag.id;
        }

        const { data: existingLink } = await supabase
          .from("lead_tags")
          .select("id")
          .eq("lead_id", lead.id)
          .eq("tag_id", tagId)
          .maybeSingle();

        if (!existingLink) {
          const { error: linkError } = await supabase.from("lead_tags").insert({
            lead_id: lead.id,
            tag_id: tagId,
          });

          if (linkError) throw linkError;
        }
      }

      queryClient.invalidateQueries({
        queryKey: ["tags", currentWorkspace?.id],
      });

      toast.success("Lead updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update lead");
      console.error("Error updating lead:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden border shadow-xl rounded-xl will-change-transform z-[101] bg-background sm:max-w-[520px]">
        <form onSubmit={handleSubmit} className="flex flex-col">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="text-lg font-semibold">
              Edit Lead
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {lead?.name || ""}
            </DialogDescription>
          </DialogHeader>

          <div className="px-5">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="w-full justify-start gap-0 rounded-none border-b bg-transparent p-0 h-auto">
                <TabsTrigger
                  value="contact"
                  className="rounded-none border-b-2 border-transparent px-3 pb-2 pt-1 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent"
                >
                  Contact
                </TabsTrigger>
                <TabsTrigger
                  value="variables"
                  className="rounded-none border-b-2 border-transparent px-3 pb-2 pt-1 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent"
                >
                  Variables
                </TabsTrigger>
                <TabsTrigger
                  value="tags"
                  className="rounded-none border-b-2 border-transparent px-3 pb-2 pt-1 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:bg-transparent"
                >
                  Tags
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[340px]">
                <TabsContent value="contact" className="mt-0 pt-4 pb-2">
                  <div className="space-y-4">
                    <ContactInfoForm
                      phone={phone}
                      onPhoneChange={setPhone}
                      firstName={firstName}
                      onFirstNameChange={setFirstName}
                      lastName={lastName}
                      onLastNameChange={setLastName}
                      email={email}
                      onEmailChange={setEmail}
                      required={true}
                    />

                    <div className="border-t pt-4">
                      <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3 block">
                        Pipeline & Stage
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label
                            htmlFor="edit-pipeline"
                            className="text-sm font-medium text-muted-foreground"
                          >
                            Pipeline
                          </Label>
                          <Select
                            value={selectedPipelineId}
                            onValueChange={handlePipelineChange}
                          >
                            <SelectTrigger
                              id="edit-pipeline"
                              className="h-9 text-sm"
                            >
                              <SelectValue placeholder="Select pipeline" />
                            </SelectTrigger>
                            <SelectContent
                              className="z-[9999]"
                              position="popper"
                              sideOffset={5}
                            >
                              {pipelines.length === 0 ? (
                                <SelectItem value="no-pipelines" disabled>
                                  No pipelines found
                                </SelectItem>
                              ) : (
                                pipelines.map((pipeline: Pipeline) => (
                                  <SelectItem
                                    key={pipeline.id}
                                    value={pipeline.id}
                                  >
                                    {pipeline.name}
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1.5">
                          <Label
                            htmlFor="edit-stage"
                            className="text-sm font-medium text-muted-foreground"
                          >
                            Stage
                          </Label>
                          <Select
                            value={selectedStage}
                            onValueChange={setSelectedStage}
                            disabled={stages.length === 0}
                          >
                            <SelectTrigger
                              id="edit-stage"
                              className="h-9 text-sm"
                            >
                              <SelectValue placeholder="Select stage" />
                            </SelectTrigger>
                            <SelectContent
                              className="z-[9999]"
                              position="popper"
                              sideOffset={5}
                            >
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
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="variables" className="mt-0 pt-4 pb-2">
                  <CustomVariables
                    variables={variables}
                    onAddVariable={(variable) =>
                      setVariables([...variables, variable])
                    }
                    onRemoveVariable={(index) =>
                      setVariables(variables.filter((_, i) => i !== index))
                    }
                  />
                </TabsContent>

                <TabsContent value="tags" className="mt-0 pt-4 pb-2">
                  {lead && (
                    <TagsManager
                      leadId={lead.id}
                      tags={tags as Tag[]}
                      existingTags={existingTags as Tag[]}
                      isNewLead={true}
                      onAddTagForNewLead={handleAddTag}
                      onRemoveTagForNewLead={handleRemoveTag}
                    />
                  )}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </div>

          <DialogFooter className="px-5 py-3 border-t">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-9"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !currentWorkspace}
              className="h-9"
            >
              {isLoading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
