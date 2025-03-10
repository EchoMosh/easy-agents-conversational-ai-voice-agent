
// Valid variable format: {variableName} - alphanumeric and underscore only
// Only shorter variable names between 2-20 characters are allowed
export const VALID_VARIABLE_REGEX = /^\{[a-zA-Z][a-zA-Z0-9_]{1,19}\}$/;

// Process and clean up invalid variables
export const processInvalidVariables = (editor: any) => {
  if (!editor || !editor.view) return;
  
  try {
    // Find all variable spans in the editor
    const editorDOM = editor.view.dom;
    if (!editorDOM) return;
    
    const variableSpans = editorDOM.querySelectorAll('.editor-variable');
    
    for (let i = 0; i < variableSpans.length; i++) {
      const node = variableSpans[i];
      const text = node.textContent || '';
      
      // Check if the variable contains invalid characters or structure
      const isValidVariable = 
        VALID_VARIABLE_REGEX.test(text) && 
        !text.includes('\n') && 
        !text.includes('\r') && 
        !text.includes(' ');
      
      if (!isValidVariable) {
        // Force remove styling on invalid variable node
        try {
          // First direct style removal to visually update immediately
          node.classList.remove('editor-variable');
          node.style.backgroundColor = 'transparent';
          node.style.color = 'inherit';
          node.style.fontWeight = 'normal';
          node.style.whiteSpace = 'normal';
          node.style.padding = '0';
          node.style.borderRadius = '0';
          node.style.boxShadow = 'none';
          
          // Then use editor commands to properly remove the mark
          const range = document.createRange();
          range.selectNode(node);
          
          const selection = window.getSelection();
          if (selection) {
            // Clear existing selections
            selection.removeAllRanges();
            selection.addRange(range);
            
            // Use the editor to unset the mark
            editor.chain()
              .focus()
              .unsetMark('variable')
              .run();
            
            // Clear the selection
            selection.removeAllRanges();
          }
        } catch (innerError) {
          console.error('Error processing variable node:', innerError);
        }
      }
    }
    
    // Also check for any P tag that contains a BR and a variable - this indicates a line break
    const paragraphs = editorDOM.querySelectorAll('p');
    paragraphs.forEach((p) => {
      if (p.querySelector('br') && p.querySelector('.editor-variable')) {
        // This paragraph has both a line break and a variable - need to split and clean
        const variables = p.querySelectorAll('.editor-variable');
        variables.forEach((v) => {
          // Force remove styling
          v.classList.remove('editor-variable');
          v.setAttribute('style', 'background-color: transparent; color: inherit; font-weight: normal;');
        });
      }
    });
    
  } catch (error) {
    console.error('Error in processInvalidVariables:', error);
  }
};

// Function for real-time validation during typing
export const validateOnInput = (editor: any) => {
  if (!editor?.view?.dom) return;
  
  // Set up a MutationObserver with high sensitivity
  const editorDOM = editor.view.dom;
  const observer = new MutationObserver((mutations) => {
    // Process immediately for any change
    processInvalidVariables(editor);
    
    // Special check for mutations that might include linebreaks
    for (const mutation of mutations) {
      if (mutation.type === 'childList' || mutation.type === 'characterData') {
        // Extra check for any newly inserted nodes that might break variables
        const nearbyBRs = editorDOM.querySelectorAll('br');
        if (nearbyBRs.length > 0) {
          nearbyBRs.forEach(br => {
            // Check siblings for variables
            let sibling = br.nextSibling;
            while (sibling) {
              if (sibling.nodeType === Node.ELEMENT_NODE && 
                  (sibling as Element).classList.contains('editor-variable')) {
                // Force remove styling from this variable
                (sibling as Element).classList.remove('editor-variable');
              }
              sibling = sibling.nextSibling;
            }
            
            sibling = br.previousSibling;
            while (sibling) {
              if (sibling.nodeType === Node.ELEMENT_NODE && 
                  (sibling as Element).classList.contains('editor-variable')) {
                // Force remove styling from this variable
                (sibling as Element).classList.remove('editor-variable');
              }
              sibling = sibling.previousSibling;
            }
          });
        }
      }
    }
  });
  
  // Observe all changes with maximum sensitivity
  observer.observe(editorDOM, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    characterDataOldValue: true
  });
  
  return () => observer.disconnect();
};

// Enhanced validation for line breaks and other variable-breaking events
export const setupVariableValidationListeners = (editor: any) => {
  if (!editor?.view?.dom) return;
  
  const editorDOM = editor.view.dom;
  
  // Critical event handler for Enter key and other variable-breaking events
  const handleVariableBreakingEvents = (e: Event) => {
    // Need to run right away and also after a short delay to catch DOM updates
    processInvalidVariables(editor);
    
    // Run again after a delay to catch any DOM updates
    setTimeout(() => {
      processInvalidVariables(editor);
      
      // Specifically check for paragraphs with line breaks AND variables
      const paragraphsWithBRs = editorDOM.querySelectorAll('p:has(br)');
      paragraphsWithBRs.forEach(p => {
        const variables = p.querySelectorAll('.editor-variable');
        if (variables.length > 0) {
          variables.forEach(v => {
            // Force remove styling
            v.classList.remove('editor-variable');
            editor.chain().selectNode(v).unsetMark('variable').run();
          });
        }
      });
    }, 10);
  };
  
  // More aggressive Enter key handling
  const handleEnterKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.keyCode === 13) {
      // Immediately process to catch variables that might be broken
      processInvalidVariables(editor);
      
      // Then find the cursor position and check nearby elements
      const selection = editor.view.state.selection;
      if (selection) {
        const pos = selection.$from.pos;
        // Use the editor's view to find DOM position
        const domPos = editor.view.domAtPos(pos);
        if (domPos && domPos.node) {
          // Check if we're inside or near a variable
          let current = domPos.node;
          let parent = current.parentNode;
          
          // Find any variable marks in the vicinity
          while (parent && parent !== editorDOM) {
            if (parent.nodeType === Node.ELEMENT_NODE) {
              const variables = parent.querySelectorAll('.editor-variable');
              if (variables.length > 0) {
                // Force clean these variables
                variables.forEach(v => {
                  v.classList.remove('editor-variable');
                  // Use TipTap to properly unset the mark
                  try {
                    const range = document.createRange();
                    range.selectNode(v);
                    const selection = window.getSelection();
                    if (selection) {
                      selection.removeAllRanges();
                      selection.addRange(range);
                      editor.chain().unsetMark('variable').run();
                      selection.removeAllRanges();
                    }
                  } catch (err) {
                    console.error('Error cleaning variable on Enter:', err);
                  }
                });
              }
            }
            parent = parent.parentNode;
          }
        }
      }
      
      // Set a series of delayed checks to catch variables after DOM updates
      for (let i = 1; i <= 5; i++) {
        setTimeout(() => processInvalidVariables(editor), i * 50);
      }
    }
  };
  
  // Add all relevant event listeners
  editorDOM.addEventListener('keydown', handleEnterKey, true);
  editorDOM.addEventListener('paste', handleVariableBreakingEvents, true);
  editorDOM.addEventListener('input', handleVariableBreakingEvents, true);
  editorDOM.addEventListener('compositionend', handleVariableBreakingEvents, true);
  editorDOM.addEventListener('mouseup', handleVariableBreakingEvents, true);
  
  // Also handle input events at the document level to catch bubbled events
  document.addEventListener('selectionchange', () => {
    setTimeout(() => processInvalidVariables(editor), 0);
  });
  
  return () => {
    editorDOM.removeEventListener('keydown', handleEnterKey, true);
    editorDOM.removeEventListener('paste', handleVariableBreakingEvents, true);
    editorDOM.removeEventListener('input', handleVariableBreakingEvents, true);
    editorDOM.removeEventListener('compositionend', handleVariableBreakingEvents, true);
    editorDOM.removeEventListener('mouseup', handleVariableBreakingEvents, true);
    document.removeEventListener('selectionchange', () => {
      setTimeout(() => processInvalidVariables(editor), 0);
    });
  };
};

// Function to forcibly clean all variable styling on Enter
export const cleanVariablesOnEnter = (editor: any) => {
  if (!editor?.view?.dom) return;
  
  const handleEnter = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      // First check if cursor is inside or near a variable
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        // Check if the range intersects with any variable
        const variables = editor.view.dom.querySelectorAll('.editor-variable');
        
        for (const variable of variables) {
          if (range.intersectsNode(variable)) {
            // Force remove the variable styling
            variable.classList.remove('editor-variable');
            setTimeout(() => {
              editor.chain().focus().unsetMark('variable').run();
            }, 0);
          }
        }
      }
      
      // Run multiple cleaning passes to ensure variables are properly removed
      setTimeout(() => {
        processInvalidVariables(editor);
      }, 0);
      
      setTimeout(() => {
        processInvalidVariables(editor);
      }, 50);
      
      setTimeout(() => {
        processInvalidVariables(editor);
      }, 100);
    }
  };
  
  // Add the event listener with capture to get it before default handling
  editor.view.dom.addEventListener('keydown', handleEnter, true);
  
  return () => {
    editor.view.dom.removeEventListener('keydown', handleEnter, true);
  };
};
