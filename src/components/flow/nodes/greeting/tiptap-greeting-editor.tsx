
import { EditorContent } from '@tiptap/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { VariableSelector } from '../ai-agent-speaks/variable-selector';
import { EditorTip } from './editor-tip';
import { useTiptapEditor } from './use-tiptap-editor';
import { editorStyles } from './editor-styles';
import { Portal } from '@radix-ui/react-portal';
import { Hash, AtSign, MessageCircle } from 'lucide-react';

interface TipTapGreetingEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function TipTapGreetingEditor({ value, onChange }: TipTapGreetingEditorProps) {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [showVariableSelector, setShowVariableSelector] = useState(false);
  const [triggerChar, setTriggerChar] = useState<'@' | '#' | null>(null);
  const [selectorPosition, setSelectorPosition] = useState({ top: 0, left: 0 });
  const [isEmpty, setIsEmpty] = useState(value === '<p></p>' || !value);

  const handleVariableTrigger = useCallback((char: '@' | '#', position?: { top: number, left: number }) => {
    setTriggerChar(char);
    setShowVariableSelector(true);
    
    if (position) {
      setSelectorPosition(position);
    }
  }, []);

  const { editor, showTip, insertVariable } = useTiptapEditor({
    value,
    onChange: (newValue) => {
      onChange(newValue);
      
      // Check if editor is empty to control placeholder visibility
      const isContentEmpty = newValue === '<p></p>' || !newValue;
      setIsEmpty(isContentEmpty);
    },
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
        
        {/* Better styled placeholder that disappears when content is entered */}
        {isEmpty && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-gray-400 dark:text-gray-500 px-4 py-3">
              <MessageCircle className="h-5 w-5 mb-1 text-gray-300 dark:text-gray-600" />
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Type your message here</p>
              <div className="flex items-center gap-2 mt-1 text-xs bg-gray-50 dark:bg-gray-800/70 px-3 py-1.5 rounded-full">
                <span>Use</span>
                <div className="flex items-center justify-center h-5 w-5 bg-gray-100 dark:bg-gray-700 rounded-full">
                  <Hash className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                </div>
                <span>or</span>
                <div className="flex items-center justify-center h-5 w-5 bg-gray-100 dark:bg-gray-700 rounded-full">
                  <AtSign className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                </div>
                <span>to insert variables</span>
              </div>
            </div>
          </div>
        )}
        
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
