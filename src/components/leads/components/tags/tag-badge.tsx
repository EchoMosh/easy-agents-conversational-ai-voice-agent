
import { Tag as TagIcon, X, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag } from "@/types/tag-types";

interface TagBadgeProps {
  tag: Tag;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

export function TagBadge({ tag, onEdit, onDelete, showActions = true }: TagBadgeProps) {
  return (
    <Badge variant="secondary" className="py-1.5 px-3 text-sm">
      <TagIcon className="w-3.5 h-3.5 mr-2" />
      {tag.name}
      {showActions && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="h-4 w-4 p-0 ml-2 hover:bg-transparent"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
          >
            <X className="h-3 w-3" />
          </Button>
        </>
      )}
    </Badge>
  );
}
