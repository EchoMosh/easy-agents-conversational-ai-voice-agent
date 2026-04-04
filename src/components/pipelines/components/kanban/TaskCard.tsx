import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Mail, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Lead } from "@/pages/dashboard/leads";
import { UniqueIdentifier } from "@dnd-kit/core";
import { cn } from "@/lib/utils";
import { useEffect, useRef } from "react";
import { cva } from "class-variance-authority";
import "./kanban-styles.css";

export interface Task {
  id: UniqueIdentifier;
  columnId: string;
  content: string;
}

export type TaskType = "Task";

export interface TaskDragData {
  type: TaskType;
  task: Task;
  lead?: Lead;
  columnId: string;
  index?: number;
}

interface TaskCardProps {
  task?: Task;
  lead?: Lead;
  isOverlay?: boolean;
  isPreview?: boolean;
  onClick?: () => void;
  columnId: string;
  columnColor?: string;
  index?: number;
}

export function TaskCard({
  task,
  lead,
  isOverlay,
  isPreview,
  onClick,
  columnId,
  columnColor,
  index = 0,
}: TaskCardProps) {
  // Use either the task from props or create one from the lead
  const taskData =
    task ||
    (lead
      ? {
          id: lead.id,
          columnId: columnId,
          content: lead.name || "Unnamed Lead",
        }
      : undefined);

  if (!taskData) return null;

  // Handle to track and reset element state if needed
  const nodeRef = useRef<HTMLDivElement | null>(null);

  // useSortable with better cleanup handling
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
      task: taskData,
      lead: lead,
      columnId: columnId,
      index: index,
    } satisfies TaskDragData,
    attributes: {
      roleDescription: "Task",
    },
  });

  // Store both refs - the dnd-kit one and our own local ref
  const setRefs = (element: HTMLDivElement) => {
    setNodeRef(element);
    nodeRef.current = element;
  };

  // Effect to reset draggability if needed
  useEffect(() => {
    // If we're not dragging (anymore) and we have a valid node ref
    if (!isDragging && nodeRef.current) {
      const element = nodeRef.current;

      // Sometimes dnd-kit leaves aria-pressed="true" which prevents future drags
      // Force reset it to ensure this element stays draggable
      if (
        element.hasAttribute("aria-pressed") &&
        element.getAttribute("aria-pressed") === "true"
      ) {
        element.setAttribute("aria-pressed", "false");
      }

      // Also ensure transform is cleared in case it got stuck
      if (element.style.transform && !transform) {
        element.style.transform = "";
      }
    }
  }, [isDragging, transform]);

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  const variants = cva("", {
    variants: {
      dragging: {
        over: "ring-2 opacity-30",
        overlay: "ring-2 ring-primary",
      },
    },
  });

  // When a card is in preview mode, we show it with a blue highlight
  const previewStyles = isPreview
    ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20 shadow-md"
    : "";

  // Get the color as a CSS variable for the left border
  const colorVar = columnColor
    ? `var(--${columnColor.replace("bg-", "")})`
    : undefined;

  return (
    <Card
      ref={setRefs}
      style={{
        ...style,
        borderLeftColor: colorVar,
        borderLeftWidth: colorVar ? "2px" : undefined,
      }}
      className={cn(
        "bg-card border border-border/60 hover:border-border rounded-md task-card",
        isDragging ? "opacity-50 z-10 task-card-dragging" : "opacity-100",
        isOverlay ? "ring-2 ring-primary shadow-md z-50" : "",
        isPreview ? "task-card-preview" : "",
        previewStyles,
        "cursor-grab active:cursor-grabbing shadow-none hover:shadow-sm transition-shadow",
      )}
      onClick={onClick}
      data-task-id={taskData.id}
      {...attributes}
      {...listeners}
    >
      <CardContent className="p-2.5 flex flex-col gap-1">
        <div className="font-medium text-sm leading-snug">
          {taskData.content}
        </div>

        {lead && (lead.email || lead.phone) && (
          <div className="flex flex-col gap-0.5">
            {lead.email && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Mail className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{lead.email}</span>
              </div>
            )}

            {lead.phone && (
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Phone className="h-3 w-3 flex-shrink-0" />
                <span>{lead.phone}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
