import { Button } from "@/components/ui/button";
import { CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronLeft, ChevronRight, MoreVertical, Trash2, Pencil } from "lucide-react";
import { colorOptions } from "../constants/color-options";
import { PipelineColumn } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";

interface StageHeaderProps {
  column: PipelineColumn;
  columnLeads: Lead[];
  isCollapsed: boolean;
  editingColumnId: string | null;
  editingColumnTitle: string;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleColorChange: (columnId: string, color: string) => void;
  onDeleteStage: () => void;
  toggleCollapse: () => void;
  handleEditTitleClick: () => void;
}

export function StageHeader({
  column,
  columnLeads,
  isCollapsed,
  editingColumnId,
  editingColumnTitle,
  onKeyDown,
  onTitleChange,
  handleColorChange,
  onDeleteStage,
  toggleCollapse,
  handleEditTitleClick,
}: StageHeaderProps) {
  return (
    <div className={`flex items-center ${isCollapsed ? "flex-col" : "justify-between"}`}>
      <div className={`flex items-center ${isCollapsed ? "flex-col" : "space-x-3"} flex-1`}>
        {editingColumnId === column.id ? (
          <Input
            value={editingColumnTitle}
            onChange={onTitleChange}
            onKeyDown={onKeyDown}
            className="h-8 text-base"
            autoFocus
          />
        ) : (
          <>
            <Popover>
              <PopoverTrigger asChild>
                <div 
                  className={`${column.color} cursor-pointer rounded-md transition-all ring-offset-2 hover:ring-2 ring-offset-background ring-gray-200 dark:ring-gray-700 ${
                    isCollapsed ? "w-6 h-6 mb-2" : "w-4 h-4"
                  }`}
                />
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2">
                <div className="grid grid-cols-4 gap-1">
                  {colorOptions.map((option) => (
                    <button
                      key={option.value}
                      className={`w-8 h-8 rounded-md ${option.value} hover:ring-2 ring-offset-2 ring-offset-background ring-ring transition-all ${
                        column.color === option.value ? "ring-2" : ""
                      }`}
                      onClick={() => handleColorChange(column.id, option.value)}
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
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                className="text-destructive"
                onClick={onDeleteStage}
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
          onClick={toggleCollapse}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
