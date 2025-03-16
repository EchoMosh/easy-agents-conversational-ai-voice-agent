
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Lead } from "@/pages/dashboard/leads";
import { Pipeline, PipelineColumn } from "@/types/pipeline";
import { DroppableColumn } from "@/pages/dashboard/pipelines";
import { LeadCard } from "@/components/leads/lead-card";
import { StageHeader } from "./stage-header";
import { Trash2 } from "lucide-react";

interface PipelineStageProps {
  column: PipelineColumn;
  columnLeads: Lead[];
  isCollapsed: boolean;
  editingColumnId: string | null;
  editingColumnTitle: string;
  onEditColumnTitle: (e: React.KeyboardEvent) => void;
  setEditingColumnTitle: (title: string) => void;
  handleColorChange: (columnId: string, color: string) => void;
  onDeleteStage: (column: PipelineColumn) => void;
  toggleColumnCollapse: (columnId: string) => void;
  setEditingColumnId: (id: string) => void;
  onLeadClick: (lead: Lead) => void;
  allPipelines?: Pipeline[];
  currentPipelineId?: string;
}

export function PipelineStage({
  column,
  columnLeads,
  isCollapsed,
  editingColumnId,
  editingColumnTitle,
  onEditColumnTitle,
  setEditingColumnTitle,
  handleColorChange,
  onDeleteStage,
  toggleColumnCollapse,
  setEditingColumnId,
  onLeadClick,
  allPipelines = [],
  currentPipelineId
}: PipelineStageProps) {
  const isEditing = editingColumnId === column.id;

  // Log the leads for this column to help with debugging
  console.log(`Column "${column.title}" has ${columnLeads.length} leads in pipeline ${currentPipelineId}`);

  // Handler for the delete context menu option
  const handleDeleteClick = (e?: React.MouseEvent | Event) => {
    // If we have an event, stop propagation to prevent triggering drag handlers
    if (e) {
      e.stopPropagation();
      if ('preventDefault' in e) {
        e.preventDefault();
      }
    }
    
    console.log("Delete stage clicked:", column.title, column.id);
    onDeleteStage(column);
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <DroppableColumn id={column.id}>
          <Card className={`h-full w-full transition-all duration-300 ${
            isCollapsed ? "w-16" : ""
          } border border-gray-200/50 dark:border-gray-800/50 shadow-sm rounded-xl overflow-hidden bg-white dark:bg-gray-900`}>
            <CardHeader className={`space-y-2 pb-4 ${isCollapsed ? "p-2" : ""}`}>
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
              {!isCollapsed && (
                <div className="text-sm text-muted-foreground/80 font-medium">
                  {columnLeads.length} lead{columnLeads.length !== 1 ? 's' : ''}
                </div>
              )}
            </CardHeader>
            {!isCollapsed && (
              <CardContent className="space-y-3 pt-2">
                {columnLeads.map((lead) => (
                  <LeadCard 
                    key={lead.id} 
                    lead={lead}
                    onClick={() => onLeadClick(lead)} 
                    pipelines={allPipelines}
                    currentPipelineId={currentPipelineId}
                  />
                ))}
                {columnLeads.length === 0 && (
                  <div className="min-h-[200px] flex items-center justify-center border border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/20">
                    <p className="text-sm text-muted-foreground/70 text-center px-4">
                      Drop leads here
                    </p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </DroppableColumn>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem 
          onSelect={() => handleDeleteClick()}
          className="text-destructive flex items-center"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Stage
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
