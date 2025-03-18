
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from './extensions/underline-extension';
import { cn } from '@/lib/utils';
import { useCallback, useEffect } from 'react';
import Link from '@tiptap/extension-link';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Write something...',
  className,
  minHeight = 'min-h-[80px]',
  onKeyDown,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-500 underline',
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `focus:outline-none ${minHeight} w-full`,
      },
    },
  });

  // Update content when value changes externally
  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Pass keydown events to parent
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  if (!editor) {
    return <div>Loading editor...</div>;
  }

  return (
    <div 
      className={cn("rich-text-editor", className)}
      onKeyDown={handleKeyDown}
    >
      <EditorContent editor={editor} />
      
      <style dangerouslySetInnerHTML={{ __html: `
        .ProseMirror {
          padding: 0.5rem;
          outline: none;
          ${minHeight}
        }
        
        .ProseMirror p {
          margin: 0;
        }
        
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5rem;
        }
        
        .ProseMirror a {
          color: #3b82f6;
          text-decoration: underline;
        }
        
        .ProseMirror.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #9ca3af;
          pointer-events: none;
          height: 0;
        }
      `}} />
    </div>
  );
}
