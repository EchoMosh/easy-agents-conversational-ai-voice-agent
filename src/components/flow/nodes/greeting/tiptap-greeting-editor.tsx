
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCallback, useEffect, useRef, useState } from 'react';
import { VariableSelector } from '../ai-agent-speaks/variable-selector';

interface TipTapGreetingEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function TipTapGreetingEditor({ value, onChange }: TipTapGreetingEditorProps) {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [showVariableSelector, setShowVariableSelector] = useState(false);
  const [variableSelectorPosition, setVariableSelectorPosition] = useState({ x: 0, y: 0 });
  const [triggerChar, setTriggerChar] = useState<'#' | '@' | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: value || '<p>Enter your message here...</p>',
    onUpdate: ({ editor }) => {
      const htmlContent = editor.getHTML();
      onChange(htmlContent);
      
      // Check if # or @ was just typed
      const selection = editor.view.state.selection;
      if (selection.empty) {
        const position = selection.$from.pos;
        const textBefore = editor.view.state.doc.textBetween(
          Math.max(0, position - 1),
          position,
          ''
        );
        
        if (textBefore === '#' || textBefore === '@') {
          // Get position for the variable selector popup
          if (editorContainerRef.current) {
            const view = editor.view;
            const { left, top } = view.coordsAtPos(position);
            const editorBounds = editorContainerRef.current.getBoundingClientRect();
            
            setVariableSelectorPosition({
              x: left - editorBounds.left,
              y: top - editorBounds.top + 20
            });
            
            setTriggerChar(textBefore as '#' | '@');
            setShowVariableSelector(true);
          }
        }
      }
    },
    autofocus: false,
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '<p>Enter your message here...</p>');
    }
  }, [value, editor]);

  const handleClick = useCallback(() => {
    if (editor && !editor.isFocused) {
      editor.commands.focus('end');
      // Clear the content if it's the default text
      if (editor.getHTML().includes('Enter your message here...')) {
        editor.commands.selectAll();
      }
    }
  }, [editor]);

  // Enhanced click handling to ensure focus
  useEffect(() => {
    const container = editorContainerRef.current;
    if (!container) return;

    const focusEditor = () => {
      if (editor && !editor.isFocused) {
        editor.commands.focus('end');
        // Clear the content if it's the default text
        if (editor.getHTML().includes('Enter your message here...')) {
          editor.commands.selectAll();
        }
      }
    };

    container.addEventListener('click', focusEditor);
    return () => {
      container.removeEventListener('click', focusEditor);
    };
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

  // Event handler for closing the variable selector when clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showVariableSelector && 
          editorContainerRef.current && 
          !editorContainerRef.current.contains(event.target as Node)) {
        setShowVariableSelector(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showVariableSelector]);

  const handleInsertVariable = useCallback((variable: string) => {
    if (editor) {
      // Remove the trigger character
      if (triggerChar) {
        editor.commands.command(({ tr, dispatch }) => {
          if (dispatch) {
            const position = editor.view.state.selection.$from.pos;
            tr.delete(position - 1, position);
            dispatch(tr);
          }
          return true;
        });
      }

      const htmlVariable = `<span class="editor-variable">${variable}</span>`;
      editor.commands.insertContent(htmlVariable);
      editor.commands.focus('end');
      setShowVariableSelector(false);
    }
  }, [editor, triggerChar]);

  if (!editor) {
    return <div className="p-2 text-sm text-gray-500">Loading editor...</div>;
  }

  return (
    <div 
      ref={editorContainerRef}
      className="border rounded-md p-2 bg-white/50 dark:bg-gray-800/50 min-h-[100px] text-sm cursor-text relative"
      onClick={handleClick}
    >
      <div className="text-xs text-muted-foreground mb-1">
        Tip: Type <kbd className="px-1 rounded bg-muted">#</kbd> or <kbd className="px-1 rounded bg-muted">@</kbd> to insert a variable
      </div>
      
      <EditorContent editor={editor} className="prose dark:prose-invert prose-sm max-w-none cursor-text" />
      
      {showVariableSelector && (
        <div 
          style={{ 
            position: 'absolute', 
            left: `${variableSelectorPosition.x}px`, 
            top: `${variableSelectorPosition.y}px`,
            zIndex: 50
          }}
        >
          <VariableSelector 
            onSelectVariable={handleInsertVariable} 
            triggerChar={triggerChar || '#'} 
          />
        </div>
      )}
      
      <style>
        {`
        .ProseMirror {
          outline: none;
          min-height: 80px;
          cursor: text;
        }

        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        
        .editor-variable {
          display: inline-block;
          background-color: rgba(99, 102, 241, 0.1);
          color: #6366f1;
          border-radius: 0.25rem;
          padding: 0 0.25rem;
          font-weight: 500;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        
        .dark .editor-variable {
          background-color: rgba(99, 102, 241, 0.2);
          color: #818cf8;
        }
        `}
      </style>
    </div>
  );
}
