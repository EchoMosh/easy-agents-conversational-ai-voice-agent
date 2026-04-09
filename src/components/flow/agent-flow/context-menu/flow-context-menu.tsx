import { Trash2 } from "lucide-react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { widgets, WidgetDefinition } from "../widgets/widget-definitions";
import { Node } from "@xyflow/react"; // Import Node type

interface FlowContextMenuProps {
  children: React.ReactNode;
  rightClickedNodeId: string | null;
  onAddNode: (nodeType: string) => void;
  onDeleteNode: () => void;
  nodes: Node[]; // Add nodes prop
}

export function FlowContextMenu({
  children,
  rightClickedNodeId,
  onAddNode,
  onDeleteNode,
  nodes, // Destructure nodes
}: FlowContextMenuProps) {
  const startNodeExists = nodes.some((node) => node.type === "startNode");

  let availableWidgets = widgets;
  // Only filter for pane context menu (no rightClickedNodeId)
  if (!rightClickedNodeId && startNodeExists) {
    availableWidgets = widgets.filter((widget) => widget.type !== "startNode");
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger className="flex w-full h-full">
        {children}
      </ContextMenuTrigger>

      <ContextMenuContent className="w-64 bg-white/95 dark:bg-gray-900/95 z-50 border border-gray-200 dark:border-gray-800 shadow-lg rounded-lg overflow-hidden">
        {rightClickedNodeId ? (
          <>
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground mb-1">
              Node Actions
            </div>
            <ContextMenuItem
              onClick={onDeleteNode}
              className="flex items-center gap-2 text-destructive focus:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Node</span>
              <kbd className="ml-auto px-1.5 py-0.5 bg-muted/50 rounded text-[10px] font-semibold">
                Del
              </kbd>
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        ) : null}
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground mb-1">
          Add Node
        </div>
        {availableWidgets.map((widget) => (
          <ContextMenuItem
            key={widget.type}
            onClick={() => onAddNode(widget.type)}
            className="flex items-center gap-2"
          >
            <span className="p-1 rounded-md" style={{ color: widget.color }}>
              <widget.icon className="h-3.5 w-3.5" />
            </span>
            <span>{widget.label}</span>
            <kbd className="ml-auto px-1.5 py-0.5 bg-muted/50 rounded text-[10px] font-semibold">
              {widget.shortcut}
            </kbd>
          </ContextMenuItem>
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}
