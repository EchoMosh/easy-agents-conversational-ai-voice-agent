
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Type } from "lucide-react";
import { uploadTextDocument } from "@/utils/knowledge-api";

interface KnowledgeTextEntryProps {
  onSuccess: () => void;
}

export function KnowledgeTextEntry({ onSuccess }: KnowledgeTextEntryProps) {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [textTitle, setTextTitle] = useState("");
  const [textContent, setTextContent] = useState("");
  const [textDescription, setTextDescription] = useState("");

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
      
      // Call success callback
      onSuccess();
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
    <div className="space-y-4">
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
    </div>
  );
}
