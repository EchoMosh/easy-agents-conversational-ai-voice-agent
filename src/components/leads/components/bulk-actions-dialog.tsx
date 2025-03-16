
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { MoveRight, RefreshCw, Tag } from "lucide-react";
import { BulkActionsDialogProps } from "../types/lead-types";
import { toast } from "sonner";

export function BulkActionsDialog({
  isOpen,
  onOpenChange,
  selectedCount,
  onDelete,
  isDeleting,
  onMoveToPipeline,
  onChangeStatus,
  onAddVariables,
  pipelines,
}: BulkActionsDialogProps) {
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bulk Actions for {selectedCount} Lead{selectedCount !== 1 ? 's' : ''}</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="move" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="move">Move</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="variables">Variables</TabsTrigger>
          </TabsList>
          
          <TabsContent value="move" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="movePipeline">Move to Pipeline</Label>
              <Select onValueChange={onMoveToPipeline}>
                <SelectTrigger id="movePipeline" className="w-full">
                  <SelectValue placeholder="Select a pipeline" />
                </SelectTrigger>
                <SelectContent>
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
                  onClick={() => {
                    onOpenChange(false);
                  }}
                >
                  <MoveRight className="h-4 w-4 mr-2" />
                  Move Leads
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="status" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="changeStatus">Change Status</Label>
              <Select onValueChange={onChangeStatus}>
                <SelectTrigger id="changeStatus" className="w-full">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Qualified">Qualified</SelectItem>
                    <SelectItem value="Proposal">Proposal</SelectItem>
                    <SelectItem value="Negotiation">Negotiation</SelectItem>
                    <SelectItem value="Won">Won</SelectItem>
                    <SelectItem value="Lost">Lost</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
              <div className="pt-2">
                <Button 
                  className="w-full" 
                  onClick={() => {
                    onOpenChange(false);
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Update Status
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
                  onClick={() => {
                    onAddVariables();
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
