import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, Plus, Tag as TagIcon } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lead } from "@/pages/dashboard/leads";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { convertJsonToPipeline } from "@/types/pipeline";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useWorkspace } from "@/context/workspace-context";
import { Badge } from "@/components/ui/badge";

interface EditLeadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  lead: Lead | null;
  onSuccess: () => void;
}

// Simple variable interface for our form
interface Variable {
  name: string;
  value: string;
}

// Simplified tag interface that matches what we need
interface SimpleTag {
  id: string;
  name: string;
  color: "gray" | "red" | "yellow" | "green" | "blue" | "purple" | "pink";
  user_id?: string;
}

const fadeVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export function EditLeadDialog({
  isOpen,
  onOpenChange,
  lead,
  onSuccess,
}: EditLeadDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [tags, setTags] = useState<SimpleTag[]>([]);
  const [newTagName, setNewTagName] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("contact");
  const [newVariableName, setNewVariableName] = useState("");
  const [newVariableValue, setNewVariableValue] = useState("");
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  // Set up form when a lead is selected for editing
  useEffect(() => {
    if (lead) {
      // Split name into first and last name
      const nameParts = lead.name.split(" ");
      setFirstName(nameParts[0] || "");
      setLastName(nameParts.slice(1).join(" ") || "");

      setEmail(lead.email || "");
      setPhone(lead.phone || "");
      setSelectedPipelineId(lead.pipeline_id || "none");

      // Convert lead variables to the format needed by the form
      if (lead.variables) {
        setVariables(
          lead.variables.map((v) => ({
            name: v.name,
            value: v.value || "",
          }))
        );
      } else {
        setVariables([]);
      }

      // Set tags if available - ensuring they match our SimpleTag interface
      if (lead.tags) {
        const simpleTags = lead.tags.map((tag) => ({
          id: tag.id,
          name: tag.name,
          color: (tag.color || "gray") as
            | "gray"
            | "red"
            | "yellow"
            | "green"
            | "blue"
            | "purple"
            | "pink",
          user_id: tag.user_id,
        }));
        setTags(simpleTags);
      } else {
        setTags([]);
      }

      // Reset active tab when opening
      setActiveTab("contact");
    }
  }, [lead, isOpen]);

  const { data: pipelines = [] } = useQuery({
    queryKey: ["pipelines", currentWorkspace?.id],
    queryFn: async () => {
      if (!currentWorkspace?.id) return [];

      const { data, error } = await supabase
        .from("pipelines")
        .select("*")
        .eq("workspace_id", currentWorkspace.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map(convertJsonToPipeline);
    },
    enabled: !!currentWorkspace?.id,
  });

  const handleAddVariable = () => {
    if (!newVariableName.trim()) {
      toast.error("Variable name cannot be empty");
      return;
    }

    setVariables([
      ...variables,
      { name: newVariableName.trim(), value: newVariableValue },
    ]);
    setNewVariableName("");
    setNewVariableValue("");
  };

  const handleRemoveVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("You must be logged in to create tags");
        return;
      }

      // First check if a tag with this name already exists
      const { data: existingTags } = await supabase
        .from("tags")
        .select("*")
        .eq("name", newTagName.trim())
        .limit(1);

      if (existingTags && existingTags.length > 0) {
        // Tag exists, add it to our local state if not already there
        const existingTag = existingTags[0];
        if (!tags.some((t) => t.id === existingTag.id)) {
          setTags([
            ...tags,
            {
              id: existingTag.id,
              name: existingTag.name,
              color: (existingTag.color || "gray") as "gray",
              user_id: existingTag.user_id,
            },
          ]);
        }
        setNewTagName("");

        // Even for existing tags, we should invalidate the query
        // in case this tag wasn't in the dropdown yet
        queryClient.invalidateQueries({
          queryKey: ["tags", currentWorkspace?.id],
        });

        return;
      }

      // Otherwise create a new tag
      const { data: newTag, error } = await supabase
        .from("tags")
        .insert({
          name: newTagName.trim(),
          color: "gray",
          user_id: userData.user.id,
          workspace_id: currentWorkspace?.id, // Ensure workspace_id is set
        })
        .select()
        .single();

      if (error) throw error;

      setTags([
        ...tags,
        {
          id: newTag.id,
          name: newTag.name,
          color: "gray",
          user_id: newTag.user_id,
        },
      ]);
      setNewTagName("");

      // Invalidate the tags query to update the tag filter dropdown
      queryClient.invalidateQueries({
        queryKey: ["tags", currentWorkspace?.id],
      });

      toast.success("Tag added");
    } catch (error: any) {
      console.error("Error adding tag:", error);
      toast.error("Failed to add tag");
    }
  };

  const handleRemoveTag = (id: string) => {
    setTags(tags.filter((tag) => tag.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!lead || !currentWorkspace?.id) {
      toast.error("Missing lead or workspace information");
      return;
    }

    setIsLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No authenticated user found");
      }

      const selectedPipeline = selectedPipelineId
        ? pipelines.find((p) => p.id === selectedPipelineId)
        : null;

      let status = lead.status || "new";
      if (
        selectedPipeline &&
        selectedPipeline.columns.length > 0 &&
        (!lead.status ||
          !selectedPipeline.columns.some((c) => c.title === lead.status))
      ) {
        status = selectedPipeline.columns[0].title;
      }

      const fullName = `${firstName} ${lastName}`.trim();

      // Update the lead basic info
      const { error: leadError } = await supabase
        .from("leads")
        .update({
          name: fullName,
          email: email || null,
          phone: phone || null,
          pipeline_id:
            selectedPipelineId === "none" ? null : selectedPipelineId || null,
          status: status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", lead.id);

      if (leadError) throw leadError;

      // Handle variables updates
      if (variables.length > 0) {
        // First, delete all existing variables
        await supabase.from("lead_variables").delete().eq("lead_id", lead.id);

        // Then insert new ones
        const { error: variablesError } = await supabase
          .from("lead_variables")
          .insert(
            variables.map((v) => ({
              lead_id: lead.id,
              name: v.name,
              value: v.value,
            }))
          );

        if (variablesError) throw variablesError;
      }

      // Handle tags updates
      // Get current tags for the lead
      const { data: currentLeadTags } = await supabase
        .from("lead_tags")
        .select("tag_id")
        .eq("lead_id", lead.id);

      const currentTagIds = currentLeadTags?.map((t) => t.tag_id) || [];
      const newTagIds = tags.map((t) => t.id);

      // Tags to remove - in currentTagIds but not in newTagIds
      const tagsToRemove = currentTagIds.filter(
        (id) => !newTagIds.includes(id)
      );

      // Tags to add - in newTagIds but not in currentTagIds
      const tagsToAdd = newTagIds.filter((id) => !currentTagIds.includes(id));

      // Remove tags
      if (tagsToRemove.length > 0) {
        await supabase
          .from("lead_tags")
          .delete()
          .eq("lead_id", lead.id)
          .in("tag_id", tagsToRemove);
      }

      // Add new tags
      if (tagsToAdd.length > 0) {
        const tagsToInsert = tagsToAdd.map((tagId) => ({
          lead_id: lead.id,
          tag_id: tagId,
        }));

        await supabase.from("lead_tags").insert(tagsToInsert);
      }

      // Invalidate tags query to ensure tag filter dropdown is up-to-date
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
      <DialogContent className="p-0 overflow-hidden border shadow-xl rounded-xl will-change-transform z-[101] bg-background sm:max-w-[550px]">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="text-xl font-semibold">Edit Lead</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Update lead information for {lead?.name || ""}
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
            <form onSubmit={handleSubmit} className="space-y-5">
              <Tabs
                defaultValue="contact"
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3 mb-2 bg-gray-100/70">
                  <TabsTrigger
                    value="contact"
                    className="text-gray-800 data-[state=active]:bg-white"
                  >
                    Contact Info
                  </TabsTrigger>
                  <TabsTrigger
                    value="variables"
                    className="text-gray-800 data-[state=active]:bg-white"
                  >
                    Variables
                  </TabsTrigger>
                  <TabsTrigger
                    value="tags"
                    className="text-gray-800 data-[state=active]:bg-white"
                  >
                    Tags
                  </TabsTrigger>
                </TabsList>

                {/* Contact Info Tab Content */}
                <TabsContent value="contact" className="space-y-4 pt-1 mt-0">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="firstName"
                          className="text-sm font-medium text-gray-700"
                        >
                          First name
                        </Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          className="h-11 text-base"
                          placeholder="John"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="lastName"
                          className="text-sm font-medium text-gray-700"
                        >
                          Last name
                        </Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="h-11 text-base"
                          placeholder="Doe"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label
                          htmlFor="email"
                          className="text-sm font-medium text-gray-700"
                        >
                          Email
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="h-11 text-base"
                          placeholder="john@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label
                          htmlFor="phone"
                          className="text-sm font-medium text-gray-700"
                        >
                          Phone <span className="text-red-500">*</span>
                        </Label>
                        <PhoneInput
                          id="phone"
                          name="phone"
                          value={phone}
                          onChange={setPhone}
                          required
                          className="[&>div]:!h-11 [&>div]:!text-base"
                        />
                      </div>
                    </div>

                    {/* Pipeline Selector */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="pipeline"
                        className="text-sm font-medium text-gray-700"
                      >
                        Pipeline (optional)
                      </Label>
                      <Select
                        value={selectedPipelineId}
                        onValueChange={setSelectedPipelineId}
                      >
                        <SelectTrigger className="h-11 text-base">
                          <SelectValue placeholder="Select pipeline" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Pipeline</SelectItem>
                          {pipelines.map((pipeline) => (
                            <SelectItem key={pipeline.id} value={pipeline.id}>
                              {pipeline.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Pipeline selection is optional
                      </p>
                    </div>
                  </div>
                </TabsContent>

                {/* Variables Tab Content */}
                <TabsContent value="variables" className="pt-1 mt-0">
                  <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <div className="relative p-4">
                      <div className="mb-4">
                        <h3 className="text-sm font-medium mb-2">
                          Add New Variable
                        </h3>
                        <div className="grid grid-cols-5 gap-2">
                          <div className="col-span-2">
                            <Input
                              placeholder="Variable name"
                              value={newVariableName}
                              onChange={(e) =>
                                setNewVariableName(e.target.value)
                              }
                            />
                          </div>
                          <div className="col-span-2">
                            <Input
                              placeholder="Value"
                              value={newVariableValue}
                              onChange={(e) =>
                                setNewVariableValue(e.target.value)
                              }
                            />
                          </div>
                          <Button
                            type="button"
                            onClick={handleAddVariable}
                            variant="secondary"
                            className="col-span-1"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <ScrollArea className="h-[200px] pr-4">
                        {variables.length === 0 ? (
                          <div className="text-center p-4 text-muted-foreground">
                            No variables yet. Add one above.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {variables.map((variable, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between border p-2 rounded-md"
                              >
                                <div className="flex-1">
                                  <p className="font-medium">{variable.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {variable.value || "(empty)"}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveVariable(index)}
                                  className="h-8 w-8 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </div>
                </TabsContent>

                {/* Tags Tab Content */}
                <TabsContent value="tags" className="pt-1 mt-0">
                  <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <div className="relative p-4">
                      <div className="mb-4">
                        <h3 className="text-sm font-medium mb-2">Add Tag</h3>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter tag name"
                            value={newTagName}
                            onChange={(e) => setNewTagName(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            onClick={handleAddTag}
                            variant="secondary"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>

                      <ScrollArea className="h-[200px] pr-4">
                        {tags.length === 0 ? (
                          <div className="text-center p-4 text-muted-foreground">
                            No tags yet. Add one above.
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {tags.map((tag) => (
                              <Badge
                                key={tag.id}
                                variant="outline"
                                className="px-2 py-1 flex items-center gap-1"
                              >
                                <TagIcon className="h-3 w-3" />
                                {tag.name}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveTag(tag.id)}
                                  className="h-4 w-4 p-0 ml-1"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <Button
                type="submit"
                disabled={isLoading || !currentWorkspace}
                className="w-full h-11 text-base bg-primary/90 hover:bg-primary transition-all duration-200 text-white"
              >
                {isLoading ? "Updating..." : "Save Lead"}
              </Button>
            </form>
          </motion.div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
