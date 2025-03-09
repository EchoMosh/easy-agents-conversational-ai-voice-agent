
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCallback, useEffect, useRef, useState } from 'react';
import { VariableSelector, VariableDisplayStyle } from './variable-selector';

interface AgentSpeaksEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export function AgentSpeaksEditor({ content, onChange }: AgentSpeaksEditorProps) {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [showVariableSelector, setShowVariableSelector] = useState(false);
  const [variableSelectorPosition, setVariableSelectorPosition] = useState({ x: 0, y: 0 });
  const [triggerChar, setTriggerChar] = useState<'#' | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: content || '<p>Enter what the AI agent should say...</p>',
    onUpdate: ({ editor }) => {
      const htmlContent = editor.getHTML();
      onChange(htmlContent);
      
      // Check if # was just typed
      const selection = editor.view.state.selection;
      if (selection.empty) {
        const position = selection.$from.pos;
        const textBefore = editor.view.state.doc.textBetween(
          Math.max(0, position - 1),
          position,
          ''
        );
        
        if (textBefore === '#') {
          // Show the full-screen variable selector
          setTriggerChar('#');
          setShowVariableSelector(true);
        }
      }
    },
    autofocus: false,
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '<p>Enter what the AI agent should say...</p>');
    }
  }, [content, editor]);

  const handleClick = useCallback(() => {
    if (editor && !editor.isFocused) {
      editor.commands.focus('end');
      // Clear the content if it's the default text
      if (editor.getHTML().includes('Enter what the AI agent should say...')) {
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
        if (editor.getHTML().includes('Enter what the AI agent should say...')) {
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

  const formatVariableBasedOnStyle = (variable: string, style: VariableDisplayStyle = 'default'): string => {
    // Extract the variable name without braces
    const variableName = variable.replace(/[{}]/g, '');
    
    // Format based on the selected style
    switch (style) {
      case 'badge':
        return `[${variableName}]`;
      case 'code':
        return `$(${variableName})`;
      case 'tag':
        return `#${variableName}`;
      case 'default':
      default:
        return variable;
    }
  };

  const handleInsertVariable = useCallback((variable: string, style: VariableDisplayStyle = 'default') => {
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

      // Format the variable based on style
      const formattedVariable = formatVariableBasedOnStyle(variable, style);
      
      // Create a span element with appropriate class based on style
      let className = 'editor-variable';
      if (style === 'badge') className += ' editor-variable-badge';
      if (style === 'code') className += ' editor-variable-code';
      if (style === 'tag') className += ' editor-variable-tag';
      
      // Insert content as a properly formatted node
      editor.chain().focus()
        .insertContent({
          type: 'text',
          text: formattedVariable,
          marks: [
            {
              type: 'span',
              attrs: {
                class: className
              }
            }
          ]
        })
        .run();
      
      editor.commands.focus('end');
      setShowVariableSelector(false);
    }
  }, [editor, triggerChar]);

  if (!editor) {
    return <div className="p-2 text-sm text-gray-500">Loading editor...</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2 text-sm">
        <span className="text-muted-foreground">Tip: Type <kbd className="px-1 rounded bg-muted">#</kbd> to insert a variable</span>
      </div>
      <div 
        ref={editorContainerRef}
        className="border rounded-md p-2 bg-white dark:bg-gray-800/50 min-h-[100px] text-sm cursor-text relative"
        onClick={handleClick}
      >
        <EditorContent editor={editor} className="prose dark:prose-invert prose-sm max-w-none cursor-text" />
        
        {showVariableSelector && (
          <VariableSelector 
            onSelectVariable={handleInsertVariable} 
            triggerChar="#" 
            isFullScreen={true}
          />
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
          
          .editor-variable-badge {
            background-color: rgba(37, 99, 235, 0.1);
            color: #3b82f6;
            border-radius: 9999px;
            padding: 0.125rem 0.375rem;
          }
          
          .dark .editor-variable-badge {
            background-color: rgba(37, 99, 235, 0.2);
            color: #60a5fa;
          }
          
          .editor-variable-code {
            font-family: monospace;
            background-color: rgba(55, 65, 81, 0.1);
            color: #374151;
            border-radius: 0.25rem;
            padding: 0.125rem 0.25rem;
          }
          
          .dark .editor-variable-code {
            background-color: rgba(209, 213, 219, 0.1);
            color: #d1d5db;
          }
          
          .editor-variable-tag {
            background-color: transparent;
            color: #3b82f6;
            font-weight: 600;
            box-shadow: none;
            padding: 0;
          }
          
          .dark .editor-variable-tag {
            color: #60a5fa;
          }
          `}
        </style>
      </div>
    </div>
  );
}
