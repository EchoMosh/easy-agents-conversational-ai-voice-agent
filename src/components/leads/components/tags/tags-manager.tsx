import { useState, useEffect } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TagForm } from "./tag-form";
import { TagBadge } from "./tag-badge";
import { Tag } from "@/types/tag-types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { EmptyState } from "./empty-state";
import { useWorkspace } from "@/context/workspace-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TagsManagerProps {
  leadId: string;
  tags: Tag[];
  existingTags: Tag[];
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
  existingTags,
  isNewLead = false,
  onAddTagForNewLead,
  onRemoveTagForNewLead,
}: TagsManagerProps) {
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [tagInputValue, setTagInputValue] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const { currentWorkspace } = useWorkspace();

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["leads"] });
    queryClient.invalidateQueries({ queryKey: ["lead_activities", leadId] });
    queryClient.invalidateQueries({ queryKey: ["tags", currentWorkspace?.id] });
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

    const isDuplicate = tags.some(
      (tag) => tag.name.toLowerCase() === trimmedName.toLowerCase(),
    );

    if (isDuplicate) {
      toast.error("This tag already exists for this lead");
      return;
    }

    setIsSubmitting(true);

    try {
      // Handle both new and existing leads consistently
      if (onAddTagForNewLead) {
        onAddTagForNewLead(trimmedName);
        setTagInputValue(""); // Ensure input is cleared
        setIsAddingTag(false);
        setIsSubmitting(false);
        return;
      }

      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError) throw userError;

      if (!userData.user) {
        toast.error("You must be logged in to create tags");
        return;
      }

      const { data: tag, error: tagError } = await supabase
        .from("tags")
        .insert({
          name: trimmedName,
          user_id: userData.user.id,
          workspace_id: currentWorkspace?.id, // Include workspace_id
        })
        .select()
        .single();

      if (tagError) throw tagError;

      const { data: existingTagsData, error: checkError } = await supabase
        .from("lead_tags")
        .select("tag_id")
        .eq("lead_id", leadId)
        .eq("tag_id", tag.id);

      if (checkError) throw checkError;

      if (existingTagsData && existingTagsData.length > 0) {
        toast.error("This tag is already associated with this lead");
        return;
      }

      const { error: linkError } = await supabase.from("lead_tags").insert({
        lead_id: leadId,
        tag_id: tag.id,
      });

      if (linkError) throw linkError;

      toast.success("Tag added successfully");
      setIsAddingTag(false);
      invalidateQueries();
    } catch (error: any) {
      console.error("Error creating tag:", error);
      toast.error(error.message || "Failed to create tag");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (onRemoveTagForNewLead) {
        onRemoveTagForNewLead(tagId);
        setIsSubmitting(false);
        return;
      }

      const { error } = await supabase
        .from("lead_tags")
        .delete()
        .eq("lead_id", leadId)
        .eq("tag_id", tagId);

      if (error) throw error;

      toast.success("Tag removed successfully");
      invalidateQueries();
    } catch (error: any) {
      console.error("Error removing tag:", error);
      toast.error(error.message || "Failed to remove tag");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddTagDialog = () => {
    setIsAddingTag(true);
  };

  const handleSelectExistingTag = async (tag: Tag) => {
    if (onAddTagForNewLead) {
      onAddTagForNewLead(tag.name);
      return;
    }

    try {
      const { data: existingTagLinks, error: checkError } = await supabase
        .from("lead_tags")
        .select("tag_id")
        .eq("lead_id", leadId)
        .eq("tag_id", tag.id);

      if (checkError) throw checkError;

      if (existingTagLinks && existingTagLinks.length > 0) {
        toast.error("This tag is already associated with this lead");
        return;
      }

      const { error: linkError } = await supabase.from("lead_tags").insert({
        lead_id: leadId,
        tag_id: tag.id,
      });

      if (linkError) throw linkError;

      toast.success("Tag added successfully");
      invalidateQueries();
    } catch (error: any) {
      console.error("Error adding existing tag:", error);
      toast.error(error.message || "Failed to add tag");
    }
  };

  return (
    <div className="space-y-4">
      <div className="mb-3">
        <div className="relative flex gap-2">
          <Input
            placeholder="Enter tag name"
            value={tagInputValue}
            onChange={(e) => {
              const value = e.target.value;
              setTagInputValue(value);
              if (value) {
                setIsAddingTag(true);
              } else {
                setIsAddingTag(false);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.currentTarget.value) {
                handleCreateTag({ name: e.currentTarget.value });
                setTagInputValue("");
                setIsAddingTag(false);
                e.preventDefault();
              }
            }}
            className="h-9 text-sm border border-gray-300 bg-white hover:bg-gray-50 focus-visible:ring-1 transition-colors flex-1"
          />
          <Button
            type="button"
            onClick={() => {
              if (tagInputValue.trim()) {
                handleCreateTag({ name: tagInputValue.trim() });
                setTagInputValue("");
                setIsAddingTag(false);
              }
            }}
            disabled={!tagInputValue.trim() || isSubmitting}
            className="h-9 px-3 text-sm bg-blue-600 hover:bg-blue-700 text-white"
          >
            Add
          </Button>
          {isAddingTag && existingTags.length > 0 && (
            <div className="absolute top-10 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-sm max-h-60 overflow-auto z-50">
              {existingTags
                .filter(
                  (tag) =>
                    !tags.some((t) => t.id === tag.id) &&
                    tag.name
                      .toLowerCase()
                      .includes(tagInputValue.toLowerCase()),
                )
                .map((tag) => (
                  <div
                    key={tag.id}
                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                    onClick={() => {
                      handleSelectExistingTag(tag);
                      setTagInputValue("");
                      setIsAddingTag(false);
                    }}
                  >
                    {tag.name}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      {tags.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <TagBadge
              key={tag.id}
              tag={tag}
              onDelete={() => handleDeleteTag(tag.id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState onAddClick={openAddTagDialog} />
      )}
    </div>
  );
}
