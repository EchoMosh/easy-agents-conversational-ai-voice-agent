

import { Edit, X } from "lucide-react";
import { Tag } from "@/types/tag-types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Update the Tag type to make user_id optional
interface TagBadgeProps {
  tag: Omit<Tag, 'user_id'> & { user_id?: string };
  onEdit?: () => void;
  onDelete?: () => void;
}

export function TagBadge({ tag, onEdit, onDelete }: TagBadgeProps) {
  // Determine if tag is long and might need to be truncated
  const isLongTag = tag.name.length > 15;
  
  return (
    <div className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium bg-blue-50 border-blue-200 text-blue-800 gap-1.5 max-w-[200px]">
      {isLongTag ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="truncate">{tag.name}</span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tag.name}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <span>{tag.name}</span>
      )}
      
      {onEdit && (
        <button
          onClick={onEdit}
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <Edit className="h-3 w-3" />
        </button>
      )}
      
      {onDelete && (
        <button
          onClick={onDelete}
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
