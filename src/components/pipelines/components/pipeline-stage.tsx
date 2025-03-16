
import { useState, useMemo } from "react";
import { PipelineColumn } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { StageHeader } from "./stage-header";
import { DroppableColumn } from "@/pages/dashboard/pipelines";
import { DeleteStageDialog } from "./delete-stage-dialog";
import { useToast } from "@/hooks/use-toast";

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
  setEditingColumnId: (id: string | null) => void;
  onLeadClick: (lead: Lead) => void;
  allPipelines?: any[];
  currentPipelineId: string;
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  // Get the currently selected pipeline
  const currentPipeline = useMemo(() => {
    return allPipelines.find(p => p.id === currentPipelineId);
  }, [allPipelines, currentPipelineId]);

  const handleEditTitleClick = () => {
    setEditingColumnId(column.id);
    setEditingColumnTitle(column.title);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingColumnTitle(e.target.value);
  };

  const checkForDuplicateAndEdit = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentPipeline) {
      // Check for duplicate name
      const isDuplicate = currentPipeline.columns.some(
        col => col.id !== column.id && col.title.toLowerCase() === editingColumnTitle.trim().toLowerCase()
      );
      
      if (isDuplicate) {
        e.preventDefault(); // Prevent default to avoid triggering the normal edit flow
        toast({
          title: "Duplicate stage name",
          description: `A stage named "${editingColumnTitle.trim()}" already exists in this pipeline. Please choose a different name.`,
          variant: "destructive"
        });
        return;
      }
      
      // If no duplicate, proceed with normal edit
      onEditColumnTitle(e);
    } else if (e.key === 'Escape') {
      // Allow escape key to cancel editing
      setEditingColumnId(null);
    } else {
      // For any other key, just proceed normally
      onEditColumnTitle(e);
    }
  };

  return (
    <div className={`bg-card rounded-lg border shadow-sm flex flex-col min-w-[280px] max-w-[280px] ${column.color}`}>
      <StageHeader 
        column={column}
        columnLeads={columnLeads}
        isCollapsed={isCollapsed}
        editingColumnId={editingColumnId}
        editingColumnTitle={editingColumnTitle}
        onKeyDown={checkForDuplicateAndEdit}
        onTitleChange={handleTitleChange}
        handleColorChange={handleColorChange}
        onDeleteStage={() => setShowDeleteDialog(true)}
        toggleCollapse={() => toggleColumnCollapse(column.id)}
        handleEditTitleClick={handleEditTitleClick}
      />
      
      {!isCollapsed && (
        <DroppableColumn id={column.id}>
          <div className="px-3 py-2 flex-1 overflow-y-auto max-h-[calc(100vh-260px)]">
            {columnLeads.length > 0 ? (
              columnLeads.map((lead) => (
                <div 
                  key={lead.id}
                  onClick={() => onLeadClick(lead)}
                  className="p-3 mb-2 bg-background rounded border cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="font-medium">{lead.name}</div>
                  {lead.email && <div className="text-sm text-muted-foreground">{lead.email}</div>}
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-muted-foreground text-sm">
                No leads in this stage
              </div>
            )}
          </div>
        </DroppableColumn>
      )}

      <DeleteStageDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onDelete={() => {
          onDeleteStage(column);
          setShowDeleteDialog(false);
        }}
      />
    </div>
  );
}
