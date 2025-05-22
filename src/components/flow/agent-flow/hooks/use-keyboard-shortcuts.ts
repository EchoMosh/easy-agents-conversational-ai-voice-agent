
import { useCallback, KeyboardEvent } from 'react';
import { toast } from 'sonner';
import { Node } from '@xyflow/react';
import { widgets } from '../widgets/widget-definitions';

export function useKeyboardShortcuts() {
  const handleFlowKeyDown = useCallback((
    event: KeyboardEvent<HTMLDivElement>,
    createNodeCallback: (nodeType: string, position: { x: number, y: number }) => Node | void,
    reactFlowWrapperRef: React.RefObject<HTMLDivElement>,
    handleKeyDeleteCallback: (event: KeyboardEvent<HTMLDivElement>) => void
  ) => {
    const target = event.target as HTMLElement;
    const isEditingText = target.tagName === 'INPUT' || 
                          target.tagName === 'TEXTAREA' || 
                          target.isContentEditable;
    console.log('[KeyboardShortcut] handleFlowKeyDown triggered. Key:', event.key);
    
    if (isEditingText) {
      console.log('[KeyboardShortcut] In text editing mode, skipping shortcut.');
      return;
    }
    
    const keyPressed = event.key.toUpperCase();
    console.log('[KeyboardShortcut] Processed key:', keyPressed);
    const widget = widgets.find(w => w.shortcut === keyPressed);
    
    if (widget) {
      console.log('[KeyboardShortcut] Matched widget:', widget.label, 'for key:', keyPressed);
      if (!event.ctrlKey && !event.metaKey && !event.altKey) {
        console.log('[KeyboardShortcut] No modifier keys pressed, proceeding to create node.');
        event.preventDefault();
        
        if (reactFlowWrapperRef.current) {
          const bounds = reactFlowWrapperRef.current.getBoundingClientRect();
          const centerPosition = {
            x: bounds.width / 2,
            y: bounds.height / 2,
          };
          console.log('[KeyboardShortcut] Calculated center position:', centerPosition);
          
          createNodeCallback(widget.type, centerPosition);
          console.log('[KeyboardShortcut] Called createNodeCallback for type:', widget.type);
          
          toast.success(`Added ${widget.label} node with keyboard shortcut '${widget.shortcut}'`);
        } else {
          console.warn('[KeyboardShortcut] reactFlowWrapperRef.current is null. Cannot calculate position.');
        }
      } else {
        console.log('[KeyboardShortcut] Modifier key pressed, not creating node via shortcut.');
      }
    } else {
      console.log('[KeyboardShortcut] No widget matched for key:', keyPressed);
    }
    
    // Call delete handler regardless, as it has its own checks for Delete/Backspace
    handleKeyDeleteCallback(event);
  }, [widgets, toast]); // Removed `toast` from dependencies as it's stable, kept `widgets`

  return { handleFlowKeyDown };
}
