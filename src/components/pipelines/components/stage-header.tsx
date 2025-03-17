
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MoreVertical, Trash2, Pencil } from "lucide-react";
import { colorOptions } from "../constants/color-options";
import { PipelineColumn } from "@/types/pipeline";
import { useState } from "react";

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
  editingColumnTitle,
  onEditColumnTitle,
  setEditingColumnTitle,
  handleColorChange,
  onDeleteStage,
  setEditingColumnId,
}: StageHeaderProps) {
  const [showOptionsDialog, setShowOptionsDialog] = useState(false);
  
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowOptionsDialog(false);
    onDeleteStage(column);
  };

  const handleColorChangeClick = (e: React.MouseEvent, color: string) => {
    e.preventDefault();
    e.stopPropagation();
    handleColorChange(column.id, color);
  };

  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="flex items-center space-x-2">
      {isEditing ? (
        <Input
          value={editingColumnTitle}
          onChange={(e) => setEditingColumnTitle(e.target.value)}
          onKeyDown={onEditColumnTitle}
          className="h-8 min-w-[150px]"
          autoFocus
          onClick={handleInputClick}
        />
      ) : (
        <>
          <Popover>
            <PopoverTrigger asChild>
              <div 
                className={`${column.color} cursor-pointer rounded-full w-4 h-4 transition-all hover:ring-2 ring-offset-2 ring-offset-background ring-gray-200 dark:ring-gray-700`}
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
                    onClick={(e) => handleColorChangeClick(e, option.value)}
                    title={option.name}
                  />
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </>
      )}

      {/* Options Dialog */}
      <Dialog 
        open={showOptionsDialog} 
        onOpenChange={setShowOptionsDialog}
      >
        <DialogContent 
          className="sm:max-w-[320px]"
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>Stage Options: {column.title}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-4">
            <Button 
              variant="outline" 
              className="justify-start text-left"
              onClick={() => {
                setShowOptionsDialog(false);
                setEditingColumnId(column.id);
                setEditingColumnTitle(column.title);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit Stage Name
            </Button>
            <Button 
              variant="outline" 
              className="justify-start text-left text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleDeleteClick}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Stage
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
