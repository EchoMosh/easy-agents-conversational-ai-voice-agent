
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { FileUploader } from "@/components/knowledge/file-uploader";
import { DocumentList } from "@/components/knowledge/document-list";
import { Upload, FileText, AlertCircle, Link2, Type, FileIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { uploadDocument, uploadTextDocument, uploadUrlDocument } from "@/utils/knowledge-api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function KnowledgePage() {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // File upload state
  const [fileTitle, setFileTitle] = useState("");
  const [fileDescription, setFileDescription] = useState("");
  
  // URL import state
  const [url, setUrl] = useState("");
  const [urlTitle, setUrlTitle] = useState("");
  const [urlDescription, setUrlDescription] = useState("");
  
  // Text entry state
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [textDescription, setTextDescription] = useState("");

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

  const handleUrlSubmit = async () => {
    if (!url) {
      toast({
        variant: "destructive",
        title: "URL required",
        description: "Please enter a URL to import",
      });
      return;
    }

    if (!urlTitle) {
      toast({
        variant: "destructive",
        title: "Title required",
        description: "Please provide a title for this URL",
      });
      return;
    }

    setIsUploading(true);

    try {
      await uploadUrlDocument(url, {
        title: urlTitle,
        description: urlDescription || undefined
      });

      toast({
        title: "URL imported",
        description: "The URL content has been imported successfully",
      });

      // Reset form
      setUrl("");
      setUrlTitle("");
      setUrlDescription("");
      
      // Trigger refresh of document list
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error importing URL:", error);
      toast({
        variant: "destructive",
        title: "Import failed",
        description: "There was an error importing the URL content",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleTextSubmit = async () => {
    if (!textTitle) {
      toast({
        variant: "destructive",
        title: "Title required",
        description: "Please provide a title for this text document",
      });
      return;
    }

    if (!textContent) {
      toast({
        variant: "destructive",
        title: "Content required",
        description: "Please provide some text content",
      });
      return;
    }

    setIsUploading(true);

    try {
      await uploadTextDocument(textContent, {
        title: textTitle,
        description: textDescription || undefined
      });

      toast({
        title: "Text saved",
        description: "Your text has been saved successfully",
      });

      // Reset form
      setTextTitle("");
      setTextContent("");
      setTextDescription("");
      
      // Trigger refresh of document list
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      console.error("Error saving text:", error);
      toast({
        variant: "destructive",
        title: "Save failed",
        description: "There was an error saving your text",
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
              <CardTitle className="text-xl">Add Knowledge</CardTitle>
              <CardDescription>
                Add documents to create your knowledge base
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="file" className="w-full">
                <TabsList className="grid grid-cols-3 mb-4">
                  <TabsTrigger value="file" className="flex items-center gap-1">
                    <FileIcon className="h-4 w-4" />
                    <span>File</span>
                  </TabsTrigger>
                  <TabsTrigger value="url" className="flex items-center gap-1">
                    <Link2 className="h-4 w-4" />
                    <span>URL</span>
                  </TabsTrigger>
                  <TabsTrigger value="text" className="flex items-center gap-1">
                    <Type className="h-4 w-4" />
                    <span>Text</span>
                  </TabsTrigger>
                </TabsList>
                
                {/* File Upload Tab */}
                <TabsContent value="file" className="space-y-4">
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
                </TabsContent>
                
                {/* URL Import Tab */}
                <TabsContent value="url" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="url">URL</Label>
                    <Input
                      id="url"
                      placeholder="https://example.com/article"
                      type="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="urlTitle">Title</Label>
                    <Input
                      id="urlTitle"
                      placeholder="Title for this URL"
                      value={urlTitle}
                      onChange={(e) => setUrlTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="urlDescription">Description</Label>
                    <Textarea
                      id="urlDescription"
                      placeholder="Brief description of this URL content"
                      value={urlDescription}
                      onChange={(e) => setUrlDescription(e.target.value)}
                      className="min-h-[100px]"
                    />
                  </div>
                  <Button
                    className="w-full mt-2"
                    onClick={handleUrlSubmit}
                    disabled={isUploading}
                  >
                    <Link2 className="mr-2 h-4 w-4" />
                    {isUploading ? "Importing..." : "Import URL"}
                  </Button>
                  
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>URL Import</AlertTitle>
                    <AlertDescription className="text-sm">
                      Import content from web pages, articles, or documents available online
                    </AlertDescription>
                  </Alert>
                </TabsContent>
                
                {/* Text Entry Tab */}
                <TabsContent value="text" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="textTitle">Title</Label>
                    <Input
                      id="textTitle"
                      placeholder="Title for this text"
                      value={textTitle}
                      onChange={(e) => setTextTitle(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="textContent">Content</Label>
                    <Textarea
                      id="textContent"
                      placeholder="Enter your text content here"
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      className="min-h-[200px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="textDescription">Description (Optional)</Label>
                    <Textarea
                      id="textDescription"
                      placeholder="Brief description of this text"
                      value={textDescription}
                      onChange={(e) => setTextDescription(e.target.value)}
                      className="min-h-[80px]"
                    />
                  </div>
                  <Button
                    className="w-full mt-2"
                    onClick={handleTextSubmit}
                    disabled={isUploading}
                  >
                    <Type className="mr-2 h-4 w-4" />
                    {isUploading ? "Saving..." : "Save Text"}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
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
