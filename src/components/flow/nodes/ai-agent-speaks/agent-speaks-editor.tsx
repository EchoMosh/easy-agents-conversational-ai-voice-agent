
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCallback, useEffect } from 'react';

interface AgentSpeaksEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export function AgentSpeaksEditor({ content, onChange }: AgentSpeaksEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: content || '<p>Enter what the AI agent should say...</p>',
    onUpdate: ({ editor }) => {
      const htmlContent = editor.getHTML();
      onChange(htmlContent);
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content || '<p>Enter what the AI agent should say...</p>');
    }
  }, [content, editor]);

  const handleClick = useCallback(() => {
    if (editor && !editor.isFocused) {
      editor.commands.focus();
    }
  }, [editor]);

  if (!editor) {
    return <div className="p-2 text-sm text-gray-500">Loading editor...</div>;
  }

  return (
    <div 
      className="border rounded-md p-2 bg-white/50 dark:bg-gray-800/50 min-h-[100px] text-sm"
      onClick={handleClick}
    >
      <EditorContent editor={editor} className="prose dark:prose-invert prose-sm max-w-none" />
      <style jsx>{`
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
      `}</style>
    </div>
  );
}
