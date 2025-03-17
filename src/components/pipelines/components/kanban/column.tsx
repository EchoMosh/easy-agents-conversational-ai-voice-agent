
import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Pencil, ChevronLeft, ChevronRight, MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PipelineColumn } from "@/types/pipeline";
import { Lead } from "@/pages/dashboard/leads";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { colorOptions } from "../../constants/color-options";
import { KanbanTask } from "./task";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

interface KanbanColumnProps {
  column: PipelineColumn;
  columnLeads: Lead[];
  isEditing: boolean;
  isCollapsed: boolean;
  editingColumnTitle: string;
  onEditColumnTitle: (e: React.KeyboardEvent) => void;
  setEditingColumnTitle: (title: string) => void;
  handleColorChange: (columnId: string, color: string) => void;
  onDeleteStage: (column: PipelineColumn) => void;
  toggleColumnCollapse: (columnId: string) => void;
  setEditingColumnId: (id: string) => void;
  onLeadClick: (lead: Lead) => void;
  currentPipelineId?: string;
}

export function KanbanColumn({
  column,
  columnLeads,
  isEditing,
  isCollapsed,
  editingColumnTitle,
  onEditColumnTitle,
  setEditingColumnTitle,
  handleColorChange,
  onDeleteStage,
  toggleColumnCollapse,
  setEditingColumnId,
  onLeadClick,
  currentPipelineId
}: KanbanColumnProps) {
  const [showOptionsDialog, setShowOptionsDialog] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: "Column",
      column,
    },
  });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Handlers with proper event stopping
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Delete stage clicked from options dialog:", column.title);
    setShowOptionsDialog(false);
    onDeleteStage(column);
  };

  const handleColorChangeClick = (e: React.MouseEvent, color: string) => {
    e.preventDefault();
    e.stopPropagation();
    handleColorChange(column.id, color);
  };

  const handleEditTitleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowOptionsDialog(false);
    setEditingColumnId(column.id);
    setEditingColumnTitle(column.title);
  };

  const handleCollapseToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleColumnCollapse(column.id);
  };

  const handleOptionsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowOptionsDialog(true);
    console.log("Options button clicked, dialog should open:", !showOptionsDialog);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`touch-manipulation ${isDragging ? "opacity-50" : "opacity-100"}`}
      {...attributes}
    >
      <Card className={`h-full flex flex-col bg-muted/30 ${
        isCollapsed ? "w-16" : "w-[300px]"
      } border-t-4 rounded-lg overflow-hidden`}
      style={{ borderTopColor: column.color.replace("bg-", "").includes("-") ? 
        `var(--${column.color.replace("bg-", "").replace("-", "-")})` : 
        `var(--${column.color.replace("bg-", "")})` }}
      >
        <CardHeader 
          className={`p-3 flex items-center ${isCollapsed ? "flex-col" : "justify-between"} gap-2 bg-background/60`}
          {...listeners}
        >
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
                  <h3 
                    className={`text-lg font-medium transition-all ${
                      isCollapsed ? "transform writing-mode-vertical-lr mt-2 whitespace-nowrap" : ""
                    }`}
                  >
                    {column.title}
                  </h3>
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            {!isCollapsed && (
              <>
                <div className="flex items-center">
                  <span className="text-xs text-muted-foreground font-medium">
                    {columnLeads.length}
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={handleOptionsClick}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </>
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
        </CardHeader>

        {!isCollapsed && (
          <CardContent className="p-3 flex-grow overflow-auto">
            <SortableContext 
              items={columnLeads.map(lead => lead.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="flex flex-col gap-2">
                {columnLeads.length > 0 ? (
                  columnLeads.map((lead) => (
                    <KanbanTask 
                      key={lead.id} 
                      lead={lead}
                      columnId={column.id}
                      onClick={() => onLeadClick(lead)}
                    />
                  ))
                ) : (
                  <div className="flex items-center justify-center h-24 border border-dashed rounded-md border-muted-foreground/20">
                    <p className="text-sm text-muted-foreground">
                      Drop leads here
                    </p>
                  </div>
                )}
              </div>
            </SortableContext>
          </CardContent>
        )}

        {/* Options Dialog */}
        <Dialog 
          open={showOptionsDialog} 
          onOpenChange={(open) => {
            console.log("Dialog open state changing to:", open);
            setShowOptionsDialog(open);
          }}
        >
          <DialogContent 
            className="sm:max-w-[320px]"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <DialogHeader>
              <DialogTitle>Stage Options: {column.title}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-4">
              <Button 
                variant="outline" 
                className="justify-start text-left"
                onClick={handleEditTitleClick}
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
      </Card>
    </div>
  );
}
