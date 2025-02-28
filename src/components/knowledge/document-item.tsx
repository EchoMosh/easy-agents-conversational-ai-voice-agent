
import { FileText, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KnowledgeDocument } from "@/types/supabase-extended";

interface DocumentItemProps {
  document: KnowledgeDocument;
  onDownload: (document: KnowledgeDocument) => void;
  onDelete: (document: KnowledgeDocument) => void;
}

export function DocumentItem({ document, onDownload, onDelete }: DocumentItemProps) {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    else return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
      <div className="flex items-center space-x-4">
        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg">
          <FileText className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="font-medium">{document.title}</h3>
          <div className="flex gap-2 items-center text-xs text-gray-500">
            <span>{formatFileSize(document.file_size)}</span>
            <span>•</span>
            <span>
              {new Date(document.created_at).toLocaleDateString()}
            </span>
          </div>
          {document.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {document.description}
            </p>
          )}
        </div>
      </div>
      <div className="flex space-x-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDownload(document)}
          title="Download"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(document)}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
          title="Delete"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
