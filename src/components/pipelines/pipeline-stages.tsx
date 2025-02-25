
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Pipeline, PipelineColumn } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Plus, Settings } from "lucide-react";
import { DroppableColumn } from "@/pages/dashboard/pipelines";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LeadCard } from "@/components/leads/lead-card";
import { useState } from "react";

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
}: PipelineStagesProps) {
  const [collapsedStages, setCollapsedStages] = useState<string[]>([]);
  const [showNewStageInput, setShowNewStageInput] = useState(false);
  const [newStageTitle, setNewStageTitle] = useState("");

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

  const toggleStageCollapse = (stageId: string) => {
    setCollapsedStages(prev =>
      prev.includes(stageId)
        ? prev.filter(id => id !== stageId)
        : [...prev, stageId]
    );
  };

  const handleAddStage = () => {
    if (!newStageTitle.trim()) return;
    
    const newStage: PipelineColumn = {
      id: newStageTitle.toLowerCase().replace(/\s+/g, '-'),
      title: newStageTitle,
      color: "bg-gray-500", // Default color
    };

    onAddStage(newStage);
    setNewStageTitle("");
    setShowNewStageInput(false);
  };

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">{selectedPipeline.name}</h2>
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
            <Button variant="outline" onClick={onEditColumns}>
              <Settings className="w-4 h-4 mr-2" />
              Edit Stages
            </Button>
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

      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {columns.map((column) => {
            const columnLeads = leads.filter((lead) => lead.status === column.id);
            const isCollapsed = collapsedStages.includes(column.id);
            
            return (
              <DroppableColumn key={column.id} id={column.id}>
                <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50 shadow-md hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="space-y-2 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        {editingColumns ? (
                          <Input
                            value={column.title}
                            onChange={(e) => onEditColumnTitle(column.id, e.target.value)}
                            className="h-8 text-base"
                          />
                        ) : (
                          <>
                            <div className={`w-3 h-3 rounded-full ${column.color}`} />
                            <CardTitle className="text-xl font-semibold">
                              {column.title}
                            </CardTitle>
                          </>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => toggleStageCollapse(column.id)}
                      >
                        {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                      </Button>
                    </div>
                    <div className="text-sm text-muted-foreground/80 font-medium">
                      {columnLeads.length} lead{columnLeads.length !== 1 ? 's' : ''}
                    </div>
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
            );
          })}
        </div>
      </DndContext>
    </>
  );
}
