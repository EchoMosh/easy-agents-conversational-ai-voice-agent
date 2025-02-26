
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";

interface PipelineNameProps {
  name: string;
  onEditPipelineName: (name: string) => void;
  onDeletePipeline: () => void;
}

export function PipelineName({ name, onEditPipelineName, onDeletePipeline }: PipelineNameProps) {
  const [editingPipelineName, setEditingPipelineName] = useState(false);
  const [pipelineName, setPipelineName] = useState(name);

  const handleSavePipelineName = () => {
    if (pipelineName.trim()) {
      onEditPipelineName(pipelineName);
      setEditingPipelineName(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSavePipelineName();
    } else if (e.key === 'Escape') {
      setEditingPipelineName(false);
      setPipelineName(name);
    }
  };

  return (
    <div className="flex justify-between items-center mb-6">
      <div className="flex items-center gap-4">
        {editingPipelineName ? (
          <div className="flex items-center gap-2">
            <Input
              value={pipelineName}
              onChange={(e) => setPipelineName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-2xl font-semibold h-10"
              autoFocus
            />
            <Button onClick={handleSavePipelineName}>Save</Button>
            <Button 
              variant="ghost" 
              onClick={() => {
                setEditingPipelineName(false);
                setPipelineName(name);
              }}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <h2 
            className="text-2xl font-semibold cursor-pointer hover:text-muted-foreground transition-colors"
            onClick={() => setEditingPipelineName(true)}
          >
            {name}
          </h2>
        )}
      </div>
      <Button variant="destructive" onClick={onDeletePipeline}>
        <Trash2 className="w-4 h-4 mr-2" />
        Delete Pipeline
      </Button>
    </div>
  );
}
