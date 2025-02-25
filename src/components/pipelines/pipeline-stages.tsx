
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Pipeline, PipelineColumn } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DroppableColumn } from "@/pages/dashboard/pipelines";
import { LeadCard } from "@/components/leads/lead-card";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SortableStage } from "./components/sortable-stage";
import { StageHeader } from "./components/stage-header";
import { DeleteStageDialog } from "./components/delete-stage-dialog";

interface PipelineStagesProps {
  selectedPipeline: Pipeline;
  leads: Lead[];
  onDragEnd: (event: DragEndEvent) => void;
  onEditColumnTitle: (columnId: string, newTitle: string) => void;
  onLeadClick: (lead: Lead) => void;
  onAddStage: (stage: PipelineColumn) => void;
  onDeletePipeline: () => void;
  onEditPipelineName: (name: string) => void;
  onReorderColumns: (newOrder: PipelineColumn[]) => void;
}

export function PipelineStages({
  selectedPipeline,
  leads,
  onDragEnd,
  onEditColumnTitle,
  onLeadClick,
  onAddStage,
  onDeletePipeline,
  onEditPipelineName,
  onReorderColumns,
}: PipelineStagesProps) {
  const { toast } = useToast();
  const [editingPipelineName, setEditingPipelineName] = useState(false);
  const [pipelineName, setPipelineName] = useState(selectedPipeline.name);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);
  const [editingColumnTitle, setEditingColumnTitle] = useState("");
  const [collapsedColumns, setCollapsedColumns] = useState<Map<string, Set<string>>>(new Map());
  const [stageToDelete, setStageToDelete] = useState<PipelineColumn | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    })
  );

  const isColumnCollapsed = (columnId: string) => {
    const pipelineCollapsed = collapsedColumns.get(selectedPipeline.id);
    return pipelineCollapsed?.has(columnId) ?? false;
  };

  const toggleColumnCollapse = (columnId: string) => {
    setCollapsedColumns(prev => {
      const newMap = new Map(prev);
      const pipelineCollapsed = new Set<string>(newMap.get(selectedPipeline.id) || new Set());
      
      if (pipelineCollapsed.has(columnId)) {
        pipelineCollapsed.delete(columnId);
      } else {
        pipelineCollapsed.add(columnId);
      }
      
      newMap.set(selectedPipeline.id, pipelineCollapsed);
      return newMap;
    });
  };

  const handleSavePipelineName = () => {
    if (pipelineName.trim()) {
      onEditPipelineName(pipelineName);
      setEditingPipelineName(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: 'pipeline' | 'column') => {
    if (e.key === 'Enter') {
      if (action === 'pipeline') {
        handleSavePipelineName();
      } else if (editingColumnId && editingColumnTitle.trim()) {
        onEditColumnTitle(editingColumnId, editingColumnTitle);
        setEditingColumnId(null);
      }
    } else if (e.key === 'Escape') {
      if (action === 'pipeline') {
        setEditingPipelineName(false);
        setPipelineName(selectedPipeline.name);
      } else {
        setEditingColumnId(null);
      }
    }
  };

  const handleColorChange = async (columnId: string, newColor: string) => {
    try {
      const newColumns = selectedPipeline.columns.map(col => 
        col.id === columnId ? { ...col, color: newColor } : col
      );
      
      const columnsForDb = newColumns.map(col => ({
        id: col.id,
        title: col.title,
        color: col.color
      }));
      
      const { error } = await supabase
        .from("pipelines")
        .update({
          columns: columnsForDb
        })
        .eq("id", selectedPipeline.id);

      if (error) throw error;

      onReorderColumns(newColumns);

      toast({
        title: "Color updated",
        description: "Column color has been updated successfully"
      });
    } catch (error) {
      console.error("Error updating column color:", error);
      toast({
        title: "Error",
        description: "Failed to update column color",
        variant: "destructive"
      });
    }
  };

  const handleDeleteStage = async (column: PipelineColumn) => {
    try {
      const newColumns = selectedPipeline.columns.filter(col => col.id !== column.id);
      const columnsForDb = newColumns.map(col => ({
        id: col.id,
        title: col.title,
        color: col.color
      }));
      
      const { error } = await supabase
        .from("pipelines")
        .update({
          columns: columnsForDb
        })
        .eq("id", selectedPipeline.id);

      if (error) throw error;

      onReorderColumns(newColumns);
      setStageToDelete(null);

      toast({
        title: "Stage deleted",
        description: `${column.title} stage has been deleted successfully`
      });
    } catch (error) {
      console.error("Error deleting stage:", error);
      toast({
        title: "Error",
        description: "Failed to delete stage",
        variant: "destructive"
      });
      setStageToDelete(null);
    }
  };

  const handleAddStage = () => {
    const newStage: PipelineColumn = {
      id: crypto.randomUUID(),
      title: "New Stage",
      color: "bg-gray-500",
    };
    
    const newColumns = [...selectedPipeline.columns, newStage];
    onAddStage(newStage);
    onReorderColumns(newColumns);
    
    setEditingColumnId(newStage.id);
    setEditingColumnTitle("New Stage");
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setStageToDelete(null);
    }
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          {editingPipelineName ? (
            <div className="flex items-center gap-2">
              <Input
                value={pipelineName}
                onChange={(e) => setPipelineName(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, 'pipeline')}
                className="text-2xl font-semibold h-10"
                autoFocus
              />
              <Button onClick={handleSavePipelineName}>Save</Button>
              <Button 
                variant="ghost" 
                onClick={() => {
                  setEditingPipelineName(false);
                  setPipelineName(selectedPipeline.name);
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <h2 
              className="text-2xl font-semibold cursor-pointer hover:text-muted-foreground transition-colors"
              onClick={() => setEditingPipelineName(true)}
            >
              {selectedPipeline.name}
            </h2>
          )}
        </div>
        <Button variant="destructive" onClick={onDeletePipeline}>
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Pipeline
        </Button>
      </div>

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="flex flex-wrap gap-6">
          <SortableContext items={selectedPipeline.columns.map(col => col.id)} strategy={horizontalListSortingStrategy}>
            {selectedPipeline.columns.map((column) => {
              const columnLeads = leads.filter((lead) => 
                lead.status.toLowerCase() === column.title.toLowerCase()
              );
              const isEditing = editingColumnId === column.id;
              const isCollapsed = isColumnCollapsed(column.id);
              
              return (
                <SortableStage key={column.id} column={column}>
                  <ContextMenu>
                    <ContextMenuTrigger>
                      <DroppableColumn id={column.id}>
                        <Card className={`h-full transition-all duration-300 ${
                          isCollapsed ? "w-16" : "w-[350px]"
                        }`}>
                          <CardHeader className={`space-y-2 pb-4 ${isCollapsed ? "p-2" : ""}`}>
                            <StageHeader
                              column={column}
                              isEditing={isEditing}
                              isCollapsed={isCollapsed}
                              editingColumnTitle={editingColumnTitle}
                              onEditColumnTitle={(e) => handleKeyDown(e, 'column')}
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
                                <div className="min-h-[200px] flex items-center justify-center border-2 border-dashed border-muted rounded-lg">
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
                </SortableStage>
              );
            })}
          </SortableContext>
          
          <Button
            variant="outline"
            className="h-full min-h-[300px] w-[350px] shrink-0 border-2 border-dashed hover:border-solid"
            onClick={handleAddStage}
          >
            <Plus className="w-6 h-6 mr-2" />
            Add Stage
          </Button>
        </div>
      </DndContext>

      <DeleteStageDialog
        stageToDelete={stageToDelete}
        onClose={handleDialogClose}
        onConfirm={handleDeleteStage}
      />
    </>
  );
}
