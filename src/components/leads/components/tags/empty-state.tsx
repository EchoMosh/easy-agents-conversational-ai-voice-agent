
import { Tag } from "lucide-react";

interface EmptyStateProps {
  onAddClick: () => void;
}

export function EmptyState({ onAddClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg text-center">
      <Tag className="h-10 w-10 text-gray-400 mb-3" />
      <p className="text-base text-gray-600 mb-2">No tags added yet</p>
      <p className="text-sm text-gray-500 mb-4">Click "Add Tag" to categorize this lead</p>
      <button
        onClick={onAddClick}
        className="text-sm text-blue-600 hover:text-blue-700"
      >
        Add your first tag
      </button>
    </div>
  );
}
