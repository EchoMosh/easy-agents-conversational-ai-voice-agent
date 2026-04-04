import { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Pipeline, PipelineColumn } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, GripVertical, Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// ---- Lead Card (Draggable) ----
function LeadCard({
  lead,
  columnColor,
  onClick,
  isOverlay,
}: {
  lead: Lead;
  columnColor?: string;
  onClick?: () => void;
  isOverlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: lead.id,
      data: { type: "lead", lead },
    });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        zIndex: isDragging ? 50 : undefined,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`${isDragging && !isOverlay ? "opacity-30" : ""}`}
    >
      <Card
        onClick={!isDragging ? onClick : undefined}
        className={`p-2.5 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow border-l-[3px] ${
          isOverlay ? "shadow-lg ring-2 ring-primary/20" : ""
        }`}
        style={{
          borderLeftColor: columnColor || "var(--border)",
        }}
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

// ---- Column (Droppable) ----
function Column({
  column,
  leads,
  onLeadClick,
  onEditTitle,
  onDeleteColumn,
  canDelete,
}: {
  column: PipelineColumn;
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onEditTitle: (columnId: string, title: string) => void;
  onDeleteColumn: (column: PipelineColumn) => void;
  canDelete: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `column-${column.id}`,
    data: { type: "column", column },
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);

  const colorHex = getColorHex(column.color);

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle.trim() !== column.title) {
      onEditTitle(column.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col w-[270px] shrink-0 h-full">
      {/* Header */}
      <div
        className="rounded-t-lg px-3 py-2.5 flex items-center justify-between border border-b-0 bg-muted/40"
        style={{ borderTopColor: colorHex, borderTopWidth: "3px" }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {isEditing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={handleSaveTitle}
              onKeyDown={(e) => e.key === "Enter" && handleSaveTitle()}
              className="h-7 text-sm font-semibold"
              autoFocus
            />
          ) : (
            <span
              className="text-sm font-semibold truncate cursor-pointer hover:text-primary"
              onDoubleClick={() => {
                setEditTitle(column.title);
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
              setEditTitle(column.title);
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
              onClick={() => onDeleteColumn(column)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Droppable area */}
      <div
        ref={setNodeRef}
        className={`flex-1 border border-t-0 rounded-b-lg p-2 space-y-2 overflow-y-auto transition-colors ${
          isOver ? "bg-primary/5 border-primary/30" : "bg-background"
        }`}
      >
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            columnColor={colorHex}
            onClick={() => onLeadClick(lead)}
          />
        ))}

        {leads.length === 0 && !isOver && (
          <div className="flex items-center justify-center h-20 border border-dashed rounded-md text-muted-foreground/50">
            <span className="text-xs">Drop leads here</span>
          </div>
        )}

        {isOver && (
          <div className="flex items-center justify-center h-12 border-2 border-dashed border-primary/40 rounded-md bg-primary/5">
            <span className="text-xs text-primary/60 font-medium">
              Drop here
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Color helper ----
function getColorHex(color: string): string {
  const map: Record<string, string> = {
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
  return map[color] || "#94a3b8";
}

// ---- Main Board ----
interface KanbanBoardProps {
  pipeline: Pipeline;
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
  onEditColumnTitle: (columnId: string, title: string) => void;
  onDeleteStage: (column: PipelineColumn) => Promise<void>;
  onAddStage: (stage: PipelineColumn) => void;
  onLeadMoved: () => void; // callback to refetch after DB update
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
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [optimisticMoves, setOptimisticMoves] = useState<
    Record<string, string>
  >({});

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  // Group leads by column (with optimistic overrides)
  const leadsByColumn = useMemo(() => {
    const grouped: Record<string, Lead[]> = {};
    for (const col of pipeline.columns) {
      grouped[col.id] = [];
    }
    for (const lead of leads) {
      const effectiveStatus = optimisticMoves[lead.id] || lead.status;
      const col = pipeline.columns.find(
        (c) => c.title.toLowerCase() === (effectiveStatus || "").toLowerCase(),
      );
      if (col) {
        grouped[col.id] = grouped[col.id] || [];
        grouped[col.id].push(lead);
      }
    }
    return grouped;
  }, [leads, pipeline.columns, optimisticMoves]);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const lead = event.active.data.current?.lead as Lead | undefined;
    if (lead) setActiveLead(lead);
  }, []);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveLead(null);

      const { active, over } = event;
      if (!over) return;

      const lead = active.data.current?.lead as Lead | undefined;
      if (!lead) return;

      // Get target column
      const overId = String(over.id);
      let targetColumn: PipelineColumn | undefined;

      if (overId.startsWith("column-")) {
        const colId = overId.replace("column-", "");
        targetColumn = pipeline.columns.find((c) => c.id === colId);
      } else {
        // Dropped on another lead - find which column it's in
        const overLead = leads.find((l) => l.id === overId);
        if (overLead) {
          const overStatus = optimisticMoves[overLead.id] || overLead.status;
          targetColumn = pipeline.columns.find(
            (c) => c.title.toLowerCase() === (overStatus || "").toLowerCase(),
          );
        }
      }

      if (!targetColumn) return;

      // Skip if same column
      const currentStatus = optimisticMoves[lead.id] || lead.status;
      if (currentStatus?.toLowerCase() === targetColumn.title.toLowerCase()) {
        return;
      }

      // Optimistic update - move instantly in UI
      setOptimisticMoves((prev) => ({
        ...prev,
        [lead.id]: targetColumn!.title,
      }));

      // Persist to DB in background
      try {
        const { error } = await supabase
          .from("leads")
          .update({ status: targetColumn.title })
          .eq("id", lead.id);

        if (error) throw error;

        // Clear optimistic override and refetch
        setOptimisticMoves((prev) => {
          const next = { ...prev };
          delete next[lead.id];
          return next;
        });
        onLeadMoved();
      } catch (err) {
        console.error("Failed to move lead:", err);
        toast.error("Failed to move lead");
        // Revert optimistic update
        setOptimisticMoves((prev) => {
          const next = { ...prev };
          delete next[lead.id];
          return next;
        });
      }
    },
    [leads, pipeline.columns, optimisticMoves, onLeadMoved],
  );

  const activeLeadColor = useMemo(() => {
    if (!activeLead) return undefined;
    const status = optimisticMoves[activeLead.id] || activeLead.status;
    const col = pipeline.columns.find(
      (c) => c.title.toLowerCase() === (status || "").toLowerCase(),
    );
    return col ? getColorHex(col.color) : undefined;
  }, [activeLead, pipeline.columns, optimisticMoves]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 p-4 h-full overflow-x-auto">
        {pipeline.columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            leads={leadsByColumn[column.id] || []}
            onLeadClick={onLeadClick}
            onEditTitle={onEditColumnTitle}
            onDeleteColumn={onDeleteStage}
            canDelete={pipeline.columns.length > 1}
          />
        ))}

        {/* Add Stage */}
        <button
          onClick={() =>
            onAddStage({
              id: String(Date.now()),
              title: "New Stage",
              color: "bg-blue-500",
            })
          }
          className="flex items-center justify-center w-[270px] shrink-0 h-20 self-start mt-[3px] border-2 border-dashed border-muted-foreground/20 rounded-lg text-muted-foreground/50 hover:border-muted-foreground/40 hover:text-muted-foreground/70 transition-colors"
        >
          <Plus className="h-5 w-5 mr-1" />
          <span className="text-sm font-medium">Add Stage</span>
        </button>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeLead && (
          <LeadCard lead={activeLead} columnColor={activeLeadColor} isOverlay />
        )}
      </DragOverlay>
    </DndContext>
  );
}
