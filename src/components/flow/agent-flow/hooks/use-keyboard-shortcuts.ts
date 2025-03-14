
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
    
    if (isEditingText) return;
    
    const keyPressed = event.key.toUpperCase();
    const widget = widgets.find(w => w.shortcut === keyPressed);
    
    if (widget && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      
      if (reactFlowWrapperRef.current) {
        const bounds = reactFlowWrapperRef.current.getBoundingClientRect();
        const centerPosition = {
          x: bounds.width / 2,
          y: bounds.height / 2,
        };
        
        createNodeCallback(widget.type, centerPosition);
        
        toast.success(`Added ${widget.label} node with keyboard shortcut '${widget.shortcut}'`);
      }
    }
    
    handleKeyDeleteCallback(event);
  }, [widgets, toast]);

  return { handleFlowKeyDown };
}
