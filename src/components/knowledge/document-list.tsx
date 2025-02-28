
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { KnowledgeDocument } from "@/types/supabase-extended";
import { fetchDocuments, deleteDocument } from "@/utils/knowledge-api";
import { SearchBar } from "./search-bar";
import { EmptyState } from "./empty-state";
import { DocumentItem } from "./document-item";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { LoadingState } from "./loading-state";

interface DocumentListProps {
  refreshTrigger: number;
}

export function DocumentList({ refreshTrigger }: DocumentListProps) {
  const { toast } = useToast();
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [documentToDelete, setDocumentToDelete] = useState<KnowledgeDocument | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [filteredDocuments, setFilteredDocuments] = useState<KnowledgeDocument[]>([]);

  useEffect(() => {
    const getDocuments = async () => {
      setIsLoading(true);
      try {
        const data = await fetchDocuments();
        setDocuments(data);
      } catch (error) {
        console.error("Error fetching documents:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load documents",
        });
      } finally {
        setIsLoading(false);
      }
    };

    getDocuments();
  }, [toast, refreshTrigger]);

  useEffect(() => {
    if (searchQuery) {
      const filtered = documents.filter(
        doc =>
          doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (doc.description && doc.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredDocuments(filtered);
    } else {
      setFilteredDocuments(documents);
    }
  }, [searchQuery, documents]);

  const handleDownload = async (document: KnowledgeDocument) => {
    try {
      // For now, let's add a placeholder until download is implemented
      toast({
        title: "Download not available",
        description: "The download functionality is not yet implemented",
      });
      // When implemented, it would look like:
      // const blob = await downloadDocument(document.id);
      // const url = URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.href = url;
      // a.download = document.title;
      // document.body.appendChild(a);
      // a.click();
      // URL.revokeObjectURL(url);
      // a.remove();
    } catch (error) {
      console.error("Error downloading document:", error);
      toast({
        variant: "destructive",
        title: "Download failed",
        description: "There was an error downloading the document",
      });
    }
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;

    try {
      await deleteDocument(documentToDelete.id);
      setDocuments(documents.filter(doc => doc.id !== documentToDelete.id));
      
      toast({
        title: "Document deleted",
        description: "The document has been deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting document:", error);
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: "There was an error deleting the document",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const confirmDelete = (document: KnowledgeDocument) => {
    setDocumentToDelete(document);
    setIsDeleteDialogOpen(true);
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="space-y-4">
      <SearchBar value={searchQuery} onChange={setSearchQuery} />

      {filteredDocuments.length === 0 ? (
        <EmptyState hasDocuments={documents.length > 0} />
      ) : (
        <div className="space-y-3">
          {filteredDocuments.map((doc) => (
            <DocumentItem
              key={doc.id}
              document={doc}
              onDownload={handleDownload}
              onDelete={confirmDelete}
            />
          ))}
        </div>
      )}

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        document={documentToDelete}
        onConfirm={handleDelete}
      />
    </div>
  );
}
