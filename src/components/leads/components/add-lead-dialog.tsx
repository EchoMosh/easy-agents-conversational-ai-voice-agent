
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Upload, UserPlus } from "lucide-react";
import { NewLeadForm } from "@/components/leads/new-lead-form";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface AddLeadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddLeadDialog({ isOpen, onOpenChange, onSuccess }: AddLeadDialogProps) {
  const [activeTab, setActiveTab] = useState<string>("single");
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <Button onClick={() => onOpenChange(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Add Lead
      </Button>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add Leads</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="single" value={activeTab} onValueChange={handleTabChange} className="w-full mt-2">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="single" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span>Add Single Lead</span>
            </TabsTrigger>
            <TabsTrigger value="bulk" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              <span>Bulk Upload</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="single" className="mt-4">
            <NewLeadForm onSuccess={() => {
              onOpenChange(false);
              onSuccess();
            }} />
          </TabsContent>
          
          <TabsContent value="bulk" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Bulk Upload Leads</CardTitle>
                <CardDescription>
                  Upload a CSV file with multiple leads to add them all at once
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Upload className="h-8 w-8 text-gray-400" />
                    <p className="text-sm font-medium">
                      Drag and drop a CSV file here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Your file should include headers: name, email, phone, status
                    </p>
                    <Button variant="outline" size="sm" className="mt-2">
                      Select File
                    </Button>
                  </div>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  <p className="mb-1 font-medium">File Requirements:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>CSV format only</li>
                    <li>Maximum 1000 leads per upload</li>
                    <li>Required fields: name, email</li>
                    <li>Optional fields: phone, status, source</li>
                  </ul>
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button onClick={() => onOpenChange(false)} variant="outline" className="mr-2">
                    Cancel
                  </Button>
                  <Button disabled className="ml-2">
                    Upload Leads
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
