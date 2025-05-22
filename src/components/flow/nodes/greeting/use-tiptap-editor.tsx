
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCallback, useEffect } from 'react'; // Removed useState
import VariableMark from './variable-mark';
import Placeholder from '@tiptap/extension-placeholder';

interface UseTiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  onVariableTrigger?: (char: '@' | '#', position?: { top: number, left: number }) => void;
}

export function useTiptapEditor({ value, onChange, onVariableTrigger }: UseTiptapEditorProps) {
  // const [showTip, setShowTip] = useState(false); // Removed
  
  // Initialize editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      VariableMark,
      Placeholder.configure({
        placeholder: 'Enter the message your bot will say. Use # or @ to insert variables.',
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: value || '<p></p>',
    editorProps: {
      attributes: {
        class: 'editor-input',
      },
      handleDOMEvents: {
        keydown: (view, event) => {
          // Show tip when typing # or @
          if (event.key === '#' || event.key === '@') {
            // setShowTip(false); // Removed
            
            // Get precise cursor position for variable selector
            if (onVariableTrigger) {
              const { view: editorView } = editor!;
              const { from } = editorView.state.selection;
              const pos = editorView.coordsAtPos(from);
              
              // Trigger the variable selector but don't let the character be part of the search
              event.preventDefault();
              
              // Get coordinates relative to the viewport for fixed positioning
              onVariableTrigger(event.key as '#' | '@', { 
                top: pos.top, 
                left: pos.left 
              });
              
              return true; // Prevent the character from being entered
            }
          }
          return false;
        },
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
      
      // Check for any variables that need their styling updated
      const state = editor.state;
      const { doc } = state;
      let updatedDoc = false;
      const tr = state.tr;
      
      // Check all variable marks to ensure proper styling
      doc.descendants((node, pos) => {
        if (node.isText && node.marks.some(mark => mark.type.name === 'variable')) {
          const text = node.text;
          const hasValidVariable = text && text.match(/^\{[a-zA-Z][a-zA-Z0-9_]*\}$/);
          
          // Get the current mark to see if we need to update
          const currentMark = node.marks.find(m => m.type.name === 'variable');
          const currentStatus = currentMark?.attrs['data-variable'];
          
          if (hasValidVariable && currentStatus === 'editing') {
            // Variable is now valid, restore proper styling
            const varName = text?.slice(1, -1);
            tr.addMark(
              pos, 
              pos + node.nodeSize, 
              state.schema.marks.variable.create({
                class: 'editor-variable',
                'data-variable': varName
              })
            );
            updatedDoc = true;
          } else if (!hasValidVariable && currentStatus !== 'editing') {
            // Variable is now invalid, change styling
            tr.addMark(
              pos, 
              pos + node.nodeSize, 
              state.schema.marks.variable.create({
                class: 'editor-variable',
                'data-variable': 'editing'
              })
            );
            updatedDoc = true;
          }
        }
        return true;
      });
      
      // Apply any mark updates
      if (updatedDoc) {
        editor.view.dispatch(tr);
      }
    },
  });
  
  // Reset tip - Removed
  // useEffect(() => {
  //   let timeout: number;
  //   if (showTip) {
  //     timeout = window.setTimeout(() => {
  //       setShowTip(false);
  //     }, 3000);
  //   }
  //   return () => {
  //     if (timeout) {
  //       clearTimeout(timeout);
  //     }
  //   };
  // }, [showTip]);
  
  // Update content when value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '<p></p>');
    }
  }, [editor, value]);
  
  // Handle variable insertion
  const insertVariable = useCallback((variableName: string, triggerChar: '@' | '#' | null) => {
    if (!editor) return;
    
    // Insert the variable with the correct format without adding the trigger character
    editor.commands.insertContent(`<span class="editor-variable" data-variable="${variableName}">{${variableName}}</span>`);
    
    // Focus back on editor
    editor.commands.focus();
  }, [editor]);
  
  return {
    editor,
    // showTip, // Removed
    insertVariable
  };
}
