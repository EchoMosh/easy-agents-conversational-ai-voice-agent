
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCallback, useEffect, useState } from 'react';
import { processInvalidVariables, validateOnInput, setupVariableValidationListeners } from './variable-utils';
import VariableMark from './variable-mark';

interface UseTiptapEditorProps {
  value: string;
  onChange: (value: string) => void;
  onVariableTrigger?: (triggerChar: '#') => void;
}

export function useTiptapEditor({ value, onChange, onVariableTrigger }: UseTiptapEditorProps) {
  const [showTip, setShowTip] = useState(true);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Configure paragraph to better handle variables
        paragraph: {
          HTMLAttributes: {
            class: 'editor-paragraph',
          },
        },
      }),
      VariableMark,
    ],
    content: value || '<p></p>',
    onUpdate: ({ editor }) => {
      const htmlContent = editor.getHTML();
      onChange(htmlContent);
      
      // Hide the tip when user starts typing
      if (editor.getText().trim() !== '') {
        setShowTip(false);
      } else {
        setShowTip(true);
      }
      
      // Check if # was just typed
      const selection = editor.view.state.selection;
      if (selection.empty) {
        const position = selection.$from.pos;
        const textBefore = editor.view.state.doc.textBetween(
          Math.max(0, position - 1),
          position,
          ''
        );
        
        if (textBefore === '#' && onVariableTrigger) {
          // Show the full-screen variable selector
          onVariableTrigger('#');
        }
      }
      
      // Process invalid variables after any update
      setTimeout(() => {
        processInvalidVariables(editor);
      }, 0);
    },
    autofocus: false,
    // Improve HTML parsing to correctly handle variable spans
    parseOptions: {
      preserveWhitespace: 'full',
    },
  });

  // Enhanced variable validation that watches for key input events
  useEffect(() => {
    if (!editor?.view?.dom) return;
    
    // Set up listeners for events that might affect variables
    const handleKeyInput = () => {
      setTimeout(() => processInvalidVariables(editor), 0);
    };
    
    const editorDOM = editor.view.dom;
    editorDOM.addEventListener('keydown', handleKeyInput);
    editorDOM.addEventListener('input', handleKeyInput);
    editorDOM.addEventListener('paste', handleKeyInput);
    editorDOM.addEventListener('mouseup', handleKeyInput);
    
    // Set up mutation observer for DOM changes
    const cleanupObserver = validateOnInput(editor);
    
    // Set up variable-specific validation
    const cleanupVariableListeners = setupVariableValidationListeners(editor);
    
    // Additional handler for Enter key which often causes issues
    const handleEnterKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        // Force check for broken variables
        setTimeout(() => {
          processInvalidVariables(editor);
        }, 0);
      }
    };
    
    editorDOM.addEventListener('keydown', handleEnterKey);
    
    return () => {
      editorDOM.removeEventListener('keydown', handleKeyInput);
      editorDOM.removeEventListener('input', handleKeyInput);
      editorDOM.removeEventListener('paste', handleKeyInput);
      editorDOM.removeEventListener('mouseup', handleKeyInput);
      editorDOM.removeEventListener('keydown', handleEnterKey);
      if (cleanupObserver) cleanupObserver();
      if (cleanupVariableListeners) cleanupVariableListeners();
    };
  }, [editor]);

  // Check for invalid variables when content is set from outside
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '<p></p>');
      
      if (editor.getText().trim() === '') {
        setShowTip(true);
      } else {
        setShowTip(false);
      }
      
      // Process any invalid variables after content is set
      setTimeout(() => {
        if (editor.isEditable) {
          processInvalidVariables(editor);
        }
      }, 0);
    }
  }, [value, editor]);

  // More aggressive validation check
  useEffect(() => {
    if (editor) {
      const checkTimer = setInterval(() => {
        processInvalidVariables(editor);
      }, 100); // Check more frequently
      
      return () => clearInterval(checkTimer);
    }
  }, [editor]);

  const insertVariable = useCallback((variable: string, triggerChar: string | null = null) => {
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
      
      // Fixed: Use only one pair of curly braces for the variable
      const variableText = `{${variable}}`;
      
      editor.chain()
        .focus()
        .insertContent({
          type: 'text',
          text: variableText,
          marks: [
            {
              type: 'variable',
              attrs: {
                class: 'editor-variable',
                'data-variable': variable
              }
            }
          ]
        })
        .unsetMark('variable') // Important: Unset the variable mark after insertion
        .run();
      
      // Ensure focus is maintained and cursor is positioned correctly
      editor.commands.focus('end');
      
      // Force validation of variables right after insertion
      setTimeout(() => {
        processInvalidVariables(editor);
      }, 0);
    }
  }, [editor]);

  return { editor, showTip, insertVariable };
}
