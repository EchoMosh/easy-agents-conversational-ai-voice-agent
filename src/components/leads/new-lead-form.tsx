import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Pipeline, convertJsonToPipeline } from "@/types/pipeline";
import { PipelineSelect } from "./components/pipeline-select";
import { ContactInfoForm } from "./components/contact-info-form";
import { CustomVariables } from "./components/custom-variables";
import { useWorkspace } from "@/context/workspace-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { v4 as uuidv4 } from "uuid";
import { Tag } from "@/types/tag-types";
import { TagsManager } from "./components/tags/tags-manager";
import { ScrollArea } from "@/components/ui/scroll-area";
import { validatePhoneUniqueness } from "@/utils/phone-validation";

interface NewLeadFormProps {
  onSuccess: () => void;
}

interface Variable {
  name: string;
  value: string;
}

export function NewLeadForm({ onSuccess }: NewLeadFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [existingTags, setExistingTags] = useState<Tag[]>([]);
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("contact");
  const { currentWorkspace } = useWorkspace();

  const { data: pipelines = [], refetch: refetchPipelines } = useQuery({
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

  useEffect(() => {
    const fetchAllTags = async () => {
      if (!currentWorkspace?.id) return;
      try {
        const { data, error } = await supabase
          .from("tags")
          .select("*")
          .eq("workspace_id", currentWorkspace.id);
        if (error) throw error;
        setExistingTags(data || []);
      } catch (error) {
        console.error("Error fetching all tags:", error);
        toast.error("Failed to load existing tags");
      }
    };

    fetchAllTags();
  }, [currentWorkspace?.id]);

  const handleAddTag = async (name: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("You must be logged in to create tags");
        return;
      }

      const tempTag: Tag = {
        id: uuidv4(),
        name,
        color: "gray",
        user_id: userData.user.id,
      };

      setTags([...tags, tempTag]);
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

    if (!currentWorkspace?.id) {
      toast.error("No workspace selected");
      return;
    }

    if (!phone.trim()) {
      toast.error("Phone number is required");
      return;
    }

    // Validate phone number uniqueness
    const isPhoneValid = await validatePhoneUniqueness(phone, currentWorkspace.id);
    if (!isPhoneValid) {
      toast.error("This phone number is already associated with another lead in this workspace");
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

      const { data: leadData, error: leadError } = await supabase
        .from("leads")
        .insert([
          {
            name: `${firstName} ${lastName}`.trim(),
            email: email || null,
            phone: phone || null,
            user_id: user.id,
            status: "new",
            workspace_id: currentWorkspace.id,
          },
        ])
        .select()
        .single();

      if (leadError) throw leadError;

      if (variables.length > 0) {
        const { error: variablesError } = await supabase
          .from("lead_variables")
          .insert(
            variables.map((v) => ({
              lead_id: leadData.id,
              name: v.name,
              value: v.value,
            }))
          );
        if (variablesError) throw variablesError;
      }

      if (tags.length > 0) {
        for (const tag of tags) {
          if (tag.id.includes("-")) {
            const { data: newTag, error: newTagError } = await supabase
              .from("tags")
              .insert({
                name: tag.name,
                color: tag.color,
                user_id: user.id,
                workspace_id: currentWorkspace.id,
              })
              .select()
              .single();

            if (newTagError) throw newTagError;

            const { error: linkError } = await supabase
              .from("lead_tags")
              .insert({
                lead_id: leadData.id,
                tag_id: newTag.id,
              });

            if (linkError) throw linkError;
          }
        }
      }

      toast.success("Lead added successfully");
      onSuccess();
    } catch (error) {
      toast.error("Failed to add lead");
      console.error("Error adding lead:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
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

        <TabsContent value="contact" className="space-y-4 pt-1 mt-0">
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

          {/* Pipeline selection removed as per user request */}
        </TabsContent>

        <TabsContent value="variables" className="pt-1 mt-0">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="relative">
              <ScrollArea className="h-[280px]">
                <div className="p-3 pt-0">
                  <CustomVariables
                    variables={variables}
                    onAddVariable={(variable) =>
                      setVariables([...variables, variable])
                    }
                    onRemoveVariable={(index) =>
                      setVariables(variables.filter((_, i) => i !== index))
                    }
                  />
                </div>
              </ScrollArea>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tags" className="pt-1 mt-0">
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="relative">
              <ScrollArea className="h-[280px]">
                <div className="p-3 pt-0">
                  <div className="pt-4">
                    <TagsManager
                      leadId={""} // temporary ID for new leads
                      tags={tags}
                      existingTags={existingTags}
                      isNewLead={true}
                      onAddTagForNewLead={handleAddTag}
                      onRemoveTagForNewLead={handleRemoveTag}
                    />
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Tags will be saved when the lead is created.
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
        {isLoading
          ? "Adding..."
          : `Save Lead${
              variables.length > 0 || tags.length > 0
                ? ` with ${variables.length + tags.length} Field${
                    variables.length + tags.length === 1 ? "" : "s"
                  }`
                : ""
            }`}
      </Button>
    </form>
  );
}
