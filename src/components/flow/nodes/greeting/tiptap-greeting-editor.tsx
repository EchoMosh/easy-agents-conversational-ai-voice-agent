
import { EditorContent } from '@tiptap/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { VariableSelector } from '../ai-agent-speaks/variable-selector';
import { EditorTip } from './editor-tip';
import { useTiptapEditor } from './use-tiptap-editor';
import { editorStyles } from './editor-styles';
import { Portal } from '@radix-ui/react-portal';

interface TipTapGreetingEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function TipTapGreetingEditor({ value, onChange }: TipTapGreetingEditorProps) {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [showVariableSelector, setShowVariableSelector] = useState(false);
  const [triggerChar, setTriggerChar] = useState<'#' | null>(null);
  const [selectorPosition, setSelectorPosition] = useState({ top: 0, left: 0 });

  const handleVariableTrigger = useCallback((char: '#', position?: { top: number, left: number }) => {
    setTriggerChar(char);
    setShowVariableSelector(true);
    
    if (position) {
      // Calculate position relative to viewport for fixed positioning
      setSelectorPosition({
        top: position.top, 
        left: position.left
      });
    }
  }, []);

  const { editor, showTip, insertVariable } = useTiptapEditor({
    value,
    onChange,
    onVariableTrigger: handleVariableTrigger
  });

  const handleClick = useCallback(() => {
    if (editor && !editor.isFocused) {
      editor.commands.focus('end');
    }
  }, [editor]);

  // Auto-focus when the component mounts
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (editor) {
        editor.commands.focus('end');
      }
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [editor]);

  // Enhanced click handling to ensure focus
  useEffect(() => {
    const container = editorContainerRef.current;
    if (!container) return;

    const focusEditor = () => {
      if (editor && !editor.isFocused) {
        editor.commands.focus('end');
      }
    };

    container.addEventListener('click', focusEditor);
    return () => {
      container.removeEventListener('click', focusEditor);
    };
  }, [editor]);

  // Close variable selector when clicking outside
  useEffect(() => {
    if (!showVariableSelector) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const selectorElement = document.querySelector('.variable-selector-popup');
      
      // Close only if click is outside both the editor and selector
      if (
        editorContainerRef.current && 
        !editorContainerRef.current.contains(target) &&
        selectorElement && 
        !selectorElement.contains(target)
      ) {
        setShowVariableSelector(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVariableSelector]);

  const handleInsertVariable = useCallback((variable: string) => {
    insertVariable(variable, triggerChar);
    setShowVariableSelector(false);
  }, [insertVariable, triggerChar]);

  if (!editor) {
    return <div className="p-2 text-sm text-gray-500 w-full">Loading editor...</div>;
  }

  return (
    <>
      <div 
        ref={editorContainerRef}
        className="border rounded-md p-2 bg-white dark:bg-gray-800/50 min-h-[100px] text-sm cursor-text relative nodrag w-full"
        onClick={handleClick}
      >
        <EditorTip show={showTip} />
        
        <EditorContent 
          editor={editor} 
          className="prose dark:prose-invert prose-sm max-w-none cursor-text nodrag w-full"
        />
      </div>
      
      {showVariableSelector && (
        <Portal>
          <div 
            className="variable-selector-popup fixed z-[9999]"
            style={{
              position: 'fixed',
              top: `${selectorPosition.top + 20}px`,
              left: `${selectorPosition.left}px`,
              zIndex: 9999,
            }}
          >
            <VariableSelector 
              onSelectVariable={handleInsertVariable} 
              triggerChar="#" 
              isFullScreen={false}
            />
          </div>
        </Portal>
      )}
      
      <style>{editorStyles}</style>
    </>
  );
}
