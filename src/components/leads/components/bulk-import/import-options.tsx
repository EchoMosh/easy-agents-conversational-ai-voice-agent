import React, { useState, useEffect } from "react";
import { Plus, X, Tag, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useWorkspace } from "@/context/workspace-context";

interface ImportOptionsProps {
  fileName: string;
  leadCount: number;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  source: string;
  setSource: (source: string) => void;
  onNext: () => void;
  onBack: () => void;
}

interface TagData {
  id: string;
  name: string;
  color: string | null;
}

const TAG_COLORS: Record<string, string> = {
  red: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  green: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  yellow:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  purple:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  pink: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
  indigo:
    "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  gray: "bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300",
};

const DEFAULT_TAG_STYLE =
  "bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary";

function getTagStyle(color: string | null): string {
  if (!color) return DEFAULT_TAG_STYLE;
  return TAG_COLORS[color] || DEFAULT_TAG_STYLE;
}

const SUGGESTED_SOURCES = [
  "CSV Import",
  "LinkedIn",
  "Website",
  "Referral",
  "Trade Show",
  "Cold Outreach",
  "Ads Campaign",
];

export function ImportOptions({
  fileName,
  leadCount,
  selectedTags,
  setSelectedTags,
  source,
  setSource,
  onNext,
  onBack,
}: ImportOptionsProps) {
  const [tags, setTags] = useState<TagData[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  const [newTagName, setNewTagName] = useState("");
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const { currentWorkspace } = useWorkspace();

  useEffect(() => {
    const fetchTags = async () => {
      setIsLoadingTags(true);
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session?.user?.id) return;

        let query = supabase
          .from("tags")
          .select("id, name, color")
          .eq("user_id", sessionData.session.user.id);

        if (currentWorkspace?.id) {
          query = query.eq("workspace_id", currentWorkspace.id);
        }

        const { data, error } = await query.order("name");
        if (error) {
          console.error("Error fetching tags:", error);
          return;
        }
        setTags(data || []);
      } catch (error) {
        console.error("Error fetching tags:", error);
      } finally {
        setIsLoadingTags(false);
      }
    };

    fetchTags();
  }, [currentWorkspace?.id]);

  const toggleTag = (tagId: string) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter((id) => id !== tagId));
    } else {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  const createTag = async () => {
    const name = newTagName.trim();
    if (!name) return;

    setIsCreatingTag(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user?.id) return;

      const { data, error } = await supabase
        .from("tags")
        .insert({
          name,
          user_id: sessionData.session.user.id,
          workspace_id: currentWorkspace?.id || null,
        })
        .select("id, name, color")
        .single();

      if (error) {
        console.error("Error creating tag:", error);
        return;
      }

      if (data) {
        setTags((prev) => [...prev, data]);
        setSelectedTags([...selectedTags, data.id]);
        setNewTagName("");
      }
    } catch (error) {
      console.error("Error creating tag:", error);
    } finally {
      setIsCreatingTag(false);
    }
  };

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col p-6 gap-6">
        {/* Summary */}
        <div className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-3">
          <div className="text-sm text-muted-foreground">
            Importing{" "}
            <span className="font-semibold text-foreground">
              {leadCount} leads
            </span>{" "}
            from <span className="font-medium text-foreground">{fileName}</span>
          </div>
        </div>

        {/* Source */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">
            Source
            <span className="text-muted-foreground font-normal ml-1.5">
              (optional)
            </span>
          </Label>
          <Input
            placeholder="Where did these leads come from?"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="h-10"
          />
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_SOURCES.map((s) => (
              <button
                key={s}
                onClick={() => setSource(s)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                  source === s
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">
            Tags
            <span className="text-muted-foreground font-normal ml-1.5">
              (optional -- applied to all imported leads)
            </span>
          </Label>

          {isLoadingTags ? (
            <div className="text-sm text-muted-foreground py-2">
              Loading tags...
            </div>
          ) : tags.length === 0 ? (
            <p className="text-sm text-muted-foreground py-1">
              No tags yet. Create one below.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => {
                const isSelected = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      isSelected
                        ? getTagStyle(tag.color) + " ring-2 ring-primary/30"
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Tag className="h-3 w-3" />
                    {tag.name}
                    {isSelected && <X className="h-3 w-3 ml-0.5" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Create new tag */}
          <div className="flex gap-2">
            <Input
              placeholder="Create new tag..."
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  createTag();
                }
              }}
              className="h-9 text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={createTag}
              disabled={!newTagName.trim() || isCreatingTag}
              className="h-9 px-3"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-border flex justify-between">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Button onClick={onNext}>Import {leadCount} Leads</Button>
        </div>
      </div>
    </ScrollArea>
  );
}
