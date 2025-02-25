
import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, MoreVertical, Trash2 } from "lucide-react";
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
  setStageToDelete: (column: PipelineColumn) => void;
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
  setStageToDelete,
  toggleColumnCollapse,
  setEditingColumnId,
}: StageHeaderProps) {
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
      <div className="flex items-center gap-1">
        {!isCollapsed && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => setStageToDelete(column)}
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
          className={`h-8 w-8 ${isCollapsed ? "mt-2" : ""}`}
          onClick={() => toggleColumnCollapse(column.id)}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
