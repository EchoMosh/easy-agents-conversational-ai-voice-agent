
// Valid variable format: {variableName} - alphanumeric and underscore only
// Only shorter variable names between 2-20 characters are allowed
export const VALID_VARIABLE_REGEX = /^\{[a-zA-Z][a-zA-Z0-9_]{1,19}\}$/;

// Process invalid variables and remove styling
export const processInvalidVariables = (editor: any) => {
  if (!editor || !editor.view || !editor.view.dom) return;
  
  try {
    // Find all variable spans in the editor
    const variableSpans = editor.view.dom.querySelectorAll('.editor-variable');
    
    for (let i = 0; i < variableSpans.length; i++) {
      const node = variableSpans[i];
      const text = node.textContent || '';
      
      // Check if the content is a valid variable format
      // Also check for newlines or whitespace which would make it invalid
      const isValidVariable = VALID_VARIABLE_REGEX.test(text) && !text.includes('\n') && !text.includes('\r');
      
      if (!isValidVariable) {
        try {
          // Create a range around this node
          const range = document.createRange();
          range.selectNode(node);
          
          // Get the selection
          const selection = window.getSelection();
          if (selection) {
            // Save current selection
            const savedRanges = [];
            for (let j = 0; j < selection.rangeCount; j++) {
              savedRanges.push(selection.getRangeAt(j).cloneRange());
            }
            
            // Clear any existing selection
            selection.removeAllRanges();
            // Add our new range
            selection.addRange(range);
            
            // Use the editor commands to remove the variable mark
            editor.chain()
              .unsetMark('variable')
              .run();
            
            // Restore previous selection
            selection.removeAllRanges();
            for (const savedRange of savedRanges) {
              selection.addRange(savedRange);
            }
          }
        } catch (innerError) {
          console.error('Error processing variable node:', innerError);
        }
      }
    }
    
  } catch (error) {
    console.error('Error in processInvalidVariables:', error);
  }
};

// Function to handle real-time validation during typing
export const validateOnInput = (editor: any) => {
  if (!editor) return;
  
  // Set up a MutationObserver to watch for DOM changes
  const editorDOM = editor.view.dom;
  const observer = new MutationObserver(() => {
    processInvalidVariables(editor);
  });
  
  // Observe all changes to the editor DOM
  observer.observe(editorDOM, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true
  });
  
  return () => observer.disconnect();
};
