import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lead } from "@/pages/dashboard/leads";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkspace } from "@/context/workspace-context";
import { TagsManager } from "./tags/tags-manager";
import { Tag } from "@/types/tag-types";
import { ContactInfoForm } from "./contact-info-form";
import { CustomVariables } from "./custom-variables";
import { validatePhoneUniqueness } from "@/utils/phone-validation";

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
  const [existingTags, setExistingTags] = useState<SimpleTag[]>([]);
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [activeTab, setActiveTab] = useState("contact");
  const { currentWorkspace } = useWorkspace();
  const queryClient = useQueryClient();

  const fetchAllTags = async () => {
    if (!currentWorkspace?.id) return;
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .eq("workspace_id", currentWorkspace.id);
    if (error) {
      console.error("Error fetching workspace tags:", error);
      toast.error("Failed to load tags");
    } else {
      setExistingTags(data);
      console.log(
        "🐝 workspace existingTags count:",
        data.length,
        data.map((t) => t.name),
      );
    }
  };

  const handleAddTag = (name: string) => {
    const newTag: SimpleTag = {
      id: `temp-${Date.now()}`, // Temporary ID for new tags
      name,
      color: "gray",
    };
    setTags([...tags, newTag]);
    console.log(
      "🏷️ Added tag locally:",
      name,
      "Current tags:",
      [...tags, newTag].map((t) => t.name),
    );
  };

  const handleRemoveTag = (id: string) => {
    setTags(tags.filter((tag) => tag.id !== id));
    console.log(
      "🗑️ Removed tag locally:",
      id,
      "Remaining tags:",
      tags.filter((tag) => tag.id !== id).map((t) => t.name),
    );
  };

  // Set up form when a lead is selected for editing
  useEffect(() => {
    if (!isOpen || !lead) return;

    console.log("🚀 EditLeadDialog opened for lead:", lead.id);
    console.log("📥 Initial tags on lead:", lead.tags);

    // Split name into first and last name
    const nameParts = lead.name.split(" ");
    setFirstName(nameParts[0] || "");
    setLastName(nameParts.slice(1).join(" ") || "");

    setEmail(lead.email || "");
    setPhone(lead.phone || "");

    // Convert lead variables to the format needed by the form
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

    fetchAllTags();
  }, [isOpen, lead]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!lead || !currentWorkspace?.id) {
      toast.error("Missing lead or workspace information");
      return;
    }

    // Validate phone number uniqueness (excluding current lead)
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

      // Update the lead basic info
      const { error: leadError } = await supabase
        .from("leads")
        .update({
          name: fullName,
          email: email || null,
          phone: phone || null,
          status: lead.status || "new",
          updated_at: new Date().toISOString(),
        })
        .eq("id", lead.id);

      if (leadError) throw leadError;

      // Handle variables updates - always delete existing first
      const { error: deleteVarsError } = await supabase
        .from("lead_variables")
        .delete()
        .eq("lead_id", lead.id);

      if (deleteVarsError) {
        console.error("Failed to delete lead variables:", deleteVarsError);
        throw deleteVarsError;
      }

      if (variables.length > 0) {
        // Insert new ones
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
      // Get current tags for the lead
      const { data: currentLeadTags, error: fetchTagsError } = await supabase
        .from("lead_tags")
        .select("tag_id")
        .eq("lead_id", lead.id);

      if (fetchTagsError) {
        console.error("Failed to fetch current lead tags:", fetchTagsError);
        throw fetchTagsError;
      }

      const currentTagIds = currentLeadTags?.map((t) => t.tag_id) || [];

      // Separate existing tags from new tags (with temp IDs)
      const existingTagIds = tags
        .filter((t) => !t.id.startsWith("temp-"))
        .map((t) => t.id);
      const newTags = tags.filter((t) => t.id.startsWith("temp-"));

      // Tags to remove - in currentTagIds but not in existingTagIds
      const tagsToRemove = currentTagIds.filter(
        (id) => !existingTagIds.includes(id),
      );

      // Existing tags to add - in existingTagIds but not in currentTagIds
      const existingTagsToAdd = existingTagIds.filter(
        (id) => !currentTagIds.includes(id),
      );

      // Remove tags
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

      // Add existing tags
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

      // Create and add new tags
      for (const newTag of newTags) {
        // First check if a tag with this name already exists in the workspace
        const { data: existingTag } = await supabase
          .from("tags")
          .select("id")
          .eq("name", newTag.name)
          .eq("workspace_id", currentWorkspace.id)
          .maybeSingle();

        let tagId: string;

        if (existingTag) {
          // Use existing tag
          tagId = existingTag.id;
        } else {
          // Create new tag
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

        // Link the tag to the lead (check if link already exists)
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
                <TabsContent value="contact" className="pt-1 mt-0">
                  <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <div className="relative">
                      <ScrollArea className="h-[280px]">
                        <div className="p-3 pt-0">
                          <div className="pt-4">
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
                          </div>
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </TabsContent>

                {/* Variables Tab Content */}
                <TabsContent value="variables" className="pt-1 mt-0">
                  <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <div className="relative">
                      <ScrollArea className="h-[280px]">
                        <div className="p-3 pt-0">
                          <div className="pt-4">
                            <CustomVariables
                              variables={variables}
                              onAddVariable={(variable) =>
                                setVariables([...variables, variable])
                              }
                              onRemoveVariable={(index) =>
                                setVariables(
                                  variables.filter((_, i) => i !== index),
                                )
                              }
                            />
                          </div>
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </TabsContent>

                {/* Tags Tab Content */}
                <TabsContent value="tags" className="pt-1 mt-0">
                  <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                    <div className="relative">
                      <ScrollArea className="h-[280px]">
                        <div className="p-3 pt-0">
                          <div className="pt-4">
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
                          </div>
                        </div>
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
