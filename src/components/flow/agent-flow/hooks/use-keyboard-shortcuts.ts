import { useCallback, KeyboardEvent } from "react";
import { Node } from "@xyflow/react";
import { widgets } from "../widgets/widget-definitions";

export function useKeyboardShortcuts() {
  const handleFlowKeyDown = useCallback(
    (
      event: KeyboardEvent<HTMLDivElement>,
      createNodeCallback: (
        nodeType: string,
        position: { x: number; y: number },
      ) => Node | void,
      reactFlowWrapperRef: React.RefObject<HTMLDivElement>,
      handleKeyDeleteCallback: (event: KeyboardEvent<HTMLDivElement>) => void,
    ) => {
      const target = event.target as HTMLElement;

      // Check if user is editing text anywhere inside a node
      const isEditingText =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable ||
        target.closest(".react-flow__node") !== null ||
        target.closest(".ProseMirror") !== null ||
        target.closest(".tiptap") !== null ||
        target.closest("[data-tiptap-editor]") !== null ||
        target.getAttribute("role") === "textbox";

      // If editing text inside a node, don't intercept ANY keys
      if (isEditingText) {
        return;
      }

      // Only handle shortcuts when focus is on the canvas background
      const keyPressed = event.key.toUpperCase();
      const widget = widgets.find((w) => w.shortcut === keyPressed);

      if (widget && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        if (reactFlowWrapperRef.current) {
          const bounds = reactFlowWrapperRef.current.getBoundingClientRect();
          createNodeCallback(widget.type, {
            x: bounds.width / 2,
            y: bounds.height / 2,
          });
        }
      }

      // Handle delete/backspace only on canvas
      handleKeyDeleteCallback(event);
    },
    [],
  );

  return { handleFlowKeyDown };
}
