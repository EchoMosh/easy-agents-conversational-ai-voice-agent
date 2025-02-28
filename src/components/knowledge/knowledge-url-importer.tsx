
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Link2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { uploadUrlDocument } from "@/utils/knowledge-api";

interface KnowledgeUrlImporterProps {
  onSuccess: () => void;
}

export function KnowledgeUrlImporter({ onSuccess }: KnowledgeUrlImporterProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [url, setUrl] = useState("");
  const [urlTitle, setUrlTitle] = useState("");
  const [urlDescription, setUrlDescription] = useState("");

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
      
      // Call success callback
      onSuccess();
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

  return (
    <div className="space-y-4">
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
    </div>
  );
}
