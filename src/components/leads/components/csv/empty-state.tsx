
import { FileText } from "lucide-react";

interface EmptyStateProps {
  onAddClick: () => void;
}

export function EmptyState({ onAddClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg text-center">
      <FileText className="h-10 w-10 text-gray-400 mb-3" />
      <p className="text-base text-gray-600 mb-2">No CSV file selected</p>
      <p className="text-sm text-gray-500 mb-4">Upload a CSV file to import multiple leads at once</p>
      <button
        onClick={onAddClick}
        className="text-sm text-blue-600 hover:text-blue-700"
      >
        Select a CSV file
      </button>
    </div>
  );
}
