
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Upload, UserPlus } from "lucide-react";
import { NewLeadForm } from "@/components/leads/new-lead-form";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface AddLeadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddLeadDialog({ isOpen, onOpenChange, onSuccess }: AddLeadDialogProps) {
  const [mode, setMode] = useState<"single" | "bulk" | null>(null);
  
  const handleSelectMode = (selectedMode: "single" | "bulk") => {
    setMode(selectedMode);
  };

  const handleClose = () => {
    setMode(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <Button onClick={() => onOpenChange(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Add Lead
      </Button>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Add Leads</DialogTitle>
        </DialogHeader>
        
        {mode === null && (
          <div className="grid grid-cols-2 gap-4 py-4">
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary"
              onClick={() => handleSelectMode("single")}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 h-full">
                <UserPlus className="h-12 w-12 text-primary mb-3" />
                <h3 className="text-lg font-medium">Add Single Lead</h3>
                <p className="text-sm text-center text-muted-foreground mt-2">
                  Manually add a new lead with contact details
                </p>
              </CardContent>
            </Card>
            
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary"
              onClick={() => handleSelectMode("bulk")}
            >
              <CardContent className="flex flex-col items-center justify-center p-6 h-full">
                <Upload className="h-12 w-12 text-primary mb-3" />
                <h3 className="text-lg font-medium">Bulk Upload</h3>
                <p className="text-sm text-center text-muted-foreground mt-2">
                  Upload a CSV file with multiple leads
                </p>
              </CardContent>
            </Card>
          </div>
        )}
        
        {mode === "single" && (
          <div className="py-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setMode(null)} 
              className="mb-4"
            >
              ← Back to options
            </Button>
            <NewLeadForm onSuccess={() => {
              handleClose();
              onSuccess();
            }} />
          </div>
        )}
        
        {mode === "bulk" && (
          <div className="py-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setMode(null)} 
              className="mb-4"
            >
              ← Back to options
            </Button>
            
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
                <div className="flex flex-col items-center justify-center gap-2">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <p className="text-sm font-medium">
                    Drag and drop a CSV file here, or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground">
                    File should include: name, email, phone, status
                  </p>
                  <Button variant="outline" size="sm" className="mt-2">
                    Select File
                  </Button>
                </div>
              </div>
              
              <div className="text-xs text-muted-foreground">
                <p className="mb-1 font-medium">Requirements:</p>
                <ul className="list-disc pl-4 space-y-1">
                  <li>CSV format only</li>
                  <li>Required fields: name, email</li>
                  <li>Optional: phone, status, source</li>
                </ul>
              </div>
              
              <div className="flex justify-end pt-4">
                <Button onClick={handleClose} variant="outline" className="mr-2">
                  Cancel
                </Button>
                <Button disabled className="ml-2">
                  Upload Leads
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
