import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Pipeline, PipelineColumn } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { DroppableColumn } from "@/pages/dashboard/pipelines";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LeadCard } from "@/components/leads/lead-card";
import { useState } from "react";
import { useSortable, SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const colorOptions = [
  { name: "Gray", value: "bg-gray-500" },
  { name: "Red", value: "bg-red-500" },
  { name: "Orange", value: "bg-orange-500" },
  { name: "Yellow", value: "bg-yellow-500" },
  { name: "Green", value: "bg-green-500" },
  { name: "Blue", value: "bg-blue-500" },
  { name: "Purple", value: "bg-purple-500" },
  { name: "Pink", value: "bg-pink-500" },
];

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

function SortableStage({ column, children }: { column: PipelineColumn; children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: column.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
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
      const pipelineCollapsed = new Set(newMap.get(selectedPipeline.id) || new Set());
      
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = selectedPipeline.columns.findIndex((col) => col.id === active.id);
    const newIndex = selectedPipeline.columns.findIndex((col) => col.id === over.id);

    const newColumns = [...selectedPipeline.columns];
    const [removed] = newColumns.splice(oldIndex, 1);
    newColumns.splice(newIndex, 0, removed);

    onReorderColumns(newColumns);
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

  const handleAddStage = () => {
    const newStage: PipelineColumn = {
      id: crypto.randomUUID(),
      title: "New Stage",
      color: "bg-gray-500",
    };
    onAddStage(newStage);
    setEditingColumnId(newStage.id);
    setEditingColumnTitle("New Stage");
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

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex flex-wrap gap-6">
          <SortableContext items={selectedPipeline.columns.map(col => col.id)} strategy={horizontalListSortingStrategy}>
            {selectedPipeline.columns.map((column) => {
              const columnLeads = leads.filter((lead) => lead.status === column.title);
              const isEditing = editingColumnId === column.id;
              const isCollapsed = isColumnCollapsed(column.id);
              
              return (
                <SortableStage key={column.id} column={column}>
                  <DroppableColumn id={column.id}>
                    <Card className={`h-full transition-all duration-300 ${
                      isCollapsed ? "w-16" : "w-[350px]"
                    }`}>
                      <CardHeader className={`space-y-2 pb-4 ${isCollapsed ? "p-2" : ""}`}>
                        <div className={`flex items-center ${isCollapsed ? "flex-col" : "justify-between"}`}>
                          <div className={`flex items-center ${isCollapsed ? "flex-col" : "space-x-3"} flex-1`}>
                            {isEditing ? (
                              <Input
                                value={editingColumnTitle}
                                onChange={(e) => setEditingColumnTitle(e.target.value)}
                                onKeyDown={(e) => handleKeyDown(e, 'column')}
                                className="h-8 text-base"
                                autoFocus
                              />
                            ) : (
                              <>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <div 
                                      className={`${column.color} cursor-pointer rounded transition-all ${
                                        isCollapsed ? "w-8 h-8 mb-2" : "w-3 h-3"
                                      }`}
                                    />
                                  </PopoverTrigger>
                                  <PopoverContent className="w-48 p-2">
                                    <div className="grid grid-cols-4 gap-1">
                                      {colorOptions.map((option) => (
                                        <button
                                          key={option.value}
                                          className={`w-8 h-8 rounded-full ${option.value} hover:ring-2 ring-offset-2 ring-offset-background ring-ring transition-all ${
                                            column.color === option.value ? "ring-2" : ""
                                          }`}
                                          onClick={() => handleColorChange(column.id, option.value)}
                                          title={option.name}
                                        />
                                      ))}
                                    </div>
                                  </PopoverContent>
                                </Popover>
                                <CardTitle 
                                  className={`text-xl font-semibold cursor-pointer transition-all ${
                                    isCollapsed ? "transform writing-mode-vertical-lr mt-2 whitespace-nowrap" : ""
                                  }`}
                                  onClick={() => {
                                    setEditingColumnId(column.id);
                                    setEditingColumnTitle(column.title);
                                  }}
                                >
                                  {column.title}
                                </CardTitle>
                              </>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${isCollapsed ? "mt-2" : ""}`}
                            onClick={() => toggleColumnCollapse(column.id)}
                          >
                            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                          </Button>
                        </div>
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
    </>
  );
}
