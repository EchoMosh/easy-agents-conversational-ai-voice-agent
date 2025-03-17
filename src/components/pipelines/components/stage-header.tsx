
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, MoreVertical, Trash2, Pencil } from "lucide-react";
import { colorOptions } from "../constants/color-options";
import { PipelineColumn } from "@/types/pipeline";

interface StageHeaderProps {
  column: PipelineColumn;
  isEditing: boolean;
  isCollapsed: boolean;
  editingColumnTitle: string;
  onEditColumnTitle: (e: React.KeyboardEvent) => void;
  setEditingColumnTitle: (title: string) => void;
  handleColorChange: (columnId: string, color: string) => void;
  onDeleteStage: (column: PipelineColumn) => void;
  toggleColumnCollapse: (columnId: string) => void;
  setEditingColumnId: (id: string) => void;
}

export function StageHeader({
  column,
  isEditing,
  isCollapsed,
  editingColumnTitle,
  onEditColumnTitle,
  setEditingColumnTitle,
  handleColorChange,
  onDeleteStage,
  toggleColumnCollapse,
  setEditingColumnId,
}: StageHeaderProps) {
  // Handle delete with proper event stopping and delay
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Use timeout to avoid conflict with drag events
    setTimeout(() => {
      console.log("Delete stage clicked from stage header:", column.title);
      onDeleteStage(column);
    }, 50);
  };

  // Handle color change with proper event stopping
  const handleColorChangeClick = (e: React.MouseEvent, color: string) => {
    e.preventDefault();
    e.stopPropagation();
    handleColorChange(column.id, color);
  };

  // Handle edit title click with proper event stopping
  const handleEditTitleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingColumnId(column.id);
    setEditingColumnTitle(column.title);
  };

  // Handle collapse toggle with proper event stopping
  const handleCollapseToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleColumnCollapse(column.id);
  };

  return (
    <div className={`flex items-center ${isCollapsed ? "flex-col" : "justify-between"}`}>
      <div className={`flex items-center ${isCollapsed ? "flex-col" : "space-x-3"} flex-1`}>
        {isEditing ? (
          <Input
            value={editingColumnTitle}
            onChange={(e) => setEditingColumnTitle(e.target.value)}
            onKeyDown={onEditColumnTitle}
            className="h-8 text-base"
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <>
            <Popover>
              <PopoverTrigger asChild>
                <div 
                  className={`${column.color} cursor-pointer rounded-md transition-all ring-offset-2 hover:ring-2 ring-offset-background ring-gray-200 dark:ring-gray-700 ${
                    isCollapsed ? "w-6 h-6 mb-2" : "w-4 h-4"
                  }`}
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
              <CardTitle 
                className={`text-xl font-medium transition-all ${
                  isCollapsed ? "transform writing-mode-vertical-lr mt-2 whitespace-nowrap" : ""
                }`}
              >
                {column.title}
              </CardTitle>
              <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </>
        )}
      </div>
      <div className="flex items-center gap-1">
        {!isCollapsed && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()} 
            >
              <DropdownMenuItem 
                className="text-destructive"
                onSelect={(e) => {
                  e.preventDefault();
                  handleDeleteClick(e as any);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Stage
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={`h-8 w-8 text-muted-foreground ${isCollapsed ? "mt-2" : ""}`}
          onClick={handleCollapseToggle}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
