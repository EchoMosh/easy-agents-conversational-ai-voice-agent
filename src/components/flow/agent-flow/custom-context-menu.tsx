import React, { useEffect, useState, useRef } from "react";
import { Trash2 } from "lucide-react";
import { widgets } from "./widgets/widget-definitions";
import { Node as FlowNode } from "@xyflow/react"; // Rename Node to FlowNode to avoid naming conflict with DOM Node

interface CustomContextMenuProps {
  rightClickedNodeId: string | null;
  position: { x: number; y: number };
  onAddNode: (nodeType: string) => void;
  onDeleteNode: () => void;
  onClose: () => void;
  nodes: FlowNode[]; // Use renamed FlowNode type
}

export function CustomContextMenu({
  rightClickedNodeId,
  position,
  onAddNode,
  onDeleteNode,
  onClose,
  nodes, // Destructure nodes
}: CustomContextMenuProps) {
  const [isVisible, setIsVisible] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Check if a Start Node already exists
  const startNodeExists = nodes.some((node) => node.type === "startNode");

  // Filter widgets if needed - for pane context menu only
  const filteredWidgets = rightClickedNodeId
    ? widgets // If right-clicking on a node, show all node actions
    : startNodeExists
      ? widgets.filter((widget) => widget.type !== "startNode") // If a Start Node exists and right-clicking on pane, don't show Start Node option
      : widgets; // If no Start Node and right-clicking on pane, show all nodes

  // Prevent event propagation to avoid immediate closing
  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Handle adding a node and immediately close the menu
  const handleAddNode = (nodeType: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onClose(); // Close menu first to prevent any race conditions
    // Small delay to ensure menu is closed before adding node
    setTimeout(() => {
      onAddNode(nodeType);
    }, 10);
  };

  // Handle deleting a node and immediately close the menu
  const handleDeleteNode = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onClose(); // Close menu first to prevent any race conditions
    // Small delay to ensure menu is closed before deleting node
    setTimeout(() => {
      onDeleteNode();
    }, 10);
  };

  useEffect(() => {
    // Show the menu with a slight delay for animation
    const timer = setTimeout(() => {
      setIsVisible(true);
      console.log("[ContextMenu] Setting menu visible", position);
    }, 50);

    // Add click outside listener - capture phase to ensure it runs before other handlers
    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as HTMLElement)
      ) {
        console.log("[ContextMenu] Click outside detected");
        e.preventDefault(); // Prevent other handlers from firing
        e.stopPropagation(); // Stop event bubbling
        onClose();
      }
    };

    // Add right-click listener to close the menu
    const handleRightClick = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as HTMLElement)
      ) {
        console.log("[ContextMenu] Right-click outside detected");
        onClose();
      }
    };

    // Ensure we add the event listeners only once, using capture phase for mousedown
    document.addEventListener("mousedown", handleClickOutside, true);
    document.addEventListener("contextmenu", handleRightClick);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside, true);
      document.removeEventListener("contextmenu", handleRightClick);
    };
  }, [onClose, position]);

  return (
    <div
      ref={menuRef}
      className={`custom-context-menu absolute z-50 w-64 bg-white/95 dark:bg-gray-900/95  border border-gray-200 dark:border-gray-800 shadow-lg rounded-lg overflow-hidden transition-opacity duration-150 ${isVisible ? "opacity-100" : "opacity-0"}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        pointerEvents: isVisible ? "auto" : "none",
      }}
      onClick={stopPropagation}
      onContextMenu={stopPropagation}
    >
      {rightClickedNodeId ? (
        // Only show delete option when right-clicking on a node
        <>
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground mb-1">
            Node Actions
          </div>
          <div
            onClick={handleDeleteNode}
            className="flex items-center gap-2 text-destructive hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1.5 cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Node</span>
            <kbd className="ml-auto px-1.5 py-0.5 bg-muted/50 rounded text-[10px] font-semibold">
              Del
            </kbd>
          </div>
        </>
      ) : (
        // Show add node options only when right-clicking on the pane
        <>
          <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground mb-1">
            Add Node
          </div>
          {filteredWidgets.map((widget) => (
            <div
              key={widget.type}
              onClick={(e) => handleAddNode(widget.type, e)}
              className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-800 px-2 py-1.5 cursor-pointer"
            >
              <span className="p-1 rounded-md" style={{ color: widget.color }}>
                <widget.icon className="h-3.5 w-3.5" />
              </span>
              <span>{widget.label}</span>
              <kbd className="ml-auto px-1.5 py-0.5 bg-muted/50 rounded text-[10px] font-semibold">
                {widget.shortcut}
              </kbd>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
