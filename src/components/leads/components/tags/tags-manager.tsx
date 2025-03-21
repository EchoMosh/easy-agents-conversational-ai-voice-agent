
import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TagForm } from "./tag-form";
import { TagBadge } from "./tag-badge";
import { Tag } from "@/types/tag-types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface TagsManagerProps {
  leadId: string;
  tags: Tag[];
  isNewLead?: boolean;
  onAddTagForNewLead?: (name: string) => void;
  onRemoveTagForNewLead?: (id: string) => void;
}

interface CreateTagData {
  name: string;
}

export function TagsManager({ 
  leadId, 
  tags, 
  isNewLead = false,
  onAddTagForNewLead,
  onRemoveTagForNewLead
}: TagsManagerProps) {
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['leads'] });
    queryClient.invalidateQueries({ queryKey: ['lead_activities', leadId] });
  };

  const handleCreateTag = async (data: CreateTagData) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // If we're in new lead form mode, use the provided callback
      if (isNewLead && onAddTagForNewLead) {
        onAddTagForNewLead(data.name);
        setIsAddingTag(false);
        setIsSubmitting(false);
        return;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      if (!userData.user) {
        toast.error("You must be logged in to create tags");
        return;
      }

      // First create the tag
      const { data: tag, error: tagError } = await supabase
        .from('tags')
        .insert({
          name: data.name,
          user_id: userData.user.id
        })
        .select()
        .single();

      if (tagError) throw tagError;

      // Then create the lead_tag association
      const { error: linkError } = await supabase
        .from('lead_tags')
        .insert({
          lead_id: leadId,
          tag_id: tag.id
        });

      if (linkError) throw linkError;

      toast.success("Tag added successfully");
      setIsAddingTag(false);
      invalidateQueries();
    } catch (error: any) {
      console.error('Error creating tag:', error);
      toast.error(error.message || "Failed to create tag");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTag = async (data: CreateTagData) => {
    if (!editingTag || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('tags')
        .update({
          name: data.name
        })
        .eq('id', editingTag.id);

      if (error) throw error;

      toast.success("Tag updated successfully");
      setEditingTag(null);
      invalidateQueries();
    } catch (error: any) {
      console.error('Error updating tag:', error);
      toast.error(error.message || "Failed to update tag");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // If we're in new lead form mode, use the provided callback
      if (isNewLead && onRemoveTagForNewLead) {
        onRemoveTagForNewLead(tagId);
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from('lead_tags')
        .delete()
        .eq('lead_id', leadId)
        .eq('tag_id', tagId);

      if (error) throw error;

      toast.success("Tag removed successfully");
      invalidateQueries();
    } catch (error: any) {
      console.error('Error removing tag:', error);
      toast.error(error.message || "Failed to remove tag");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-gray-800">Lead Tags</h3>
        <Dialog open={isAddingTag} onOpenChange={setIsAddingTag}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 px-4">
              <PlusCircle className="w-3.5 h-3.5 mr-1.5" />
              Add Tag
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Tag</DialogTitle>
            </DialogHeader>
            <TagForm 
              onSubmit={handleCreateTag}
              isSubmitting={isSubmitting}
            />
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <TagBadge
            key={tag.id}
            tag={tag}
            onEdit={() => setEditingTag(tag)}
            onDelete={() => handleDeleteTag(tag.id)}
          />
        ))}
      </div>

      <Dialog open={!!editingTag} onOpenChange={(open) => !open && setEditingTag(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Tag</DialogTitle>
          </DialogHeader>
          {editingTag && (
            <TagForm
              defaultValues={editingTag}
              onSubmit={handleUpdateTag}
              isSubmitting={isSubmitting}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
