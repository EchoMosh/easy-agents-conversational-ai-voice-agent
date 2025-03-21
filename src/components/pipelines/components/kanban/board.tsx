
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
import { Column } from "./column-preview";
import { Card } from "./card";
import { Lead } from "@/pages/dashboard/leads";
import { usePipelineDrag } from "@/hooks/pipeline/use-pipeline-drag";

interface ActiveItem {
  id: string;
  type: 'column' | 'lead';
  data: any;
}

export function Board() {
  const { 
    columns, 
    leads, 
    sensors,
    containers, 
    activeId, 
    activeColumn,
    setActiveColumn,
    handleDragStart, 
    handleDragOver, 
    handleDragEnd, 
    handleDragCancel,
    handleLeadClick
  } = usePipelineDrag();

  if (!columns) {
    return <div>Loading...</div>;
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
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
