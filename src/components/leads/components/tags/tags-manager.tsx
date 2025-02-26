
import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TagForm } from "./tag-form";
import { TagBadge } from "./tag-badge";
import { Tag, TagColor } from "@/types/tag-types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface TagsManagerProps {
  leadId: string;
  tags: Tag[];
}

interface CreateTagData {
  name: string;
  color: TagColor;
}

export function TagsManager({ leadId, tags }: TagsManagerProps) {
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const queryClient = useQueryClient();

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['leads'] });
    queryClient.invalidateQueries({ queryKey: ['lead_activities', leadId] });
  };

  const handleCreateTag = async (data: CreateTagData) => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) {
        toast.error("You must be logged in to create tags");
        return;
      }

      const { data: tag, error: tagError } = await supabase
        .from('tags')
        .insert({
          name: data.name,
          color: data.color,
          user_id: user.data.user.id
        })
        .select()
        .single();

      if (tagError) throw tagError;

      const { error: linkError } = await supabase
        .from('lead_tags')
        .insert([{ lead_id: leadId, tag_id: tag.id }]);

      if (linkError) throw linkError;

      toast.success("Tag added successfully");
      setIsAddingTag(false);
      invalidateQueries();
    } catch (error) {
      console.error('Error creating tag:', error);
      toast.error("Failed to create tag");
    }
  };

  const handleUpdateTag = async (data: CreateTagData) => {
    if (!editingTag) return;

    try {
      const { error } = await supabase
        .from('tags')
        .update({
          name: data.name,
          color: data.color
        })
        .eq('id', editingTag.id);

      if (error) throw error;

      toast.success("Tag updated successfully");
      setEditingTag(null);
      invalidateQueries();
    } catch (error) {
      console.error('Error updating tag:', error);
      toast.error("Failed to update tag");
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('lead_tags')
        .delete()
        .eq('lead_id', leadId)
        .eq('tag_id', tagId);

      if (error) throw error;

      toast.success("Tag removed successfully");
      invalidateQueries();
    } catch (error) {
      console.error('Error removing tag:', error);
      toast.error("Failed to remove tag");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Tags</h3>
        <Dialog open={isAddingTag} onOpenChange={setIsAddingTag}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              <PlusCircle className="w-4 h-4 mr-2" />
              Add Tag
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Tag</DialogTitle>
            </DialogHeader>
            <TagForm onSubmit={handleCreateTag} />
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
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
