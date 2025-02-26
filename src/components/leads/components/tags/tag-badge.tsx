
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

const colorStyles: Record<Tag['color'], string> = {
  gray: "bg-gray-100 hover:bg-gray-200 text-gray-700",
  red: "bg-red-100 hover:bg-red-200 text-red-700",
  yellow: "bg-yellow-100 hover:bg-yellow-200 text-yellow-700",
  green: "bg-green-100 hover:bg-green-200 text-green-700",
  blue: "bg-blue-100 hover:bg-blue-200 text-blue-700",
  purple: "bg-purple-100 hover:bg-purple-200 text-purple-700",
  pink: "bg-pink-100 hover:bg-pink-200 text-pink-700",
};

export function TagBadge({ tag, onEdit, onDelete, showActions = true }: TagBadgeProps) {
  return (
    <Badge variant="secondary" className={`py-1.5 px-3 text-sm border-0 ${colorStyles[tag.color]}`}>
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
