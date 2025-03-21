import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { useDndContext, type UniqueIdentifier } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import React, { useMemo } from "react";
import { TaskCard } from "./TaskCard";
import { cva } from "class-variance-authority";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Lead } from "@/pages/dashboard/leads";
import "./kanban-styles.css";

export interface Column {
  id: UniqueIdentifier;
  title: string;
  color?: string;
}

export type ColumnType = "Column";

export interface ColumnDragData {
  type: ColumnType;
  column: Column;
}

interface BoardColumnProps {
  column: Column;
  tasks?: Lead[];
  isOverlay?: boolean;
  isPreviewTarget?: boolean;
  previewLead?: Lead | null;
  previewIndex?: number | null;
  onLeadClick?: (lead: Lead) => void;
  className?: string;
}

export function BoardColumn({
  column,
  tasks = [],
  isOverlay,
  isPreviewTarget,
  previewLead,
  previewIndex,
  onLeadClick,
}: BoardColumnProps) {
  const tasksIds = useMemo(() => {
    return tasks.map((task) => task.id);
  }, [tasks]);

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: "Column",
      column,
    } satisfies ColumnDragData,
    attributes: {
      roleDescription: `Column: ${column.title}`,
    },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  const variants = cva(
    "w-[280px] max-w-full bg-primary-foreground flex flex-col flex-shrink-0 shadow-md rounded-md border",
    {
      variants: {
        dragging: {
          default: "border border-transparent",
          over: "ring-2 opacity-30",
          overlay: "ring-2 ring-primary shadow-lg",
        },
      },
    }
  );

  // Get the color as a CSS variable (e.g., var(--blue-500))
  const colorVar = column.color
    ? `var(--${column.color.replace("bg-", "").replace("-", "-")})`
    : undefined;

  return (
    <Card
      ref={setNodeRef}
      style={{
        ...style,
        borderTopColor: colorVar,
        borderTopWidth: colorVar ? "4px" : undefined,
        height: "100%", // Ensure the card takes full height
      }}
      className={
        variants({
          dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined,
        }) +
        (isPreviewTarget ? " ring-2 ring-blue-400" : "") +
        " h-full"
      }
    >
      <CardHeader
        className="p-3 font-medium border-b text-left flex flex-row justify-between items-center rounded-t-md flex-shrink-0"
        style={{
          backgroundColor: colorVar ? `${colorVar}15` : "var(--muted)",
          borderBottomColor: colorVar || "var(--border)",
        }}
      >
        <Button
          variant={"ghost"}
          {...attributes}
          {...listeners}
          className="p-1 text-primary/50 -ml-2 h-auto cursor-grab relative"
        >
          <span className="sr-only">{`Move column: ${column.title}`}</span>
          <GripVertical />
        </Button>
        <span className="ml-auto font-semibold">{column.title}</span>
      </CardHeader>
      <ScrollArea className="flex-grow">
        <CardContent className="flex flex-grow flex-col gap-2 p-3 pt-2 h-full">
          <SortableContext items={tasksIds}>
            {/* If we have a preview lead at the top of the column (no specific index) */}
            {previewLead && previewIndex === null && (
              <div className="relative pb-1 transition-all duration-200 ease-out">
                <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-md opacity-70" />
                <TaskCard
                  lead={previewLead}
                  columnId={column.id.toString()}
                  isPreview={true}
                />
              </div>
            )}

            {tasks.length > 0 ? (
              tasks.map((task, index) => {
                // If we have a preview lead at a specific index, insert it there
                if (previewLead && previewIndex === index) {
                  return (
                    <React.Fragment key={`preview-${index}`}>
                      <div className="relative pb-1 transition-all duration-200 ease-out">
                        <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-md opacity-70" />
                        <TaskCard
                          lead={previewLead}
                          columnId={column.id.toString()}
                          isPreview={true}
                        />
                      </div>
                      <TaskCard
                        key={task.id}
                        lead={task}
                        columnId={column.id.toString()}
                        onClick={() => onLeadClick && onLeadClick(task)}
                      />
                    </React.Fragment>
                  );
                }

                return (
                  <TaskCard
                    key={task.id}
                    lead={task}
                    columnId={column.id.toString()}
                    onClick={() => onLeadClick && onLeadClick(task)}
                  />
                );
              })
            ) : (
              <div className="flex items-center justify-center h-24 border border-dashed rounded-md p-4 mt-2">
                <p className="text-sm text-muted-foreground">Drop leads here</p>
              </div>
            )}

            {/* If we have a preview lead at the end of the column */}
            {previewLead && previewIndex === tasks.length && (
              <div className="relative pb-1 transition-all duration-200 ease-out">
                <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-md opacity-70" />
                <TaskCard
                  lead={previewLead}
                  columnId={column.id.toString()}
                  isPreview={true}
                />
              </div>
            )}
          </SortableContext>
        </CardContent>
      </ScrollArea>
    </Card>
  );
}

interface BoardContainerProps {
  children: React.ReactNode;
}

export function BoardContainer({ children }: BoardContainerProps) {
  return (
    <div className="w-full h-full overflow-auto">
      <div className="flex gap-4 p-3 min-w-max h-full">{children}</div>
    </div>
  );
}
