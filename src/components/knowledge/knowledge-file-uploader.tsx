
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileUploader } from "@/components/knowledge/file-uploader";
import { Upload, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { uploadDocument } from "@/utils/knowledge-api";

interface KnowledgeFileUploaderProps {
  onSuccess: () => void;
}

export function KnowledgeFileUploader({ onSuccess }: KnowledgeFileUploaderProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileTitle, setFileTitle] = useState("");
  const [fileDescription, setFileDescription] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > 10 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Maximum file size is 10MB",
      });
      return;
    }

    setIsUploading(true);

    try {
      await uploadDocument(file, {
        title: fileTitle || file.name,
        description: fileDescription || undefined
      });

      toast({
        title: "Document uploaded",
        description: "Your document has been uploaded successfully",
      });

      // Reset form
      setFileTitle("");
      setFileDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Call success callback
      onSuccess();

    } catch (error) {
      console.error("Error uploading document:", error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "There was an error uploading your document",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fileTitle">Title</Label>
        <Input
          id="fileTitle"
          placeholder="Document title"
          value={fileTitle}
          onChange={(e) => setFileTitle(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="fileDescription">Description</Label>
        <Textarea
          id="fileDescription"
          placeholder="Brief description of this document"
          value={fileDescription}
          onChange={(e) => setFileDescription(e.target.value)}
          className="min-h-[100px]"
        />
      </div>
      <FileUploader
        ref={fileInputRef}
        onChange={handleFileChange}
        isUploading={isUploading}
      />
      <Button
        className="w-full mt-2"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
      >
        <Upload className="mr-2 h-4 w-4" />
        {isUploading ? "Uploading..." : "Upload Document"}
      </Button>
      
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Supported file types</AlertTitle>
        <AlertDescription className="text-sm">
          PDF, DOCX, TXT, CSV, XLSX (max 10MB)
        </AlertDescription>
      </Alert>
    </div>
  );
}
