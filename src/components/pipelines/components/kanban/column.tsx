
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useId } from "react";
import { KanbanTask } from "./task";
import { Lead } from "@/pages/dashboard/leads";
import { Pipeline, PipelineColumn } from "@/types/pipeline";
import { StageHeader } from "../stage-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, MoreVertical } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface KanbanColumnProps {
  column: PipelineColumn;
  columnLeads: Lead[];
  isEditing: boolean;
  isCollapsed: boolean;
  editingColumnTitle: string;
  onEditColumnTitle: (e: React.KeyboardEvent) => void;
  setEditingColumnTitle: (title: string) => void;
  handleColorChange: (columnId: string, color: string) => void;
  onDeleteStage: (column: PipelineColumn) => void;
  toggleColumnCollapse: () => void;
  setEditingColumnId: (id: string) => void;
  onLeadClick: (lead: Lead) => void;
  currentPipelineId?: string;
  isPreviewTarget?: boolean;
  previewLead?: Lead | null;
  allPipelines?: Pipeline[];
}

export function KanbanColumn({
  column,
  columnLeads,
  isEditing,
  isCollapsed,
  editingColumnTitle,
  onEditColumnTitle,
  setEditingColumnTitle,
  handleColorChange,
  onDeleteStage,
  toggleColumnCollapse,
  setEditingColumnId,
  onLeadClick,
  currentPipelineId,
  isPreviewTarget = false,
  previewLead = null,
  allPipelines = [],
}: KanbanColumnProps) {
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
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const leadIds = columnLeads.map((lead) => lead.id);
  const headingId = useId();
  
  // Extract color without the bg- prefix for the dot
  const colorClass = column.color.replace('bg-', '');
  
  // Make sure column title is never empty
  const displayTitle = column.title || "Untitled Stage";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`board-column ${isDragging ? "board-column-dragging" : ""} ${
        isPreviewTarget ? "column-preview-target" : ""
      }`}
      {...attributes}
    >
      <Card 
        className={`h-full w-full flex flex-col border-t-4 border-x border-b rounded-lg shadow-sm overflow-hidden ${
          isPreviewTarget ? "ring-2 ring-primary" : ""
        }`}
        style={{ 
          borderTopColor: `hsl(var(--${colorClass}))` 
        }}
      >
        <CardHeader 
          className="flex flex-row items-center justify-between p-3 pb-2 border-b border-border shrink-0"
          {...listeners}
        >
          <div className="flex items-center gap-2">
            <div 
              className={`w-3 h-3 rounded-full ${column.color}`}
              aria-labelledby={headingId}
            ></div>
            {!isEditing ? (
              <h3 id={headingId} className="text-lg font-semibold truncate max-w-[150px] text-foreground">{displayTitle}</h3>
            ) : (
              <StageHeader
                column={column}
                isEditing={isEditing}
                isCollapsed={isCollapsed}
                editingColumnTitle={editingColumnTitle}
                onEditColumnTitle={onEditColumnTitle}
                setEditingColumnTitle={setEditingColumnTitle}
                handleColorChange={handleColorChange}
                onDeleteStage={onDeleteStage}
                toggleColumnCollapse={toggleColumnCollapse}
                setEditingColumnId={setEditingColumnId}
              />
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium mr-1 text-foreground">{columnLeads.length}</span>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8" 
              onClick={() => setEditingColumnId(column.id)}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={toggleColumnCollapse}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-2 flex-1 overflow-hidden bg-background">
          <ScrollArea className="h-full">
            <SortableContext items={leadIds} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {/* Show preview lead at the top if this is the target column */}
                {isPreviewTarget && previewLead && (
                  <div className="transition-all duration-300 opacity-80 pb-2" data-preview-lead={previewLead.id}>
                    <KanbanTask 
                      key={`preview-${previewLead.id}`}
                      lead={previewLead}
                      columnId={column.id}
                      onClick={() => {}}
                    />
                  </div>
                )}

                {columnLeads.length === 0 && !previewLead ? (
                  <div className="min-h-[80px] flex items-center justify-center border border-dashed border-border rounded-lg bg-secondary/50">
                    <p className="text-sm text-muted-foreground text-center px-4">
                      Drop leads here
                    </p>
                  </div>
                ) : (
                  columnLeads.map((lead) => (
                    <KanbanTask
                      key={lead.id}
                      lead={lead}
                      columnId={column.id}
                      onClick={() => onLeadClick(lead)}
                    />
                  ))
                )}
              </div>
            </SortableContext>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
