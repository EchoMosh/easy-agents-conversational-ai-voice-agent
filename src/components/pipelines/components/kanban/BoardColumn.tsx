import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { useDndContext, type UniqueIdentifier } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import React, { useMemo } from "react";
import { TaskCard } from "./TaskCard";
import { cva } from "class-variance-authority";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
  onAddLead?: (columnId: string) => void;
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
  onAddLead,
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
    "w-[300px] max-w-full bg-muted/30 flex flex-col flex-shrink-0 rounded-lg border border-border/50",
    {
      variants: {
        dragging: {
          default: "border-border/50",
          over: "ring-2 opacity-30",
          overlay: "ring-2 ring-primary shadow-lg",
        },
      },
    },
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
        borderTopWidth: colorVar ? "3px" : undefined,
        height: "100%",
      }}
      className={
        variants({
          dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined,
        }) +
        (isPreviewTarget ? " ring-2 ring-blue-400" : "") +
        " h-full shadow-none"
      }
    >
      <CardHeader
        className="px-3 py-2.5 text-left flex flex-row justify-between items-center flex-shrink-0 cursor-grab active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <span className="text-sm font-medium text-foreground">
          {column.title}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {tasks.length}
        </span>
      </CardHeader>
      <ScrollArea className="flex-grow">
        <CardContent className="flex flex-grow flex-col gap-1.5 px-2 pb-2 pt-0 h-full">
          <SortableContext items={tasksIds}>
            {/* If we have a preview lead at the top of the column (no specific index) */}
            {previewLead && previewIndex === null && (
              <div className="relative pb-1 transition-all duration-200 ease-out">
                <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/30 rounded-md opacity-70" />
                <TaskCard
                  lead={previewLead}
                  columnId={column.id.toString()}
                  columnColor={column.color}
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
                          columnColor={column.color}
                          isPreview={true}
                        />
                      </div>
                      <TaskCard
                        key={task.id}
                        lead={task}
                        columnId={column.id.toString()}
                        columnColor={column.color}
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
                    columnColor={column.color}
                    onClick={() => onLeadClick && onLeadClick(task)}
                  />
                );
              })
            ) : (
              <button
                onClick={() => onAddLead?.(column.id.toString())}
                className="flex flex-col items-center justify-center h-20 border border-dashed border-muted-foreground/20 rounded-md mt-1 transition-colors hover:border-muted-foreground/40 hover:bg-muted/50 group"
              >
                <Plus className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground/60 mb-1" />
                <span className="text-xs text-muted-foreground/40 group-hover:text-muted-foreground/60">
                  Add lead
                </span>
              </button>
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

          {/* Add lead button at bottom of non-empty columns */}
          {tasks.length > 0 && (
            <button
              onClick={() => onAddLead?.(column.id.toString())}
              className="flex items-center justify-center gap-1 py-1.5 mt-0.5 rounded-md text-xs text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <Plus className="h-3 w-3" />
              <span>Add lead</span>
            </button>
          )}
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
