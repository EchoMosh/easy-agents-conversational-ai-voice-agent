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
import { EmptyState } from "./empty-state";

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

// Maximum tag name length
const MAX_TAG_LENGTH = 25;

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
    
    const trimmedName = data.name.trim();
    
    if (!trimmedName) {
      toast.error("Tag name cannot be empty");
      return;
    }
    
    if (trimmedName.length > MAX_TAG_LENGTH) {
      toast.error(`Tag name must be ${MAX_TAG_LENGTH} characters or less`);
      return;
    }
    
    const isDuplicate = tags.some(tag => 
      tag.name.toLowerCase() === trimmedName.toLowerCase()
    );
    
    if (isDuplicate) {
      toast.error("This tag already exists for this lead");
      return;
    }
    
    setIsSubmitting(true);

    try {
      if (isNewLead && onAddTagForNewLead) {
        onAddTagForNewLead(trimmedName);
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

      const { data: tag, error: tagError } = await supabase
        .from('tags')
        .insert({
          name: trimmedName,
          user_id: userData.user.id
        })
        .select()
        .single();

      if (tagError) throw tagError;

      const { data: existingTags, error: checkError } = await supabase
        .from('lead_tags')
        .select('tag_id')
        .eq('lead_id', leadId)
        .eq('tag_id', tag.id);
        
      if (checkError) throw checkError;
      
      if (existingTags && existingTags.length > 0) {
        toast.error("This tag is already associated with this lead");
        return;
      }

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
    
    const trimmedName = data.name.trim();
    
    if (!trimmedName) {
      toast.error("Tag name cannot be empty");
      return;
    }
    
    if (trimmedName.length > MAX_TAG_LENGTH) {
      toast.error(`Tag name must be ${MAX_TAG_LENGTH} characters or less`);
      return;
    }
    
    const isDuplicate = tags.some(tag => 
      tag.name.toLowerCase() === trimmedName.toLowerCase() && 
      tag.id !== editingTag.id
    );
    
    if (isDuplicate) {
      toast.error("This tag already exists for this lead");
      return;
    }
    
    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('tags')
        .update({
          name: trimmedName
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

  const openAddTagDialog = () => {
    setIsAddingTag(true);
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
              maxLength={MAX_TAG_LENGTH}
            />
          </DialogContent>
        </Dialog>
      </div>
      
      {tags.length > 0 ? (
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
      ) : (
        <EmptyState onAddClick={openAddTagDialog} />
      )}

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
              maxLength={MAX_TAG_LENGTH}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
