
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Lead } from "@/pages/dashboard/leads";
import { Pipeline, PipelineColumn } from "@/types/pipeline";
import { LeadCard } from "@/components/leads/lead-card";
import { StageHeader } from "./stage-header";
import { ChevronLeft, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  isPreviewTarget?: boolean;
  previewLead?: Lead | null;
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
  currentPipelineId,
  isPreviewTarget = false,
  previewLead = null
}: PipelineStageProps) {
  const isEditing = editingColumnId === column.id;

  // Extract color without the bg- prefix for the dot
  const colorClass = column.color.replace('bg-', '');
  
  // Make sure column title is never empty
  const displayTitle = column.title || "Untitled Stage";

  return (
    <div className="h-full min-w-[300px] w-[350px] flex-shrink-0 flex-grow-0">
      <Card 
        className={`h-full w-full flex flex-col border-t-4 border-x border-b rounded-lg shadow-sm overflow-hidden bg-white dark:bg-gray-900 transition-all duration-150 ${
          isPreviewTarget ? "ring-2 ring-blue-400" : ""
        }`}
        style={{ 
          borderTopColor: `var(--${colorClass})` 
        }}
      >
        <CardHeader className="flex flex-row items-center justify-between p-3 pb-2 border-b border-gray-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${column.color}`}></div>
            {!isEditing ? (
              <h3 className="text-lg font-semibold truncate max-w-[150px]">{displayTitle}</h3>
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
            <span className="text-sm font-medium mr-1">{columnLeads.length}</span>
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
              onClick={() => toggleColumnCollapse(column.id)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-2 flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-1">
            <div className="space-y-2">
              {/* Show preview lead at the top if this is the target column */}
              {isPreviewTarget && previewLead && (
                <div className="transition-all duration-300 opacity-80 pb-2" data-preview-lead={previewLead.id}>
                  <LeadCard 
                    key={`preview-${previewLead.id}`}
                    lead={previewLead}
                    onClick={() => {}}
                    pipelines={allPipelines}
                    currentPipelineId={currentPipelineId}
                    isPreview={true}
                  />
                </div>
              )}
              
              {columnLeads.length === 0 && !previewLead ? (
                <div className="min-h-[80px] flex items-center justify-center border border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/20">
                  <p className="text-sm text-muted-foreground/70 text-center px-4">
                    Drop leads here
                  </p>
                </div>
              ) : (
                columnLeads.map((lead) => (
                  <LeadCard 
                    key={lead.id} 
                    lead={lead}
                    onClick={() => onLeadClick(lead)} 
                    pipelines={allPipelines}
                    currentPipelineId={currentPipelineId}
                    data-draggable-id={lead.id}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
