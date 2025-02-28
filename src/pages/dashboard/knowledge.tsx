
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploader } from "@/components/knowledge/file-uploader";
import { DocumentList } from "@/components/knowledge/document-list";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function KnowledgePage() {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // Upload file to storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('knowledge')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save document metadata
      const { error: dbError } = await supabase
        .from('knowledge_documents')
        .insert({
          title: title || file.name,
          description,
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
        });

      if (dbError) throw dbError;

      toast({
        title: "Document uploaded",
        description: "Your document has been uploaded successfully",
      });

      // Reset form
      setTitle("");
      setDescription("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Trigger refresh of document list
      setRefreshTrigger(prev => prev + 1);

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
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Upload Document</CardTitle>
              <CardDescription>
                Upload documents to create your knowledge base
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Document title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of this document"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
              <FileUploader
                ref={fileInputRef}
                onChange={handleFileChange}
                isUploading={isUploading}
              />
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? "Uploading..." : "Upload Document"}
              </Button>
            </CardFooter>
          </Card>
          
          <Alert className="mt-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Supported file types</AlertTitle>
            <AlertDescription className="text-sm">
              PDF, DOCX, TXT, CSV, XLSX (max 10MB)
            </AlertDescription>
          </Alert>
        </div>
        
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Your Knowledge Base</CardTitle>
              <CardDescription>
                Manage your uploaded documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentList refreshTrigger={refreshTrigger} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
