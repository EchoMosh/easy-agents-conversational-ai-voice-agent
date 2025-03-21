
import { useState } from "react";
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
import { Info } from "lucide-react";

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
  const [phone, setPhone] = useState("");
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

  const handleAddTag = async (name: string) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("You must be logged in to create tags");
        return;
      }

      // Create a temporary tag ID for UI purposes
      const tempTag: Tag = {
        id: uuidv4(),
        name,
        color: "gray",
        user_id: userData.user.id
      };
      
      setTags([...tags, tempTag]);
      toast.success("Tag added");
    } catch (error) {
      console.error("Error adding tag:", error);
      toast.error("Failed to add tag");
    }
  };

  const handleRemoveTag = (id: string) => {
    setTags(tags.filter(tag => tag.id !== id));
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

    setIsLoading(true);
    const formData = new FormData(e.currentTarget);
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const email = formData.get("email") as string;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("No authenticated user found");
      }

      // Find the selected pipeline if one was chosen
      const selectedPipeline = selectedPipelineId ? 
        pipelines.find(p => p.id === selectedPipelineId) : null;
      
      // Get the first column's title to use as the initial status if a pipeline was selected
      let initialStatus = 'new';
      if (selectedPipeline && selectedPipeline.columns.length > 0) {
        initialStatus = selectedPipeline.columns[0].title;
      }

      const { data: leadData, error: leadError } = await supabase
        .from("leads")
        .insert([{
          name: `${firstName} ${lastName}`.trim(),
          email: email || null,
          phone: phone || null,
          user_id: user.id,
          pipeline_id: selectedPipelineId || null,
          status: initialStatus,
          workspace_id: currentWorkspace.id
        }])
        .select()
        .single();

      if (leadError) throw leadError;

      // Process variables if any exist
      if (variables.length > 0) {
        const { error: variablesError } = await supabase
          .from("lead_variables")
          .insert(variables.map(v => ({
            lead_id: leadData.id,
            name: v.name,
            value: v.value
          })));
        if (variablesError) throw variablesError;
      }

      // Process tags if any exist
      if (tags.length > 0) {
        // First create any new tags
        for (const tag of tags) {
          // Check if this is a temporary tag (created during this session)
          if (tag.id.includes('-')) {
            // Create the actual tag in the database
            const { data: newTag, error: newTagError } = await supabase
              .from('tags')
              .insert({
                name: tag.name,
                color: tag.color,
                user_id: user.id
              })
              .select()
              .single();
              
            if (newTagError) throw newTagError;
            
            // Associate the tag with the lead
            const { error: linkError } = await supabase
              .from('lead_tags')
              .insert({
                lead_id: leadData.id,
                tag_id: newTag.id
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
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs 
        defaultValue="contact" 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-3 mb-2">
          <TabsTrigger value="contact" className="text-gray-800">Contact Info</TabsTrigger>
          <TabsTrigger value="variables" className="text-gray-800">Variables</TabsTrigger>
          <TabsTrigger value="tags" className="text-gray-800">Tags</TabsTrigger>
        </TabsList>

        <TabsContent value="contact" className="space-y-4 pt-2">
          <ContactInfoForm 
            phone={phone}
            onPhoneChange={setPhone}
            required={true}
          />
          
          <div className="pt-2">
            <PipelineSelect
              pipelines={pipelines}
              selectedPipelineId={selectedPipelineId}
              onPipelineChange={setSelectedPipelineId}
              refetchPipelines={refetchPipelines}
              required={false}
            />
            <p className="text-xs text-gray-600 mt-1">
              Pipeline selection is optional
            </p>
          </div>
        </TabsContent>

        <TabsContent value="variables" className="space-y-4 pt-2">
          <div className="flex items-start gap-2 mb-4">
            <Info className="h-4 w-4 mt-1 text-blue-500" />
            <p className="text-sm text-blue-700">
              Variables are custom fields that can be used in workflows and automations. 
              Use them to store important lead information you'll need later.
            </p>
          </div>
          
          <div className="overflow-hidden rounded-lg border border-gray-300 bg-white">
            <div className="relative p-4">
              <CustomVariables
                variables={variables}
                onAddVariable={(variable) => setVariables([...variables, variable])}
                onRemoveVariable={(index) => setVariables(variables.filter((_, i) => i !== index))}
                tags={[]}
                onAddTag={undefined}
                onRemoveTag={undefined}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="tags" className="space-y-4 pt-2">
          <div className="flex items-start gap-2 mb-4">
            <Info className="h-4 w-4 mt-1 text-green-500" />
            <p className="text-sm text-green-700">
              Tags help you organize and filter your leads. Use them to categorize leads by source, 
              priority, status, or any other classification that makes sense for your workflow.
            </p>
          </div>
          
          <div className="overflow-hidden rounded-lg border border-gray-300 bg-white">
            <div className="relative p-4">
              {onAddTag && onRemoveTag && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge 
                      key={tag.id} 
                      variant="secondary" 
                      className="pl-3 pr-2 py-1.5 h-8 text-sm bg-green-50 hover:bg-green-100 
                        transition-all duration-200 border border-green-100 shadow-sm text-green-800"
                    >
                      <span className="font-medium">{tag.name}</span>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleRemoveTag(tag.id)} 
                        className="h-5 w-5 ml-2 hover:bg-green-200 rounded-full"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              )}
              <TagsManager 
                leadId={''} // temporary ID for new leads
                tags={tags}
                isNewLead={true}
                onAddTagForNewLead={handleAddTag}
                onRemoveTagForNewLead={handleRemoveTag}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Button 
        type="submit" 
        disabled={isLoading || !currentWorkspace} 
        className="w-full h-11 text-base bg-primary/90 hover:bg-primary transition-all duration-200 text-white"
      >
        {isLoading ? "Adding..." : `Save Lead${
          (variables.length > 0 || tags.length > 0) 
            ? ` with ${variables.length + tags.length} Field${variables.length + tags.length === 1 ? '' : 's'}` 
            : ''
        }`}
      </Button>
    </form>
  );
}
