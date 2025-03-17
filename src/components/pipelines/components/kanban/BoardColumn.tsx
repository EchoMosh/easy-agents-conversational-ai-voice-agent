
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { UniqueIdentifier } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useMemo } from "react";
import { TaskCard } from "./TaskCard";
import { Lead } from "@/pages/dashboard/leads";
import { cva } from "class-variance-authority";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, Pencil, MoreVertical } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PipelineColumn } from "@/types/pipeline";
import { verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { colorOptions } from "../../constants/color-options";
import { Input } from "@/components/ui/input";

export interface Column {
  id: UniqueIdentifier;
  title: string;
  color?: string;
}

export type ColumnType = "Column";

export interface ColumnDragData {
  type: ColumnType;
  column: Column;
}

interface BoardColumnProps {
  column: PipelineColumn;
  columnLeads: Lead[];
  isOverlay?: boolean;
  isEditing?: boolean;
  editingColumnTitle?: string;
  onEditColumnTitle?: (e: React.KeyboardEvent) => void;
  setEditingColumnTitle?: (title: string) => void;
  handleColorChange?: (columnId: string, color: string) => void;
  onDeleteStage?: (column: PipelineColumn) => void;
  setEditingColumnId?: (id: string | null) => void;
  onLeadClick?: (lead: Lead) => void;
}

export function BoardColumn({ 
  column, 
  columnLeads, 
  isOverlay,
  isEditing = false,
  editingColumnTitle = "",
  onEditColumnTitle,
  setEditingColumnTitle,
  handleColorChange,
  setEditingColumnId,
  onLeadClick
}: BoardColumnProps) {
  const leadsIds = useMemo(() => {
    return columnLeads.map((lead) => lead.id);
  }, [columnLeads]);

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
    attributes: {
      roleDescription: `Column: ${column.title}`,
    },
  });

  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
  };

  const variants = cva(
    "h-[500px] max-h-[500px] w-[350px] max-w-full flex flex-col flex-shrink-0 snap-center",
    {
      variants: {
        dragging: {
          default: "border-2 border-transparent",
          over: "ring-2 opacity-30",
          overlay: "ring-2 ring-primary",
        },
      },
    }
  );

  // Get border color for the column
  const getBorderColor = () => {
    const colorClass = column.color;
    if (!colorClass) return "";
    
    return colorClass.replace("bg-", "border-t-");
  };

  const handleEditTitleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (setEditingColumnId) {
      setEditingColumnId(column.id);
      if (setEditingColumnTitle) {
        setEditingColumnTitle(column.title);
      }
    }
  };

  const handleColorChangeClick = (e: React.MouseEvent, color: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (handleColorChange) {
      handleColorChange(column.id, color);
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`${variants({
        dragging: isOverlay ? "overlay" : isDragging ? "over" : undefined,
      })} bg-muted/30 border-t-4 ${getBorderColor()}`}
    >
      <CardHeader className="p-4 font-semibold border-b-2 text-left flex flex-row justify-between items-center">
        <Button
          variant="ghost"
          {...attributes}
          {...listeners}
          className="p-1 text-primary/50 -ml-2 h-auto cursor-grab relative"
        >
          <span className="sr-only">{`Move column: ${column.title}`}</span>
          <GripVertical className="h-4 w-4" />
        </Button>
        
        {isEditing ? (
          <Input
            value={editingColumnTitle}
            onChange={(e) => setEditingColumnTitle && setEditingColumnTitle(e.target.value)}
            onKeyDown={onEditColumnTitle}
            className="h-8 text-base"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <div 
                  className={`${column.color} cursor-pointer rounded-md transition-all ring-offset-2 hover:ring-2 ring-offset-background ring-gray-200 dark:ring-gray-700 w-4 h-4`}
                  onClick={(e) => e.stopPropagation()}
                />
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2" onClick={(e) => e.stopPropagation()}>
                <div className="grid grid-cols-4 gap-1">
                  {colorOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`w-8 h-8 rounded-md ${option.value} hover:ring-2 ring-offset-2 ring-offset-background ring-ring transition-all ${
                        column.color === option.value ? "ring-2" : ""
                      }`}
                      onClick={(e) => handleColorChangeClick(e, option.value)}
                      title={option.name}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            
            <div 
              className="group flex items-center gap-1 cursor-pointer"
              onClick={handleEditTitleClick}
            >
              <h3 className="text-lg font-medium">{column.title}</h3>
              <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        )}
        
        <div className="flex items-center">
          <span className="text-xs text-muted-foreground font-medium mr-2">
            {columnLeads.length}
          </span>
        </div>
      </CardHeader>
      
      <ScrollArea>
        <CardContent className="flex flex-grow flex-col gap-2 p-2">
          <SortableContext items={leadsIds} strategy={verticalListSortingStrategy}>
            {columnLeads.length > 0 ? (
              columnLeads.map((lead) => (
                <TaskCard 
                  key={lead.id} 
                  lead={lead}
                  onClick={() => onLeadClick && onLeadClick(lead)}
                />
              ))
            ) : (
              <div className="flex items-center justify-center h-24 border border-dashed rounded-md border-muted-foreground/20">
                <p className="text-sm text-muted-foreground">
                  Drop leads here
                </p>
              </div>
            )}
          </SortableContext>
        </CardContent>
      </ScrollArea>
    </Card>
  );
}

export function BoardContainer({ children }: { children: React.ReactNode }) {
  return (
    <ScrollArea className="px-2 md:px-0 flex lg:justify-center pb-4 snap-x snap-mandatory">
      <div className="flex gap-4 items-center flex-row justify-center">
        {children}
      </div>
    </ScrollArea>
  );
}
