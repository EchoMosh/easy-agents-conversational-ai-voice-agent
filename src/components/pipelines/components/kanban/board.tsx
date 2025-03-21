
import { useEffect, useState } from "react";
import { 
  DndContext, 
  DragEndEvent, 
  DragMoveEvent, 
  DragOverEvent, 
  DragStartEvent,
  useSensor, 
  useSensors 
} from "@dnd-kit/core";
import { SortableContext } from "@dnd-kit/sortable";
import { KanbanColumn as Column } from "./column"; // Updated import path with correct component name
import { Card } from "./card";
import { Lead } from "@/pages/dashboard/leads";
import { usePipelineDrag } from "@/hooks/pipeline/use-pipeline-drag";
import { useBoardSensors } from "./hooks/use-board-sensors";

interface ActiveItem {
  id: string;
  type: 'column' | 'lead';
  data: any;
  x: number; // Added x coordinate for drag positioning
  y: number; // Added y coordinate for drag positioning
}

// Extending the hook with mock data for development
export function Board() {
  // Temporary mock data until we properly connect to the pipeline data
  const [columns, setColumns] = useState([
    { id: "1", title: "New", color: "blue" },
    { id: "2", title: "Contacted", color: "yellow" },
    { id: "3", title: "Qualified", color: "green" }
  ]);
  
  const [leads, setLeads] = useState<Record<string, Lead[]>>({
    "1": [
      { id: "l1", name: "John Doe", email: "john@example.com", phone: "123-456-7890", status: "New", pipeline_id: "1", created_at: "", user_id: "", updated_at: "" },
      { id: "l2", name: "Jane Smith", email: "jane@example.com", phone: "123-456-7890", status: "New", pipeline_id: "1", created_at: "", user_id: "", updated_at: "" }
    ],
    "2": [
      { id: "l3", name: "Bob Johnson", email: "bob@example.com", phone: "123-456-7890", status: "Contacted", pipeline_id: "1", created_at: "", user_id: "", updated_at: "" }
    ],
    "3": [
      { id: "l4", name: "Alice Brown", email: "alice@example.com", phone: "123-456-7890", status: "Qualified", pipeline_id: "1", created_at: "", user_id: "", updated_at: "" }
    ]
  });
  
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeColumn, setActiveColumn] = useState<ActiveItem | null>(null);
  const [containers, setContainers] = useState(Object.keys(leads));
  
  // Get the sensors from our custom hook
  const sensors = useBoardSensors();
  
  // Connect to the pipeline drag hook for actual drag handling
  const { 
    handleDragEnd: onDragEnd, 
    handleDragOver: onDragOver, 
    isUpdating, 
    previewColumnId, 
    previewIndex,
    resetDragState
  } = usePipelineDrag();
  
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id.toString());
    
    const activeData = active.data.current;
    if (activeData?.type === 'column') {
      const column = columns.find(col => col.id === active.id);
      if (column) {
        setActiveColumn({
          id: active.id.toString(),
          type: 'column',
          data: column,
          x: 0, // Initialize with zero position
          y: 0
        });
      }
    } else if (activeData?.type === 'lead') {
      const columnId = activeData.columnId;
      const lead = leads[columnId]?.find(l => l.id === active.id);
      if (lead) {
        setActiveColumn({
          id: active.id.toString(),
          type: 'lead',
          data: lead,
          x: 0, // Initialize with zero position
          y: 0
        });
      }
    }
  };
  
  const handleDragMove = (event: DragMoveEvent) => {
    if (!activeColumn) return;
    
    const { delta } = event;
    setActiveColumn(prev => {
      if (!prev) return null;
      return {
        ...prev,
        x: delta.x,
        y: delta.y
      };
    });
  };
  
  const handleDragCancel = () => {
    setActiveId(null);
    setActiveColumn(null);
  };
  
  const handleLeadClick = (lead: Lead) => {
    console.log("Lead clicked:", lead);
    // Implement your lead click handler
  };

  if (!columns) {
    return <div>Loading...</div>;
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="board-wrapper mx-auto flex">
        <SortableContext items={columns.map((column) => column.id)}>
          <div className="board flex gap-4 p-4 h-[calc(100vh-8rem)] items-start overflow-x-auto">
            {columns.map((column) => (
              <Column
                key={column.id}
                id={column.id}
                title={column.title}
                color={column.color}
                leadCount={leads[column.id]?.length || 0}
              >
                <SortableContext items={leads[column.id] || []}>
                  <div className="tasks-container p-2 rounded-md min-h-[100px]">
                    {leads[column.id]?.map((lead: Lead) => (
                      <Card
                        key={lead.id}
                        lead={lead}
                        onClick={() => handleLeadClick(lead)}
                      />
                    )) || null}
                  </div>
                </SortableContext>
              </Column>
            ))}
          </div>
        </SortableContext>

        {activeId && activeColumn && (
          <div className="drag-overlay fixed inset-0 pointer-events-none z-50">
            {/* Overlay representation of the dragging column */}
            {activeColumn.type === "column" && activeColumn.data && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  transform: `translate(${activeColumn.x}px, ${activeColumn.y}px) rotate(-2deg)`,
                  width: "300px",
                  opacity: 0.8,
                  transition: "transform 0.1s ease",
                }}
                className="column-drag-preview bg-white border border-gray-200 rounded-md shadow-md"
              >
                <div className={`column-header p-3 rounded-t-md text-white bg-${activeColumn.data.color || 'blue'}-600`}>
                  <h3 className="font-medium truncate">{activeColumn.data.title}</h3>
                </div>
                <div className="p-2 rounded-b-md bg-white">
                  {leads[activeColumn.data.id]?.slice(0, 2).map((lead: Lead) => (
                    <div key={lead.id} className="p-2 mb-2 bg-gray-50 border rounded-md">
                      <h4 className="font-medium truncate">{lead.name}</h4>
                    </div>
                  ))}
                  {leads[activeColumn.data.id]?.length > 2 && (
                    <div className="text-sm text-center text-gray-500">
                      +{leads[activeColumn.data.id].length - 2} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Overlay representation of the dragging lead */}
            {activeColumn.type === "lead" && activeColumn.data && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  top: 0,
                  transform: `translate(${activeColumn.x}px, ${activeColumn.y}px) rotate(2deg)`,
                  width: "300px",
                  opacity: 0.9,
                  transition: "transform 0.1s ease",
                }}
                className="lead-drag-preview"
              >
                <Card lead={activeColumn.data} isOverlay />
              </div>
            )}
          </div>
        )}
      </div>
    </DndContext>
  );
}
