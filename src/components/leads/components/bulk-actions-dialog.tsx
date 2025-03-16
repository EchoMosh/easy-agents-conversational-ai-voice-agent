
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MoveRight, Tag } from "lucide-react";
import { BulkActionsDialogProps } from "../types/lead-types";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Pipeline, convertJsonToPipeline } from "@/types/pipeline";

export function BulkActionsDialog({
  isOpen,
  onOpenChange,
  selectedCount,
  onDelete,
  isDeleting,
  onMoveToPipeline,
  onAddVariables,
  pipelines,
}: BulkActionsDialogProps) {
  const [selectedPipeline, setSelectedPipeline] = useState<string | undefined>(undefined);
  const [fullPipelines, setFullPipelines] = useState<Pipeline[]>([]);
  
  // Fetch full pipeline data when opened
  useEffect(() => {
    if (isOpen) {
      fetchFullPipelineData();
    }
  }, [isOpen]);
  
  const fetchFullPipelineData = async () => {
    try {
      const { data, error } = await supabase
        .from("pipelines")
        .select("*");
        
      if (error) throw error;
      
      const processedPipelines = (data || []).map(convertJsonToPipeline);
      setFullPipelines(processedPipelines);
    } catch (error) {
      console.error("Error fetching pipeline data:", error);
    }
  };
  
  const handlePipelineChange = (value: string) => {
    setSelectedPipeline(value);
    // Fix: toast.success only accepts a single string argument
    toast.success(value === "none" ? "No Pipeline selected" : `Pipeline selected: ${pipelines.find(p => p.id === value)?.name || value}`);
  };
  
  const handleMoveLeads = () => {
    if (selectedPipeline) {
      // Get the target pipeline to determine first stage
      const targetPipeline = fullPipelines.find(p => p.id === selectedPipeline);
      let firstStage = "New"; // Default fallback
      
      // If the pipeline has columns, use the first one's title
      if (targetPipeline && targetPipeline.columns.length > 0) {
        firstStage = targetPipeline.columns[0].title;
      }
      
      onMoveToPipeline(selectedPipeline, firstStage);
      // Fix: toast.success with single argument
      toast.success(`${selectedCount} lead${selectedCount !== 1 ? 's' : ''} moved successfully`);
      onOpenChange(false);
    } else {
      toast.error("Please select a pipeline first");
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bulk Actions for {selectedCount} Lead{selectedCount !== 1 ? 's' : ''}</DialogTitle>
          <DialogDescription>
            Apply changes to multiple leads at once
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="move" className="w-full mt-4">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="move">Move</TabsTrigger>
            <TabsTrigger value="variables">Variables</TabsTrigger>
          </TabsList>
          
          <TabsContent value="move" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="movePipeline">Move to Pipeline</Label>
              <Select value={selectedPipeline} onValueChange={handlePipelineChange}>
                <SelectTrigger id="movePipeline" className="w-full">
                  <SelectValue placeholder="Select a pipeline" />
                </SelectTrigger>
                <SelectContent 
                  position="popper" 
                  sideOffset={5} 
                  className="bg-background z-[9999]" 
                  align="center"
                >
                  <SelectGroup>
                    <SelectItem value="none">No Pipeline</SelectItem>
                    {pipelines.map((pipeline) => (
                      <SelectItem key={pipeline.id} value={pipeline.id}>
                        {pipeline.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
              <div className="pt-2">
                <Button 
                  className="w-full" 
                  type="button"
                  onClick={handleMoveLeads}
                >
                  <MoveRight className="h-4 w-4 mr-2" />
                  Move Leads
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="variables" className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Add variables to all selected leads at once
              </p>
              <div className="pt-2">
                <Button 
                  className="w-full" 
                  type="button"
                  onClick={() => {
                    onAddVariables();
                    // Fix: toast.success with single argument
                    toast.success(`Adding variables to ${selectedCount} lead${selectedCount !== 1 ? 's' : ''}`);
                    onOpenChange(false);
                  }}
                >
                  <Tag className="h-4 w-4 mr-2" />
                  Add Variables
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <DialogFooter className="mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
