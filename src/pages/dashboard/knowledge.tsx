
import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DocumentList } from "@/components/knowledge/document-list";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KnowledgeFileUploader } from "@/components/knowledge/knowledge-file-uploader";
import { KnowledgeUrlImporter } from "@/components/knowledge/knowledge-url-importer";
import { KnowledgeTextEntry } from "@/components/knowledge/knowledge-text-entry";

export default function KnowledgePage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const handleUploadSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
    setIsDialogOpen(false);
  };

  // Listen for create-knowledge events from the header button
  useEffect(() => {
    const handleCreateKnowledge = () => {
      setIsDialogOpen(true);
    };
    window.addEventListener("create-knowledge", handleCreateKnowledge);
    return () => {
      window.removeEventListener("create-knowledge", handleCreateKnowledge);
    };
  }, []);
  
  return <div className="flex flex-col w-full items-center mt-10">
      <div className="flex flex-col space-y-6 w-[70%]">
        <div className="flex justify-end">
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create Knowledge
          </Button>
        </div>
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl">Your Knowledge Base</CardTitle>
            <CardDescription>
              Manage your uploaded documents, URLs and text entries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentList refreshTrigger={refreshTrigger} />
          </CardContent>
        </Card>
      </div>

      {/* Create Knowledge Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Knowledge</DialogTitle>
            <DialogDescription>
              Add documents, URLs, or text to your knowledge base
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Tabs defaultValue="file" className="w-full">
              <TabsList className="grid grid-cols-3 mb-4">
                <TabsTrigger value="file" className="flex items-center gap-1">
                  <span>File Upload</span>
                </TabsTrigger>
                <TabsTrigger value="url" className="flex items-center gap-1">
                  <span>URL Import</span>
                </TabsTrigger>
                <TabsTrigger value="text" className="flex items-center gap-1">
                  <span>Text Entry</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="file">
                <KnowledgeFileUploader onSuccess={handleUploadSuccess} />
              </TabsContent>

              <TabsContent value="url">
                <KnowledgeUrlImporter onSuccess={handleUploadSuccess} />
              </TabsContent>

              <TabsContent value="text">
                <KnowledgeTextEntry onSuccess={handleUploadSuccess} />
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
}
