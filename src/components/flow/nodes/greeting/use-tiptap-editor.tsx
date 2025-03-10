
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCallback, useEffect, useState } from 'react';
import { processInvalidVariables, validateOnInput, setupVariableValidationListeners, cleanVariablesOnEnter } from './variable-utils';
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
    editorProps: {
      // Add custom handlers for keydown to watch for Enter
      handleKeyDown: (view, event) => {
        if (event.key === 'Enter') {
          // This event will fire before the actual Enter is processed
          // Force check and clean variables near cursor
          setTimeout(() => {
            processInvalidVariables(editor);
          }, 0);
          
          // Let the default handler continue
          return false;
        }
        return false;
      },
    },
  });

  // Variable validation with multiple strategies
  useEffect(() => {
    if (!editor?.view?.dom) return;
    
    // First strategy: Standard input validation
    const inputValidationCleanup = validateOnInput(editor);
    
    // Second strategy: Event-based validation
    const eventValidationCleanup = setupVariableValidationListeners(editor);
    
    // Third strategy: Enter key specific cleanup
    const enterKeyCleanup = cleanVariablesOnEnter(editor);
    
    // Fourth strategy: Interval checking for persistent cases
    const validationInterval = setInterval(() => {
      processInvalidVariables(editor);
    }, 200);
    
    // Apply a MutationObserver specifically watching for line breaks near variables
    const lineBreakObserver = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          const addedNodes = Array.from(mutation.addedNodes);
          // Check if any added node is a BR or contains a BR
          const hasBR = addedNodes.some(node => {
            if (node.nodeName === 'BR') return true;
            if (node.nodeType === Node.ELEMENT_NODE) {
              return (node as Element).querySelector('br') !== null;
            }
            return false;
          });
          
          if (hasBR) {
            // If a BR was added, aggressively clean variables
            processInvalidVariables(editor);
            
            // Run several delayed cleaning attempts to catch post-render issues
            for (let i = 1; i <= 5; i++) {
              setTimeout(() => processInvalidVariables(editor), i * 50);
            }
          }
        }
      }
    });
    
    lineBreakObserver.observe(editor.view.dom, {
      childList: true,
      subtree: true,
    });
    
    return () => {
      if (inputValidationCleanup) inputValidationCleanup();
      if (eventValidationCleanup) eventValidationCleanup();
      if (enterKeyCleanup) enterKeyCleanup();
      clearInterval(validationInterval);
      lineBreakObserver.disconnect();
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
