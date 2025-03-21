
import { FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onAddClick: () => void;
}

export function EmptyState({ onAddClick }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg text-center border-2 border-dashed border-gray-200">
      <div className="rounded-full bg-blue-50 p-3 mb-4">
        <Upload className="h-8 w-8 text-blue-500" />
      </div>
      <h3 className="text-lg font-medium text-gray-800 mb-2">No CSV file selected</h3>
      <p className="text-base text-gray-600 mb-5 max-w-md">
        Upload a CSV file to import multiple leads at once
      </p>
      <Button
        onClick={onAddClick}
        className="flex items-center"
      >
        <FileText className="mr-2 h-4 w-4" />
        Select a CSV file
      </Button>
    </div>
  );
}
