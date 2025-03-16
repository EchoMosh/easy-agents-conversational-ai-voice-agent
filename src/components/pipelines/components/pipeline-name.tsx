
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash, Edit2, Check } from "lucide-react";

interface PipelineNameProps {
  name: string;
  onEditPipelineName: (name: string) => void;
  onDeletePipeline: () => void;
}

export function PipelineName({ name, onEditPipelineName, onDeletePipeline }: PipelineNameProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(name);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editedName.trim()) {
      onEditPipelineName(editedName);
      setIsEditing(false);
    }
  };

  return (
    <div className="flex items-center justify-between py-4 mb-6 border-b">
      {isEditing ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-1">
          <Input
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            className="text-xl font-semibold max-w-md"
            autoFocus
          />
          <Button 
            type="submit" 
            size="sm"
            variant="subtle"
            className="h-8 w-8 p-0"
          >
            <Check className="h-4 w-4" />
          </Button>
        </form>
      ) : (
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-semibold">{name}</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              setEditedName(name);
              setIsEditing(true);
            }}
            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      <Button
        variant="danger"
        onClick={onDeletePipeline}
        size="sm"
        className="h-9 rounded-full"
      >
        <Trash className="w-4 h-4 mr-2" />
        Delete Pipeline
      </Button>
    </div>
  );
}
