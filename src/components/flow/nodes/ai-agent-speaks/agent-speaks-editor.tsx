
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCallback, useEffect, useRef } from 'react';

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
    }
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

  if (!editor) {
    return <div className="p-2 text-sm text-gray-500">Loading editor...</div>;
  }

  return (
    <div 
      ref={editorContainerRef}
      className="border rounded-md p-2 bg-white/50 dark:bg-gray-800/50 min-h-[100px] text-sm"
      onClick={handleClick}
    >
      <EditorContent editor={editor} className="prose dark:prose-invert prose-sm max-w-none" />
      <style>
        {`
        .ProseMirror {
          outline: none;
          min-height: 80px;
        }

        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        `}
      </style>
    </div>
  );
}
