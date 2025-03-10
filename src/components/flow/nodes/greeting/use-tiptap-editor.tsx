
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCallback, useEffect, useState } from 'react';
import { 
  processInvalidVariables, 
  validateOnInput, 
  setupVariableValidationListeners, 
  cleanVariablesOnEnter,
  watchVariableContent
} from './variable-utils';
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
      
      // Immediately process variable validity on any edit
      processInvalidVariables(editor);
    },
    autofocus: false,
    // Improve HTML parsing to correctly handle variable spans
    parseOptions: {
      preserveWhitespace: 'full',
    },
    editorProps: {
      attributes: {
        class: 'prose-variable-aware',
      },
      // Intercept all key events for variable validation
      handleKeyDown: (view, event) => {
        // Specially handle the Enter key to prevent freezing
        if (event.key === 'Enter') {
          // Process all variables immediately
          const dom = view.dom;
          const variables = dom.querySelectorAll('.editor-variable');
          
          variables.forEach(variable => {
            // Immediately remove styling from all variables
            variable.classList.remove('editor-variable');
            variable.removeAttribute('data-variable');
            variable.setAttribute('style', 'background-color: transparent !important; color: inherit !important; font-weight: normal !important;');
          });
          
          // Let default handling continue after removing variable styling
          setTimeout(() => processInvalidVariables(editor), 0);
          
          // We don't want to stop propagation completely as that would prevent the Enter from working
          return false;
        }
        
        // Process variable validation on every keypress
        processInvalidVariables(editor);
        
        // Run validation again after a very short delay
        setTimeout(() => processInvalidVariables(editor), 0);
        return false;
      },
      // Handle input events directly for immediate feedback
      handleTextInput: (view, from, to, text) => {
        // Check if we're inside or near a variable
        const doc = view.state.doc;
        const $from = doc.resolve(from);
        
        // Get the node at current position
        const fromNode = view.domAtPos(from);
        
        if (fromNode && fromNode.node) {
          // Check if we're editing inside a variable
          let current = fromNode.node;
          while (current && current !== view.dom) {
            if (current.nodeType === Node.ELEMENT_NODE && 
                (current as Element).classList.contains('editor-variable')) {
              // We're inside a variable and changing text - must validate
              setTimeout(() => processInvalidVariables(editor), 0);
              break;
            }
            current = current.parentNode;
          }
        }
        
        // Let default handler run and validate variables after
        setTimeout(() => processInvalidVariables(editor), 0);
        return false;
      },
    },
  });

  // Variable validation with multiple aggressive strategies
  useEffect(() => {
    if (!editor?.view?.dom) return;
    
    // First strategy: Standard input validation
    const inputValidationCleanup = validateOnInput(editor);
    
    // Second strategy: Event-based validation
    const eventValidationCleanup = setupVariableValidationListeners(editor);
    
    // Third strategy: Enter key specific cleanup
    const enterKeyCleanup = cleanVariablesOnEnter(editor);
    
    // Fourth strategy: Content monitoring
    const contentMonitorCleanup = watchVariableContent(editor);
    
    // Fifth strategy: Interval checking
    const validationInterval = setInterval(() => {
      processInvalidVariables(editor);
    }, 100);
    
    // Mutation observer to watch span elements directly
    const spanObserver = new MutationObserver((mutations) => {
      let needsProcessing = false;
      
      for (const mutation of mutations) {
        if (mutation.type === 'characterData') {
          // Text changed inside a node
          const node = mutation.target;
          if (node.parentElement && node.parentElement.classList.contains('editor-variable')) {
            // Text changed inside a variable span
            needsProcessing = true;
            break;
          }
        } else if (mutation.type === 'childList') {
          // DOM structure changed
          const addedNodes = Array.from(mutation.addedNodes);
          const hasVariableSpan = addedNodes.some(node => {
            return node.nodeType === Node.ELEMENT_NODE && 
                   ((node as Element).classList.contains('editor-variable') ||
                   (node as Element).querySelector('.editor-variable') !== null);
          });
          
          if (hasVariableSpan) {
            needsProcessing = true;
            break;
          }
        }
      }
      
      if (needsProcessing) {
        // Process immediately
        processInvalidVariables(editor);
        
        // And again after a short delay to catch render updates
        setTimeout(() => processInvalidVariables(editor), 10);
        setTimeout(() => processInvalidVariables(editor), 50);
      }
    });
    
    spanObserver.observe(editor.view.dom, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true
    });
    
    return () => {
      if (inputValidationCleanup) inputValidationCleanup();
      if (eventValidationCleanup) eventValidationCleanup();
      if (enterKeyCleanup) enterKeyCleanup();
      if (contentMonitorCleanup) contentMonitorCleanup();
      clearInterval(validationInterval);
      spanObserver.disconnect();
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
      // Remove the trigger character if it exists
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
      
      // First insert the plain text
      editor.commands.insertContent(variableText);
      
      // Then select the inserted text
      const currentPosition = editor.view.state.selection.$from.pos;
      const from = currentPosition - variableText.length;
      const to = currentPosition;
      
      // Set selection to the variable text we just inserted
      editor.commands.setTextSelection({ from, to });
      
      // Apply the variable mark to the selected text
      editor.commands.setMark('variable', { 
        'class': 'editor-variable',
        'data-variable': variable 
      });
      
      // Unset mark and move cursor to end
      editor.commands.unsetMark('variable');
      editor.commands.focus('end');
      
      // Force validation to correctly style the variable
      setTimeout(() => {
        if (editor.view && editor.view.dom) {
          const variables = editor.view.dom.querySelectorAll(`span[data-variable="${variable}"]`);
          variables.forEach(v => {
            if (!v.classList.contains('editor-variable')) {
              v.classList.add('editor-variable');
            }
          });
        }
        processInvalidVariables(editor);
      }, 10);
    }
  }, [editor]);

  return { editor, showTip, insertVariable };
}
