
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Lead } from "@/pages/dashboard/leads";
import { Pipeline, PipelineColumn } from "@/types/pipeline";
import { LeadCard } from "@/components/leads/lead-card";
import { StageHeader } from "./stage-header";
import { ChevronLeft, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  // Extract color without the bg- prefix for the dot
  const colorClass = column.color.replace('bg-', '');

  return (
    <div className="h-full w-full">
      <Card className="h-full w-full transition-all duration-300 border-t-4 border-x border-b rounded-lg shadow-sm overflow-hidden bg-white dark:bg-gray-900"
        style={{ 
          borderTopColor: `var(--${colorClass.replace('-', '-')})` 
        }}
      >
        <CardHeader className="flex flex-row items-center justify-between p-4 pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${column.color}`}></div>
            {!isEditing ? (
              <h3 className="text-lg font-semibold">{column.title}</h3>
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

        <CardContent className="p-3 space-y-3 overflow-auto max-h-[500px]">
          {columnLeads.length === 0 ? (
            <div className="min-h-[100px] flex items-center justify-center border border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/20">
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
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
