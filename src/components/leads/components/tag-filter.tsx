import { useState } from "react";
import { CheckIcon, PlusCircle, Tags, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tag } from "@/types/tag-types";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

interface TagFilterProps {
  tags: Tag[];
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

export function TagFilter({ tags, selectedTagIds, onChange }: TagFilterProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onChange([...selectedTagIds, tagId]);
    }
  };

  const clearFilters = () => {
    onChange([]);
    setOpen(false);
  };

  const getSelectedTagsLabel = () => {
    if (selectedTagIds.length === 0) {
      return "All Tags";
    }

    if (selectedTagIds.length === 1) {
      const tagName = tags.find((tag) => tag.id === selectedTagIds[0])?.name;
      return tagName || "1 Tag";
    }

    return `${selectedTagIds.length} Tags`;
  };

  return (
    <div className="w-64">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full justify-between"
          >
            <div className="flex items-center">
              <Tags className="mr-2 h-4 w-4" />
              <span>{getSelectedTagsLabel()}</span>
            </div>
            {selectedTagIds.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {selectedTagIds.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search tags..." />
            <CommandList>
              <CommandEmpty>No tags found</CommandEmpty>
              <CommandGroup>
                <ScrollArea className="h-[200px]">
                  {tags.map((tag) => {
                    const isSelected = selectedTagIds.includes(tag.id);
                    return (
                      <CommandItem
                        key={tag.id}
                        value={tag.name}
                        onSelect={() => handleSelect(tag.id)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center">
                          <span
                            className={`w-2 h-2 rounded-full mr-2 bg-${tag.color}-600`}
                          ></span>
                          <span>{tag.name}</span>
                        </div>
                        {isSelected && (
                          <CheckIcon className="h-4 w-4 text-primary" />
                        )}
                      </CommandItem>
                    );
                  })}
                </ScrollArea>
              </CommandGroup>
            </CommandList>
            {selectedTagIds.length > 0 && (
              <div className="border-t p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full flex items-center justify-center"
                  onClick={clearFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear filters
                </Button>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
