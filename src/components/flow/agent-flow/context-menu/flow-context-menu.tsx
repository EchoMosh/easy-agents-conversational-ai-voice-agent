import { Trash2 } from 'lucide-react';
import React, { useEffect } from 'react';
import { widgets } from '../widgets/widget-definitions';

interface FlowContextMenuProps {
  children: React.ReactNode;
  rightClickedNodeId: string | null;
  contextMenuPosition: { x: number, y: number } | null;
  onAddNode: (nodeType: string, position?: { x: number, y: number }) => void;
  onDeleteNode: () => void;
}

export function FlowContextMenu({ 
  children, 
  rightClickedNodeId,
  contextMenuPosition,
  onAddNode, 
  onDeleteNode 
}: FlowContextMenuProps) {
  // If no context menu position is set, just render the children
  if (!contextMenuPosition) {
    return <>{children}</>;
  }
  
  // Create click handler for menu items
  const handleItemClick = (callback: () => void) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    callback();
  };
  
  // Portal the menu directly to the body to avoid ReactFlow's event handling
  return (
    <>
      {children}
      
      <div
        className="fixed z-[9999] min-w-[200px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border border-gray-200 dark:border-gray-800 shadow-lg rounded-lg overflow-hidden"
        style={{
          left: `${contextMenuPosition.x + 5}px`,
          top: `${contextMenuPosition.y + 5}px`,
        }}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
      >
        {rightClickedNodeId ? (
          <>
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground mb-1">Node Actions</div>
            <div
              onClick={handleItemClick(onDeleteNode)}
              className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer text-red-600"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Node</span>
            </div>
            <div className="h-px bg-gray-200 dark:bg-gray-800 my-1" />
          </>
        ) : null}
        
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground mb-1">Add Node</div>
        
        {widgets.map((widget) => (
          <div
            key={widget.type}
            onClick={handleItemClick(() => {
              // Use exact context menu position with minimal offset
              // This will be converted to flow coordinates in the handler
              const nodePosition = {
                x: contextMenuPosition.x,
                y: contextMenuPosition.y
              };
              onAddNode(widget.type, nodePosition);
            })}
            className="flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
          >
            <span 
              className="p-1 rounded-md"
              style={{ color: widget.color }}
            >
              <widget.icon className="h-3.5 w-3.5" />
            </span>
            <span>{widget.label}</span>
          </div>
        ))}
      </div>
    </>
  );
}
