
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCallback, useState, useEffect } from 'react';
import VariableMark from './variable-mark';

interface UseTiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  onVariableTrigger?: (char: '#', position?: { top: number, left: number }) => void;
}

export function useTiptapEditor({ value, onChange, onVariableTrigger }: UseTiptapEditorProps) {
  const [showTip, setShowTip] = useState(false);
  
  // Initialize editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      VariableMark,
    ],
    content: value || '<p></p>',
    editorProps: {
      attributes: {
        class: 'editor-input',
      },
      handleDOMEvents: {
        keydown: (view, event) => {
          // Show tip when typing #
          if (event.key === '#') {
            setShowTip(false);
            
            // Get precise cursor position for variable selector
            if (onVariableTrigger) {
              const { view: editorView } = editor!;
              const { from } = editorView.state.selection;
              const pos = editorView.coordsAtPos(from);
              
              // Get coordinates relative to the viewport for fixed positioning
              onVariableTrigger('#', { 
                top: pos.top, 
                left: pos.left 
              });
            }
          }
          return false;
        },
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      
      // Reset any invalid variable marks
      const state = editor.state;
      const { doc } = state;
      let hasInvalidVariables = false;
      
      // Check for broken variables
      doc.descendants((node, pos) => {
        if (node.isText && node.marks.some(mark => mark.type.name === 'variable')) {
          const text = node.text;
          if (text && !text.match(/^\{[a-zA-Z][a-zA-Z0-9_]*\}$/)) {
            hasInvalidVariables = true;
          }
        }
        return true;
      });
      
      // If invalid variables found, trigger a full update to reset formatting
      if (hasInvalidVariables) {
        console.log("Detected invalid variable formatting");
        const currentHtml = editor.getHTML();
        editor.commands.clearContent();
        editor.commands.setContent(currentHtml);
      }
    },
  });
  
  // Reset tip
  useEffect(() => {
    let timeout: number;
    if (showTip) {
      timeout = window.setTimeout(() => {
        setShowTip(false);
      }, 3000);
    }
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [showTip]);
  
  // Update content when value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '<p></p>');
    }
  }, [editor, value]);
  
  // Handle variable insertion
  const insertVariable = useCallback((variableName: string, triggerChar: '#' | null) => {
    if (!editor) return;
    
    // If there's a # character at the current position, remove it
    if (triggerChar) {
      editor.commands.deleteRange({
        from: editor.state.selection.from - 1,
        to: editor.state.selection.from
      });
    }
    
    // Insert the variable with the correct format
    editor.commands.insertContent(`<span class="editor-variable" data-variable="${variableName}">{${variableName}}</span>`);
    
    // Focus back on editor
    editor.commands.focus();
  }, [editor]);
  
  return {
    editor,
    showTip,
    insertVariable
  };
}
