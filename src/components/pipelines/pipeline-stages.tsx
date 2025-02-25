import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Pipeline, PipelineColumn } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";
import { Button } from "@/components/ui/button";
import { GripVertical, Plus, Settings, Trash2 } from "lucide-react";
import { DroppableColumn } from "@/pages/dashboard/pipelines";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LeadCard } from "@/components/leads/lead-card";
import { useState } from "react";
import { useSortable, SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

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

interface ColorPickerProps {
  color: string;
  onColorChange: (color: string) => void;
}

function ColorPicker({ color, onColorChange }: ColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <div className={`w-4 h-4 rounded-full ${color}`} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2">
        <div className="grid grid-cols-4 gap-1">
          {colorOptions.map((option) => (
            <button
              key={option.value}
              className={`w-8 h-8 rounded-full ${option.value} hover:ring-2 ring-offset-2 ring-offset-background ring-ring transition-all ${
                color === option.value ? "ring-2" : ""
              }`}
              onClick={() => onColorChange(option.value)}
              title={option.name}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface PipelineStagesProps {
  selectedPipeline: Pipeline;
  leads: Lead[];
  editingColumns: boolean;
  editedColumns: PipelineColumn[];
  onEditColumns: () => void;
  onSaveColumns: () => void;
  onDragEnd: (event: DragEndEvent) => void;
  onEditColumnTitle: (columnId: string, newTitle: string) => void;
  onLeadClick: (lead: Lead) => void;
  onAddStage: (stage: PipelineColumn) => void;
  onDeletePipeline: () => void;
  onEditPipelineName: (name: string) => void;
  onReorderColumns: (newOrder: PipelineColumn[]) => void;
}

function SortableStage({ column, children, disabled }: { column: PipelineColumn; children: React.ReactNode; disabled: boolean }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ 
    id: column.id,
    disabled
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      {!disabled ? (
        <div {...listeners}>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export function PipelineStages({
  selectedPipeline,
  leads,
  editingColumns,
  editedColumns,
  onEditColumns,
  onSaveColumns,
  onDragEnd,
  onEditColumnTitle,
  onLeadClick,
  onAddStage,
  onDeletePipeline,
  onEditPipelineName,
  onReorderColumns,
}: PipelineStagesProps) {
  const [showNewStageInput, setShowNewStageInput] = useState(false);
  const [newStageTitle, setNewStageTitle] = useState("");
  const [editingPipelineName, setEditingPipelineName] = useState(false);
  const [pipelineName, setPipelineName] = useState(selectedPipeline.name);

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

  const columns = editingColumns ? editedColumns : selectedPipeline.columns;

  const handleAddStage = () => {
    if (!newStageTitle.trim()) return;
    
    const newStage: PipelineColumn = {
      id: crypto.randomUUID(),
      title: newStageTitle,
      color: "bg-gray-500",
    };

    onAddStage(newStage);
    setNewStageTitle("");
    setShowNewStageInput(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (editingColumns) {
      const { active, over } = event;

      if (!over || active.id === over.id) return;

      const oldIndex = editedColumns.findIndex((col) => col.id === active.id);
      const newIndex = editedColumns.findIndex((col) => col.id === over.id);

      const newColumns = [...editedColumns];
      const [removed] = newColumns.splice(oldIndex, 1);
      newColumns.splice(newIndex, 0, removed);

      onReorderColumns(newColumns);
    } else {
      onDragEnd(event);
    }
  };

  const handleSavePipelineName = () => {
    if (pipelineName.trim()) {
      onEditPipelineName(pipelineName);
      setEditingPipelineName(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSavePipelineName();
    } else if (e.key === 'Escape') {
      setEditingPipelineName(false);
      setPipelineName(selectedPipeline.name);
    }
  };

  const handleColorChange = (columnId: string, newColor: string) => {
    const newColumns = [...editedColumns];
    const index = newColumns.findIndex(c => c.id === columnId);
    newColumns[index] = { ...newColumns[index], color: newColor };
    onReorderColumns(newColumns);
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
                onKeyDown={handleKeyDown}
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
        <div className="flex gap-2">
          {editingColumns ? (
            <>
              <Button onClick={() => setShowNewStageInput(true)} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Stage
              </Button>
              <Button onClick={onSaveColumns}>
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={onEditColumns}>
                <Settings className="w-4 h-4 mr-2" />
                Edit Stages
              </Button>
              <Button variant="destructive" onClick={onDeletePipeline}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Pipeline
              </Button>
            </>
          )}
        </div>
      </div>

      {showNewStageInput && (
        <div className="mb-4 flex gap-2">
          <Input
            value={newStageTitle}
            onChange={(e) => setNewStageTitle(e.target.value)}
            placeholder="Enter stage name..."
            className="max-w-xs"
          />
          <Button onClick={handleAddStage}>Add</Button>
          <Button variant="ghost" onClick={() => setShowNewStageInput(false)}>Cancel</Button>
        </div>
      )}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
          <SortableContext items={columns.map(col => col.id)} strategy={horizontalListSortingStrategy}>
            {columns.map((column) => {
              const columnLeads = leads.filter((lead) => lead.status === column.id);
              
              return (
                <SortableStage key={column.id} column={column} disabled={!editingColumns}>
                  <DroppableColumn id={column.id}>
                    <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50 shadow-md hover:shadow-lg">
                      <CardHeader className="space-y-2 pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3 flex-1">
                            {editingColumns && (
                              <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                            )}
                            {editingColumns ? (
                              <div className="flex items-center gap-2 flex-1">
                                <Input
                                  value={column.title}
                                  onChange={(e) => onEditColumnTitle(column.id, e.target.value)}
                                  className="h-8 text-base"
                                />
                                <ColorPicker 
                                  color={column.color}
                                  onColorChange={(color) => handleColorChange(column.id, color)}
                                />
                              </div>
                            ) : (
                              <>
                                <div className={`w-3 h-3 rounded-full ${column.color}`} />
                                <CardTitle className="text-xl font-semibold">
                                  {column.title}
                                </CardTitle>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground/80 font-medium">
                          {columnLeads.length} lead{columnLeads.length !== 1 ? 's' : ''}
                        </div>
                      </CardHeader>
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
                    </Card>
                  </DroppableColumn>
                </SortableStage>
              );
            })}
          </SortableContext>
        </div>
      </DndContext>
    </>
  );
}
