
// Valid variable format: {variableName} - alphanumeric and underscore only
// Only shorter variable names between 2-20 characters are allowed
export const VALID_VARIABLE_REGEX = /^\{[a-zA-Z][a-zA-Z0-9_]{1,19}\}$/;

// Function to check if a text string is a valid variable format
export const isValidVariable = (text: string) => {
  return VALID_VARIABLE_REGEX.test(text) && 
         !text.includes('\n') && 
         !text.includes('\r') && 
         !text.includes(' ');
};

// Process and clean up invalid variables - this runs very frequently
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
      
      // Break styling immediately if the variable no longer matches expected format
      if (!isValidVariable(text)) {
        // Force remove styling on invalid variable node
        node.classList.remove('editor-variable');
        node.removeAttribute('data-variable');
        
        // Apply clear styling overrides
        node.setAttribute('style', 'background-color: transparent !important; color: inherit !important; ' + 
                                  'font-weight: normal !important; border-radius: 0 !important; ' +
                                  'padding: 0 !important; box-shadow: none !important; ' +
                                  'white-space: normal !important;');
        
        // Use editor commands to completely remove the mark if we can
        try {
          const range = document.createRange();
          range.selectNode(node);
          
          const selection = window.getSelection();
          if (selection) {
            // Clear existing selections
            selection.removeAllRanges();
            selection.addRange(range);
            
            // Forcefully unset the mark
            editor.chain().focus().unsetMark('variable').run();
            
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
          v.removeAttribute('data-variable');
          v.setAttribute('style', 'background-color: transparent !important; color: inherit !important; font-weight: normal !important;');
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
  
  // Monitor all input events to detect variable changes immediately
  const handleInput = () => {
    // Immediate processing
    setTimeout(() => processInvalidVariables(editor), 0);
  };
  
  editor.view.dom.addEventListener('input', handleInput, true);
  editor.view.dom.addEventListener('keydown', handleInput, true);
  editor.view.dom.addEventListener('keyup', handleInput, true);
  
  // Set up a MutationObserver with high sensitivity
  const observer = new MutationObserver(() => {
    processInvalidVariables(editor); // Run processing immediately
  });
  
  // Observe all changes with maximum sensitivity
  observer.observe(editor.view.dom, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    characterDataOldValue: true
  });
  
  return () => {
    editor.view.dom.removeEventListener('input', handleInput, true);
    editor.view.dom.removeEventListener('keydown', handleInput, true);
    editor.view.dom.removeEventListener('keyup', handleInput, true);
    observer.disconnect();
  };
};

// Enhanced validation for line breaks and other variable-breaking events
export const setupVariableValidationListeners = (editor: any) => {
  if (!editor?.view?.dom) return;
  
  const editorDOM = editor.view.dom;
  
  // Aggressive variable content monitoring
  const contentChangeMonitor = (e: Event) => {
    // Check every 10ms for a short duration to catch any changes
    const startTime = Date.now();
    const interval = setInterval(() => {
      processInvalidVariables(editor);
      
      // Stop after 200ms to avoid performance issues
      if (Date.now() - startTime > 200) {
        clearInterval(interval);
      }
    }, 10);
  };
  
  // Special handler for key events that might modify variable content
  const handleKeyEvents = (e: KeyboardEvent) => {
    // If Enter key was pressed, immediately strip variable formatting from all variables
    if (e.key === 'Enter') {
      const variableElements = editorDOM.querySelectorAll('.editor-variable');
      variableElements.forEach(el => {
        // Immediately break styling on ENTER key anywhere in editor
        el.classList.remove('editor-variable');
        el.removeAttribute('data-variable');
        el.setAttribute('style', 'background-color: transparent !important; color: inherit !important; font-weight: normal !important;');
      });
      
      // Stop event propagation to prevent freezing
      e.stopPropagation();
      return;
    }
    
    // Specifically check if we're typing inside or near a variable
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      
      // Check if the range is inside or adjacent to a variable
      const variableElements = editorDOM.querySelectorAll('.editor-variable');
      variableElements.forEach(el => {
        if (range.intersectsNode(el)) {
          // We're typing inside or near a variable - check its content immediately
          setTimeout(() => {
            const text = el.textContent || '';
            if (!isValidVariable(text)) {
              // Immediately break styling
              el.classList.remove('editor-variable');
              el.removeAttribute('data-variable');
              
              // Apply direct style override
              el.setAttribute('style', 'background-color: transparent !important; color: inherit !important; font-weight: normal !important;');
              
              // Forcefully remove the mark through editor commands
              const tempRange = document.createRange();
              tempRange.selectNode(el);
              selection.removeAllRanges();
              selection.addRange(tempRange);
              editor.chain().unsetMark('variable').run();
              selection.removeAllRanges();
            }
          }, 0);
        }
      });
    }
    
    // Run normal processing as well
    processInvalidVariables(editor);
  };
  
  // Set up a character-level listener for immediate detection of changes
  const characterDataMonitor = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') {
        const node = mutation.target;
        if (node.parentElement && node.parentElement.classList.contains('editor-variable')) {
          // Direct text change inside a variable - check validity immediately
          const text = node.textContent || '';
          if (!isValidVariable(text)) {
            // Break variable styling immediately
            const parent = node.parentElement;
            parent.classList.remove('editor-variable');
            parent.removeAttribute('data-variable');
            parent.setAttribute('style', 'background-color: transparent !important; color: inherit !important; font-weight: normal !important;');
          }
        }
      }
    }
    
    // Also run standard processing
    processInvalidVariables(editor);
  });
  
  characterDataMonitor.observe(editorDOM, {
    characterData: true,
    subtree: true,
    characterDataOldValue: true
  });
  
  // Add all event listeners
  editorDOM.addEventListener('keydown', handleKeyEvents, true);
  editorDOM.addEventListener('keyup', handleKeyEvents, true);
  editorDOM.addEventListener('input', contentChangeMonitor, true);
  editorDOM.addEventListener('paste', contentChangeMonitor, true);
  editorDOM.addEventListener('cut', contentChangeMonitor, true);
  editorDOM.addEventListener('compositionend', contentChangeMonitor, true);
  editorDOM.addEventListener('compositionupdate', contentChangeMonitor, true);
  
  return () => {
    editorDOM.removeEventListener('keydown', handleKeyEvents, true);
    editorDOM.removeEventListener('keyup', handleKeyEvents, true);
    editorDOM.removeEventListener('input', contentChangeMonitor, true);
    editorDOM.removeEventListener('paste', contentChangeMonitor, true);
    editorDOM.removeEventListener('cut', contentChangeMonitor, true);
    editorDOM.removeEventListener('compositionend', contentChangeMonitor, true);
    editorDOM.removeEventListener('compositionupdate', contentChangeMonitor, true);
    characterDataMonitor.disconnect();
  };
};

// Function to forcibly clean all variable styling on Enter
export const cleanVariablesOnEnter = (editor: any) => {
  if (!editor?.view?.dom) return;
  
  const handleEnter = (event: KeyboardEvent) => {
    if (event.key === 'Enter') {
      // Force clean all variables on Enter
      const variables = editor.view.dom.querySelectorAll('.editor-variable');
      
      for (const variable of variables) {
        // Remove styling immediately
        variable.classList.remove('editor-variable');
        variable.removeAttribute('data-variable');
        variable.setAttribute('style', 'background-color: transparent !important; color: inherit !important; font-weight: normal !important;');
      }
      
      // Stop event propagation to prevent freezing
      event.stopImmediatePropagation();
      
      // Also run multiple cleaning passes
      setTimeout(() => processInvalidVariables(editor), 0);
      setTimeout(() => processInvalidVariables(editor), 50);
      setTimeout(() => processInvalidVariables(editor), 100);
    }
  };
  
  // Add the event listener with capture to get it before default handling
  editor.view.dom.addEventListener('keydown', handleEnter, true);
  
  return () => {
    editor.view.dom.removeEventListener('keydown', handleEnter, true);
  };
};

// Function to watch for character-by-character changes inside variables
export const watchVariableContent = (editor: any) => {
  if (!editor?.view?.dom) return;
  
  // Set up a real-time character monitoring system
  const checkVariableContent = () => {
    const variableElements = editor.view.dom.querySelectorAll('.editor-variable');
    variableElements.forEach(el => {
      const text = el.textContent || '';
      if (!isValidVariable(text)) {
        // Break styling immediately
        el.classList.remove('editor-variable');
        el.removeAttribute('data-variable');
        
        // Apply direct style removal
        el.setAttribute('style', 'background-color: transparent !important; color: inherit !important; font-weight: normal !important;');
        
        // Also try to remove through editor API if possible
        try {
          const range = document.createRange();
          range.selectNode(el);
          
          const selection = window.getSelection();
          if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
            editor.chain().unsetMark('variable').run();
            selection.removeAllRanges();
          }
        } catch (err) {
          // Ignore - we already removed styling directly
        }
      }
    });
  };
  
  // Run checks frequently
  const interval = setInterval(checkVariableContent, 100);
  
  return () => {
    clearInterval(interval);
  };
};
