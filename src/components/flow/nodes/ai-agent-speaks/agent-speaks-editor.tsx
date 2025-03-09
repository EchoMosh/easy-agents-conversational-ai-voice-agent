
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCallback, useEffect, useRef } from 'react';
import { VariableSelector } from './variable-selector';

interface AgentSpeaksEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export function AgentSpeaksEditor({ content, onChange }: AgentSpeaksEditorProps) {
  const editorContainerRef = useRef<HTMLDivElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: content || '<p>Enter what the AI agent should say...</p>',
    onUpdate: ({ editor }) => {
      const htmlContent = editor.getHTML();
      onChange(htmlContent);
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

  const handleInsertVariable = useCallback((variable: string) => {
    if (editor) {
      const htmlVariable = `<span class="editor-variable">${variable}</span>`;
      editor.commands.insertContent(htmlVariable);
      editor.commands.focus('end');
    }
  }, [editor]);

  if (!editor) {
    return <div className="p-2 text-sm text-gray-500">Loading editor...</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <VariableSelector onSelectVariable={handleInsertVariable} />
      </div>
      <div 
        ref={editorContainerRef}
        className="border rounded-md p-2 bg-white/50 dark:bg-gray-800/50 min-h-[100px] text-sm cursor-text"
        onClick={handleClick}
      >
        <EditorContent editor={editor} className="prose dark:prose-invert prose-sm max-w-none cursor-text" />
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
    </div>
  );
}
