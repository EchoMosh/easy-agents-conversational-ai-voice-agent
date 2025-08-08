
import { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LeadVariables } from "../lead-variables";
import { LeadVariable } from "@/pages/dashboard/leads";
import { NewVariableForm } from "../variables/new-variable-form";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TagsManager } from "./tags/tags-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tag } from "@/types/tag-types";
import { v4 as uuidv4 } from "uuid";
import { useWorkspace } from "@/context/workspace-context";

interface EditVariablesDialogProps {
  lead: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onLeadUpdated: () => void;
}

export function EditVariablesDialog({ 
  lead, 
  isOpen, 
  onOpenChange,
  onLeadUpdated 
}: EditVariablesDialogProps) {
  const [variables, setVariables] = useState<LeadVariable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newVariables, setNewVariables] = useState<{name: string; value: string}[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("variables");
  const [tags, setTags] = useState<Tag[]>([]);
  const [initialTags, setInitialTags] = useState<Tag[]>([]);
  const [existingTags, setExistingTags] = useState<Tag[]>([]);
  const { currentWorkspace } = useWorkspace();

  useEffect(() => {
    if (isOpen && lead?.id) {
      console.log("🔍DEBUG_REAL_DIALOG – fetchAllTags triggered, dialog open =", isOpen);
      fetchVariables();
      fetchTags();
      fetchAllTags();
    }
  }, [isOpen, lead?.id]);

  const fetchVariables = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("lead_variables")
        .select("*")
        .eq("lead_id", lead.id)
        .order("name", { ascending: true });

      if (error) throw error;
      setVariables(data || []);
    } catch (error) {
      console.error("Error fetching variables:", error);
      toast.error("Failed to load variables");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from("lead_tags")
        .select("tag:tag_id(*)")
        .eq("lead_id", lead.id);

      if (error) throw error;
      const formattedTags = data.map(item => item.tag).filter(Boolean);
      setTags(formattedTags || []);
      setInitialTags(formattedTags || []);
    } catch (error) {
      console.error("Error fetching tags:", error);
      toast.error("Failed to load tags");
    }
  };

  const fetchAllTags = async () => {
    if (!currentWorkspace?.id) return;
    try {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("workspace_id", currentWorkspace.id);
      if (error) throw error;
      setExistingTags(data || []);
      console.log("Fetched existing tags in dialog:", data);
    } catch (error) {
      console.error("Error fetching all tags:", error);
      toast.error("Failed to load existing tags");
    }
  };

  const handleEditVariable = (variable: LeadVariable) => {
    // Dialog will take care of the edit
  };

  const handleDeleteVariable = async (id: string) => {
    try {
      const { error } = await supabase
        .from("lead_variables")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      toast.success("Variable deleted");
      setVariables(variables.filter(v => v.id !== id));
      onLeadUpdated();
    } catch (error) {
      console.error("Error deleting variable:", error);
      toast.error("Failed to delete variable");
    }
  };

  const handleAddVariable = () => {
    setNewVariables([...newVariables, { name: '', value: '' }]);
  };

  const handleRemoveNewVariable = (index: number) => {
    const updated = [...newVariables];
    updated.splice(index, 1);
    setNewVariables(updated);
  };

  const handleNewVariableChange = (index: number, field: "name" | "value", value: string) => {
    const updated = [...newVariables];
    updated[index][field] = value;
    setNewVariables(updated);
  };

  const handleSave = async () => {
    await handleSaveVariables();
    await handleSaveTags();
  };

  const handleAddTag = async (name: string) => {
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
    toast.success("Tag staged for adding");
  };

  const handleRemoveTag = (id: string) => {
    setTags(tags.filter((tag) => tag.id !== id));
    toast.info("Tag staged for removal");
  };

  const handleSaveTags = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");

      const tagsToAdd = tags.filter(t => !initialTags.some(it => it.id === t.id));
      const tagsToRemove = initialTags.filter(it => !tags.some(t => t.id === it.id));

      for (const tag of tagsToAdd) {
        let tagId = tag.id;
        // If it's a new tag (has UUID), create it first
        if (tag.id.includes('-')) {
          const { data: newTag, error: newTagError } = await supabase
            .from("tags")
            .insert({
              name: tag.name,
              color: tag.color,
              user_id: user.id,
              workspace_id: currentWorkspace?.id,
            })
            .select()
            .single();
          if (newTagError) throw newTagError;
          tagId = newTag.id;
        }
        
        // Link tag to lead
        const { error: linkError } = await supabase.from("lead_tags").insert({
          lead_id: lead.id,
          tag_id: tagId,
        });
        if (linkError) throw linkError;
      }

      for (const tag of tagsToRemove) {
        const { error: unlinkError } = await supabase
          .from("lead_tags")
          .delete()
          .eq("lead_id", lead.id)
          .eq("tag_id", tag.id);
        if (unlinkError) throw unlinkError;
      }

      if (tagsToAdd.length > 0 || tagsToRemove.length > 0) {
        toast.success("Tags updated successfully");
      }
      
      fetchTags(); // Re-fetch to sync state
      onLeadUpdated();
    } catch (error) {
      console.error("Error saving tags:", error);
      toast.error("Failed to save tags");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveVariables = async () => {
    if (newVariables.some(v => !v.name.trim())) {
      if (newVariables.length > 0) toast.error("Variable names cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      const variablesToAdd = newVariables.map(v => ({
        lead_id: lead.id,
        name: v.name.trim().replace(/\s+/g, '_'),
        value: v.value.trim() || null
      }));

      if (variablesToAdd.length > 0) {
        const { error } = await supabase
          .from('lead_variables')
          .insert(variablesToAdd);
        if (error) throw error;
        toast.success(`Added ${variablesToAdd.length} variable${variablesToAdd.length > 1 ? 's' : ''}`);
      }
      
      setNewVariables([]);
      fetchVariables();
      onLeadUpdated();
    } catch (error) {
      console.error('Error adding variables:', error);
      toast.error('Failed to add variables');
    } finally {
      setIsSaving(false);
    }
  };

  console.log("🔍DEBUG_EDIT_DIALOG – tags:", tags);
  console.log("🔍DEBUG_EDIT_DIALOG – existingTags:", existingTags);
  console.log("🔍DEBUG_REAL_DIALOG – passing to TagsManager:", { tags, existingTags });
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        handleSave();
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>DEBUG: EditVariablesDialog Active</DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="variables">Variables</TabsTrigger>
            <TabsTrigger value="tags">Tags</TabsTrigger>
          </TabsList>
          
          <TabsContent value="variables" className="pt-2 space-y-6">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Current Variables */}
                <ScrollArea className="h-[280px] pr-4">
                  <LeadVariables
                    leadId={lead.id}
                    variables={variables}
                    onEdit={handleEditVariable}
                    onDelete={handleDeleteVariable}
                    onAddClick={handleAddVariable}
                    onVariablesUpdated={() => {
                      fetchVariables();
                      onLeadUpdated();
                    }}
                  />

                  {/* New Variables Forms */}
                  {newVariables.length > 0 && (
                    <div className="border-t pt-4 mt-6">
                      <h3 className="text-lg font-medium mb-4">Add New Variables</h3>
                      <div className="space-y-3">
                        {newVariables.map((variable, index) => (
                          <NewVariableForm
                            key={index}
                            name={variable.name}
                            value={variable.value}
                            onChange={(field, value) => handleNewVariableChange(index, field, value)}
                            onRemove={() => handleRemoveNewVariable(index)}
                          />
                        ))}
                        {newVariables.some(v => v.name.includes(' ')) && (
                          <p className="text-xs text-amber-600 mt-2">
                            Note: Spaces in variable names will be converted to underscores when saved
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </ScrollArea>

                {/* Add Variable Button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddVariable}
                  className="w-full"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add New Variable
                </Button>

                {/* Save Button (only shown if there are new variables) */}
                {newVariables.length > 0 && (
                  <div className="flex justify-end pt-2">
                    <Button
                      onClick={handleSaveVariables}
                      disabled={isSaving}
                    >
                      {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Save {newVariables.length} Variable{newVariables.length !== 1 ? 's' : ''}
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="tags" className="pt-1 mt-0">
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
              <div className="relative">
                <ScrollArea className="h-[280px]">
                  <div className="p-3 pt-0">
                    <div className="pt-4">
                      <TagsManager
                        leadId={lead.id}
                        tags={tags}
                        existingTags={existingTags}
                        isNewLead={true}
                        onAddTagForNewLead={handleAddTag}
                        onRemoveTagForNewLead={handleRemoveTag}
                      />
                    </div>
                    <div className="mt-2 text-xs text-gray-500">
                      Tags will be saved when the dialog is closed.
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <div className="flex justify-end pt-4">
          <Button
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            className="w-full h-11 text-base bg-primary/90 hover:bg-primary transition-all duration-200 text-white"
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Lead
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
