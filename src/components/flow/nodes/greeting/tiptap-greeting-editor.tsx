
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
  const [triggerChar, setTriggerChar] = useState<'@' | '#' | null>(null);
  const [selectorPosition, setSelectorPosition] = useState({ top: 0, left: 0 });

  const handleVariableTrigger = useCallback((char: '@' | '#', position?: { top: number, left: number }) => {
    setTriggerChar(char);
    setShowVariableSelector(true);
    
    if (position) {
      setSelectorPosition(position);
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

  const handleInsertVariable = useCallback((variable: string, displayStyle?: any) => {
    if (variable === '') {
      // This means the user clicked away or pressed escape
      setShowVariableSelector(false);
      // Focus back on editor
      if (editor) {
        editor.commands.focus();
      }
    } else {
      insertVariable(variable, triggerChar);
      setShowVariableSelector(false);
      // Focus back on editor after inserting
      if (editor) {
        editor.commands.focus();
      }
    }
  }, [editor, insertVariable, triggerChar]);

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
          <VariableSelector 
            onSelectVariable={handleInsertVariable} 
            triggerChar={triggerChar} 
            isFullScreen={false}
          />
        </Portal>
      )}
      
      <style>{editorStyles}</style>
    </>
  );
}
