
import { FileText } from "lucide-react";

interface EmptyStateProps {
  hasDocuments: boolean;
}

export function EmptyState({ hasDocuments }: EmptyStateProps) {
  return (
    <div className="text-center py-12 border rounded-lg">
      <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">No documents found</h3>
      <p className="text-gray-500">
        {hasDocuments
          ? "No documents match your search criteria"
          : "Upload your first document to get started"}
      </p>
    </div>
  );
}
