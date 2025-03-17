
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lead } from "@/pages/dashboard/leads";
import { UniqueIdentifier } from "@dnd-kit/core";
import { Mail, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Task {
  id: UniqueIdentifier;
  columnId: string;
  content: string;
}

export interface TaskDragData {
  type: "Task";
  task: Task;
  columnId: string; // Always include column ID
  lead?: Lead;
  index?: number; // Add index for position tracking
}

export interface TaskCardProps {
  task?: Task;
  lead?: Lead;
  isOverlay?: boolean;
  isPreview?: boolean;
  onClick?: () => void;
  columnId?: string; // Added to pass current column ID
  index?: number; // Add index for position tracking
}

export function TaskCard({ task, lead, isOverlay, isPreview, onClick, columnId, index = 0 }: TaskCardProps) {
  // Use either the task from props or create one from the lead
  const taskData = task || (lead ? {
    id: lead.id,
    columnId: columnId || lead.status || "",
    content: lead.name || "Unnamed Lead"
  } : undefined);

  if (!taskData) return null;

  // Ensure columnId is always present
  const actualColumnId = columnId || taskData.columnId;
  
  if (!actualColumnId) {
    console.warn("Missing columnId for task", taskData);
  }

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: taskData.id,
    data: {
      type: "Task",
      task: {
        ...taskData,
        columnId: actualColumnId, // Ensure column ID is set
      },
      columnId: actualColumnId, // Explicitly set for easy access
      lead: lead,
      index: index, // Pass the index for sorting
    } as TaskDragData,
    attributes: {
      roleDescription: `Task: ${taskData.content}`,
    },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  // When a card is in preview mode, we show it with a blue highlight
  const previewStyles = isPreview
    ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-md"
    : "";

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "bg-card border shadow-sm relative", // Added relative positioning
        isDragging ? "opacity-50 z-10" : "opacity-100",
        isOverlay ? "ring-2 ring-primary shadow-md z-50" : "", // Higher z-index for overlay
        previewStyles,
        "cursor-grab active:cursor-grabbing"
      )}
      onClick={onClick}
      data-task-id={taskData.id} // Add data attribute for easier targeting
    >
      <CardContent className="p-3 flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <div className="font-medium text-sm">{taskData.content}</div>
          <Button
            variant="ghost"
            {...attributes}
            {...listeners}
            className="p-1 text-primary/50 h-auto cursor-grab active:cursor-grabbing -mr-2 -mt-1"
          >
            <span className="sr-only">{`Move task: ${taskData.content}`}</span>
            <GripVertical className="h-4 w-4" />
          </Button>
        </div>
        
        {lead && (
          <div className="space-y-1">
            {lead.email && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Mail className="h-3 w-3" />
                <span className="truncate max-w-[200px]">{lead.email}</span>
              </div>
            )}
            
            {lead.phone && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span>{lead.phone}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
