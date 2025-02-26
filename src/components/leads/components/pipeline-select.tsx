
import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pipeline } from "@/types/pipeline";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { defaultColumns } from "@/hooks/pipeline/default-columns";

interface PipelineSelectProps {
  pipelines: Pipeline[];
  selectedPipelineId: string;
  onPipelineChange: (value: string) => void;
  refetchPipelines: () => void;
}

export function PipelineSelect({ pipelines, selectedPipelineId, onPipelineChange, refetchPipelines }: PipelineSelectProps) {
  const [showCreatePipeline, setShowCreatePipeline] = useState(false);
  const [newPipelineName, setNewPipelineName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreatePipeline = async () => {
    if (!newPipelineName.trim()) {
      toast.error("Please enter a pipeline name");
      return;
    }

    setIsCreating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user found");

      const { data: pipeline, error } = await supabase
        .from("pipelines")
        .insert({
          name: newPipelineName,
          user_id: user.id,
          columns: defaultColumns
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Pipeline created successfully");
      setShowCreatePipeline(false);
      setNewPipelineName("");
      refetchPipelines();
      if (pipeline) {
        onPipelineChange(pipeline.id);
      }
    } catch (error) {
      console.error("Error creating pipeline:", error);
      toast.error("Failed to create pipeline");
    } finally {
      setIsCreating(false);
    }
  };

  if (pipelines.length === 0) {
    return (
      <div className="space-y-4">
        <Label htmlFor="pipeline" className="text-sm font-medium text-muted-foreground">Pipeline</Label>
        <div className="text-sm text-muted-foreground">
          No pipelines found. You need to create a pipeline first.
        </div>
        <Button onClick={() => setShowCreatePipeline(true)} variant="default">
          Create Pipeline
        </Button>

        <Dialog open={showCreatePipeline} onOpenChange={setShowCreatePipeline}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Pipeline</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Pipeline Name</Label>
                <Input
                  id="name"
                  placeholder="Enter pipeline name..."
                  value={newPipelineName}
                  onChange={(e) => setNewPipelineName(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreatePipeline(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreatePipeline} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Pipeline"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="pipeline" className="text-sm font-medium text-muted-foreground">Pipeline</Label>
      <Select value={selectedPipelineId} onValueChange={onPipelineChange} required>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a pipeline" />
        </SelectTrigger>
        <SelectContent>
          {pipelines.map((pipeline) => (
            <SelectItem key={pipeline.id} value={pipeline.id}>
              {pipeline.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
