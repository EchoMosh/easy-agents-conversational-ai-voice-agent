import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  DndContext,
  DragOverlay,
  rectIntersection,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Pipeline, PipelineColumn } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Plus, Trash2, Pencil } from "lucide-react";

// ---- Color map ----
const COLOR_HEX: Record<string, string> = {
  "bg-blue-500": "#3b82f6",
  "bg-yellow-500": "#eab308",
  "bg-green-500": "#22c55e",
  "bg-purple-500": "#a855f7",
  "bg-indigo-500": "#6366f1",
  "bg-emerald-500": "#10b981",
  "bg-red-500": "#ef4444",
  "bg-orange-500": "#f97316",
  "bg-pink-500": "#ec4899",
  "bg-teal-500": "#14b8a6",
  "bg-cyan-500": "#06b6d4",
};
function colorHex(c: string) {
  return COLOR_HEX[c] || "#94a3b8";
}

// ========== DRAGGABLE CARD ==========
function DraggableCard({
  lead,
  color,
  columnId,
  onClick,
}: {
  lead: Lead;
  color: string;
  columnId: string;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: lead.id,
      data: { lead, columnId },
    });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: transform ? CSS.Translate.toString(transform) : undefined,
        opacity: isDragging ? 0.3 : 1,
      }}
      {...listeners}
      {...attributes}
    >
      <Card
        onClick={!isDragging ? onClick : undefined}
        className="p-2.5 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow border-l-[3px]"
        style={{ borderLeftColor: color }}
      >
        <p className="font-medium text-sm truncate">{lead.name}</p>
        {lead.email && (
          <div className="flex items-center gap-1.5 mt-1">
            <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground truncate">
              {lead.email}
            </span>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground truncate">
              {lead.phone}
            </span>
          </div>
        )}
      </Card>
    </div>
  );
}

// ========== STATIC OVERLAY CARD (for drag preview) ==========
function OverlayCard({ lead, color }: { lead: Lead; color: string }) {
  return (
    <Card
      className="p-2.5 shadow-lg ring-2 ring-primary/20 border-l-[3px] w-[250px]"
      style={{ borderLeftColor: color }}
    >
      <p className="font-medium text-sm truncate">{lead.name}</p>
      {lead.email && (
        <div className="flex items-center gap-1.5 mt-1">
          <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground truncate">
            {lead.email}
          </span>
        </div>
      )}
      {lead.phone && (
        <div className="flex items-center gap-1.5 mt-0.5">
          <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground truncate">
            {lead.phone}
          </span>
        </div>
      )}
    </Card>
  );
}

// ========== DROPPABLE COLUMN ==========
function DroppableColumn({
  column,
  leads,
  onLeadClick,
  onEditTitle,
  onDelete,
  canDelete,
}: {
  column: PipelineColumn;
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onEditTitle: (id: string, title: string) => void;
  onDelete: (col: PipelineColumn) => void;
  canDelete: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(column.title);
  const hex = colorHex(column.color);

  const saveTitle = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== column.title) {
      onEditTitle(column.id, trimmed);
    }
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col w-[270px] shrink-0 h-full">
      {/* Header */}
      <div
        className="rounded-t-lg px-3 py-2.5 flex items-center justify-between border border-b-0 bg-muted/40"
        style={{ borderTopColor: hex, borderTopWidth: "3px" }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isEditing ? (
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => e.key === "Enter" && saveTitle()}
              className="h-7 text-sm font-semibold"
              autoFocus
            />
          ) : (
            <span
              className="text-sm font-semibold truncate cursor-pointer hover:text-primary"
              onDoubleClick={() => {
                setEditValue(column.title);
                setIsEditing(true);
              }}
            >
              {column.title}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Badge
            variant="secondary"
            className="text-xs tabular-nums h-5 px-1.5"
          >
            {leads.length}
          </Badge>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setEditValue(column.title);
              setIsEditing(true);
            }}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          {canDelete && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(column)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={`flex-1 border border-t-0 rounded-b-lg p-2 space-y-2 overflow-y-auto transition-colors ${
          isOver ? "bg-primary/5 border-primary/30" : "bg-background"
        }`}
      >
        {leads.map((lead) => (
          <DraggableCard
            key={lead.id}
            lead={lead}
            color={hex}
            columnId={column.id}
            onClick={() => onLeadClick(lead)}
          />
        ))}
        {leads.length === 0 && !isOver && (
          <div className="flex items-center justify-center h-20 border border-dashed rounded-md text-muted-foreground/50">
            <span className="text-xs">Drop leads here</span>
          </div>
        )}
        {isOver && (
          <div className="h-12 border-2 border-dashed border-primary/40 rounded-md bg-primary/5 flex items-center justify-center">
            <span className="text-xs text-primary/60 font-medium">
              Drop here
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ========== MAIN BOARD ==========
interface KanbanBoardProps {
  pipeline: Pipeline;
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onEditColumnTitle: (columnId: string, title: string) => void;
  onDeleteStage: (column: PipelineColumn) => Promise<void>;
  onAddStage: (stage: PipelineColumn) => void;
  onLeadMoved: () => void;
}

export function KanbanBoard({
  pipeline,
  leads,
  onLeadClick,
  onEditColumnTitle,
  onDeleteStage,
  onAddStage,
  onLeadMoved,
}: KanbanBoardProps) {
  // LOCAL state: leads grouped by column title (the source of truth during drag)
  const [columns, setColumns] = useState<Record<string, Lead[]>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const skipNextSync = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  // Sync from props -> local state whenever leads or pipeline changes
  // BUT skip sync right after an optimistic drag move (local state is already correct)
  useEffect(() => {
    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }
    const grouped: Record<string, Lead[]> = {};
    for (const col of pipeline.columns) {
      grouped[col.title] = [];
    }
    for (const lead of leads) {
      const status = (lead.status || "").toLowerCase();
      const col = pipeline.columns.find(
        (c) => c.title.toLowerCase() === status,
      );
      if (col) {
        grouped[col.title] = grouped[col.title] || [];
        grouped[col.title].push(lead);
      }
    }
    setColumns(grouped);
  }, [leads, pipeline.columns]);

  // Find which column title a lead is currently in
  const findColumnTitle = useCallback(
    (leadId: string): string | null => {
      for (const [title, colLeads] of Object.entries(columns)) {
        if (colLeads.some((l) => l.id === leadId)) return title;
      }
      return null;
    },
    [columns],
  );

  const activeLead = useMemo(() => {
    if (!activeId) return null;
    for (const colLeads of Object.values(columns)) {
      const found = colLeads.find((l) => l.id === activeId);
      if (found) return found;
    }
    return null;
  }, [activeId, columns]);

  const activeLeadColumn = useMemo(() => {
    if (!activeId) return null;
    return findColumnTitle(activeId);
  }, [activeId, findColumnTitle]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveId(null);

      const { active, over } = event;
      if (!over) return;

      const leadId = String(active.id);
      const sourceColumnTitle = findColumnTitle(leadId);
      if (!sourceColumnTitle) return;

      // The droppable ID is the column.id, we need the column title
      const targetCol = pipeline.columns.find((c) => c.id === String(over.id));
      // Also check if dropped on another lead's column
      const overLeadColumn =
        active.data.current?.columnId !== String(over.id)
          ? findColumnTitle(String(over.id))
          : null;

      const targetColumnTitle = targetCol?.title || overLeadColumn;
      if (!targetColumnTitle || targetColumnTitle === sourceColumnTitle) return;

      // Find the actual lead object
      const lead = columns[sourceColumnTitle]?.find((l) => l.id === leadId);
      if (!lead) return;

      // OPTIMISTIC: Move in local state immediately
      setColumns((prev) => {
        const newCols = { ...prev };
        newCols[sourceColumnTitle] = prev[sourceColumnTitle].filter(
          (l) => l.id !== leadId,
        );
        newCols[targetColumnTitle] = [
          ...(prev[targetColumnTitle] || []),
          { ...lead, status: targetColumnTitle },
        ];
        return newCols;
      });

      // PERSIST to DB
      try {
        const { error } = await supabase
          .from("leads")
          .update({ status: targetColumnTitle })
          .eq("id", leadId);

        if (error) throw error;
        // Skip the next useEffect sync since local state is already correct
        skipNextSync.current = true;
        onLeadMoved();
      } catch (err) {
        console.error("Failed to move lead:", err);
        toast.error("Failed to move lead");
        // REVERT: put lead back
        setColumns((prev) => {
          const newCols = { ...prev };
          newCols[targetColumnTitle] = prev[targetColumnTitle].filter(
            (l) => l.id !== leadId,
          );
          newCols[sourceColumnTitle] = [...prev[sourceColumnTitle], lead];
          return newCols;
        });
      }
    },
    [columns, pipeline.columns, findColumnTitle, onLeadMoved],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 p-4 h-full overflow-x-auto">
        {pipeline.columns.map((column) => (
          <DroppableColumn
            key={column.id}
            column={column}
            leads={columns[column.title] || []}
            onLeadClick={onLeadClick}
            onEditTitle={onEditColumnTitle}
            onDelete={onDeleteStage}
            canDelete={pipeline.columns.length > 1}
          />
        ))}

        <button
          onClick={() => {
            const existingTitles = new Set(
              pipeline.columns.map((c) => c.title),
            );
            let title = "New Stage";
            let counter = 2;
            while (existingTitles.has(title)) {
              title = `New Stage ${counter}`;
              counter++;
            }
            onAddStage({
              id: String(Date.now()),
              title,
              color: "bg-blue-500",
            });
          }}
          className="flex items-center justify-center w-[270px] shrink-0 h-20 self-start mt-[3px] border-2 border-dashed border-muted-foreground/20 rounded-lg text-muted-foreground/50 hover:border-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
        >
          <Plus className="h-5 w-5 mr-1" />
          <span className="text-sm font-medium">Add Stage</span>
        </button>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeLead && (
          <OverlayCard
            lead={activeLead}
            color={
              activeLeadColumn
                ? colorHex(
                    pipeline.columns.find((c) => c.title === activeLeadColumn)
                      ?.color || "",
                  )
                : "#94a3b8"
            }
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
