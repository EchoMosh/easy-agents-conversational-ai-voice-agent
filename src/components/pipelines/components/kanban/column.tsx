
import { useId } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Lead } from "@/pages/dashboard/leads";
import { PipelineColumn } from "@/types/pipeline";
import { TaskCard } from "./TaskCard";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  column: PipelineColumn;
  columnLeads?: Lead[];
  isOverlay?: boolean;
  isEditing?: boolean;
  isCollapsed?: boolean;
  isPreviewTarget?: boolean;
  previewLead?: Lead | null;
  editingColumnTitle?: string;
  onEditColumnTitle?: (e: React.KeyboardEvent) => void;
  setEditingColumnTitle?: (title: string) => void;
  handleColorChange?: (columnId: string, color: string) => void;
  onDeleteStage?: (column: PipelineColumn) => void;
  toggleColumnCollapse?: () => void;
  setEditingColumnId?: (id: string | null) => void;
  onLeadClick?: (lead: Lead) => void;
  currentPipelineId?: string;
}

export function KanbanColumn({
  column,
  columnLeads = [],
  isOverlay = false,
  isEditing = false,
  isCollapsed = false,
  isPreviewTarget = false,
  previewLead = null,
  editingColumnTitle = "",
  onEditColumnTitle = () => {},
  setEditingColumnTitle = () => {},
  handleColorChange = () => {},
  onDeleteStage = () => {},
  toggleColumnCollapse = () => {},
  setEditingColumnId = () => {},
  onLeadClick = () => {},
  currentPipelineId,
}: KanbanColumnProps) {
  const headerId = useId();
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: "Column",
      column,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  // Extract color without the bg- prefix for styling
  const colorClass = column.color.replace('bg-', '');
  
  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={cn(
        "h-full min-w-[300px] w-[350px] flex-shrink-0 flex-grow-0 border rounded-md flex flex-col",
        isDragging ? "opacity-50" : "opacity-100",
        isOverlay ? "ring-2 ring-primary shadow-lg" : "",
        isPreviewTarget ? "ring-2 ring-blue-400" : ""
      )}
    >
      <CardHeader 
        className="p-3 flex flex-row items-center justify-between border-b"
        style={{ borderTopColor: `var(--${colorClass})`, borderTopWidth: '4px' }}
      >
        <div className="flex items-center">
          <div className={`${column.color} w-3 h-3 rounded-full mr-2`} />
          <h3 className="text-base font-medium">{column.title}</h3>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
            {columnLeads.length}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setEditingColumnId(column.id)}
          >
            <MoreVertical className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 cursor-grab touch-manipulation"
            {...attributes}
            {...listeners}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 4H8M4 8H8M4 12H8M12 4H12.01M12 8H12.01M12 12H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="sr-only">Drag to reorder</span>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-2 overflow-auto flex-1 flex flex-col gap-2">
        {/* If we have a preview lead, show it at the top with a highlight */}
        {previewLead && (
          <div className="relative pb-1">
            <div className="absolute inset-0 bg-blue-50 dark:bg-blue-900/20 rounded-md opacity-50" />
            <TaskCard
              lead={previewLead}
              columnId={column.id}
              isPreview={true}
            />
          </div>
        )}

        {/* Map and render all the leads for this column */}
        <SortableContext
          items={columnLeads.map((lead) => lead.id)}
          strategy={verticalListSortingStrategy}
        >
          {columnLeads.length > 0 ? (
            columnLeads.map((lead) => (
              <TaskCard
                key={lead.id}
                lead={lead}
                columnId={column.id}
                onClick={() => onLeadClick(lead)}
              />
            ))
          ) : (
            <div className="flex items-center justify-center h-24 border border-dashed rounded-md p-4 mt-2">
              <p className="text-sm text-muted-foreground">Drop leads here</p>
            </div>
          )}
        </SortableContext>
      </CardContent>
    </Card>
  );
}
