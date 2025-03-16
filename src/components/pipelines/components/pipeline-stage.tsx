
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { Lead } from "@/pages/dashboard/leads";
import { PipelineColumn } from "@/types/pipeline";
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
  setStageToDelete: (column: PipelineColumn) => void;
  toggleColumnCollapse: (columnId: string) => void;
  setEditingColumnId: (id: string) => void;
  onLeadClick: (lead: Lead) => void;
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
  setStageToDelete,
  toggleColumnCollapse,
  setEditingColumnId,
  onLeadClick
}: PipelineStageProps) {
  const isEditing = editingColumnId === column.id;

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <DroppableColumn id={column.id}>
          <Card className={`h-full transition-all duration-300 ${
            isCollapsed ? "w-16" : "w-[350px]"
          } border border-gray-200/80 dark:border-gray-800/80 shadow-sm rounded-xl overflow-hidden bg-white dark:bg-gray-900`}>
            <CardHeader className={`space-y-2 pb-4 ${isCollapsed ? "p-2" : ""}`}>
              <StageHeader
                column={column}
                isEditing={isEditing}
                isCollapsed={isCollapsed}
                editingColumnTitle={editingColumnTitle}
                onEditColumnTitle={onEditColumnTitle}
                setEditingColumnTitle={setEditingColumnTitle}
                handleColorChange={handleColorChange}
                setStageToDelete={setStageToDelete}
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
          onSelect={() => setStageToDelete(column)}
          className="text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete Stage
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
