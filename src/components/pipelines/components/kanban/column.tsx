
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { UniqueIdentifier } from "@dnd-kit/core";
import { Lead } from "@/pages/dashboard/leads";
import { MoreHorizontal, ChevronLeft, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PipelineColumn } from "@/types/pipeline";
import { TaskCard } from "./TaskCard";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { colorOptions } from "../../constants/color-options";

export interface ColumnDragData {
  type: "Column";
  column: PipelineColumn;
}

interface KanbanColumnProps {
  column: PipelineColumn;
  columnLeads: Lead[];
  isEditing?: boolean;
  isCollapsed?: boolean;
  editingColumnTitle?: string;
  onEditColumnTitle?: (e: React.KeyboardEvent) => void;
  setEditingColumnTitle?: (title: string) => void;
  handleColorChange?: (columnId: string, color: string) => void;
  onDeleteStage?: (column: PipelineColumn) => void;
  toggleColumnCollapse?: () => void;
  setEditingColumnId?: (id: string | null) => void;
  onLeadClick?: (lead: Lead) => void;
  isPreview?: boolean;
  currentPipelineId?: string;
}

export function KanbanColumn({
  column,
  columnLeads,
  isEditing = false,
  isCollapsed = false,
  editingColumnTitle = "",
  onEditColumnTitle = () => {},
  setEditingColumnTitle = () => {},
  handleColorChange = () => {},
  onDeleteStage = () => {},
  toggleColumnCollapse = () => {},
  setEditingColumnId = () => {},
  onLeadClick = () => {},
  isPreview = false,
  currentPipelineId,
}: KanbanColumnProps) {
  const [isLocked, setIsLocked] = useState(false);
  
  // Make sure column title is never empty
  const displayTitle = column.title || "Untitled Stage";

  const {
    setNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: "Column",
      column,
    } as ColumnDragData,
    disabled: isLocked || isEditing || isPreview,
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
    minWidth: "300px", // Ensure minimum width
    width: "350px",    // Fixed width for consistency
    flex: "0 0 350px", // Prevent shrinking
  };

  // Get color class for the column header
  const colorClass = column.color || "bg-gray-500";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "h-full flex flex-col bg-card rounded-lg border shadow-sm",
        isDragging ? "opacity-50 border-dashed" : "",
        isPreview ? "column-preview-target" : ""
      )}
      {...attributes}
    >
      <div 
        className="py-2 px-4 font-medium border-b text-left flex flex-row justify-between items-center"
        style={{ 
          borderTopWidth: "4px", 
          borderTopStyle: "solid",
          borderTopColor: `var(--${colorClass.replace('bg-', '')})` 
        }}
      >
        <div className="flex items-center gap-2" {...listeners}>
          <Menu className="h-4 w-4 text-muted-foreground cursor-grab" />
          <div className={`w-3 h-3 rounded-full ${colorClass}`} />
          
          {isEditing ? (
            <Input
              value={editingColumnTitle}
              onChange={(e) => setEditingColumnTitle(e.target.value)}
              onKeyDown={onEditColumnTitle}
              autoFocus
              className="h-7 text-sm"
            />
          ) : (
            <h3 className="text-sm font-medium truncate max-w-[150px]">{displayTitle}</h3>
          )}
        </div>

        <div className="flex items-center gap-1">
          <span className="text-sm">{columnLeads.length}</span>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditingColumnId(column.id)}>
                Rename
              </DropdownMenuItem>
              <Popover>
                <PopoverTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    Change Color
                  </DropdownMenuItem>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-2" align="end">
                  <div className="flex flex-wrap gap-2 max-w-[220px]">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        className={`w-5 h-5 rounded-full ${color.value} hover:ring-2 ring-offset-1`}
                        onClick={() => handleColorChange(column.id, color.value)}
                        aria-label={`Select ${color.name} color`}
                      />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => onDeleteStage(column)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={toggleColumnCollapse}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="p-2 flex-1 overflow-y-auto space-y-2 min-h-[400px]">
        {columnLeads.length === 0 ? (
          <div className="min-h-[100px] flex items-center justify-center border border-dashed rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground">Drop leads here</p>
          </div>
        ) : (
          columnLeads.map((lead) => (
            <TaskCard 
              key={lead.id} 
              lead={lead} 
              onClick={() => onLeadClick(lead)} 
            />
          ))
        )}
      </div>
    </div>
  );
}
