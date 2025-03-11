import { Mark, mergeAttributes } from '@tiptap/react';
import { Plugin, PluginKey } from '@tiptap/pm/state';

// Create a custom plugin to manage variable styling when editing
const createVariablePlugin = () => {
  return new Plugin({
    key: new PluginKey('variable-monitor'),
    props: {
      handleKeyDown: (view, event) => {
        // Check if we're inside a variable mark
        const { state } = view;
        const { selection } = state;
        const { from, to } = selection;
        
        // Get variable marks at the current selection
        const variableMarks = state.doc.rangeHasMark(from, to, state.schema.marks.variable);
        
        if (variableMarks) {
          // When editing a variable (typing or deleting), we'll update the styling
          // based on whether it matches our variable pattern
          if (event.key === 'Backspace' || event.key === 'Delete' || 
              /^[a-zA-Z0-9_{}]$/.test(event.key)) {
            
            // Let the default handler process the event first
            setTimeout(() => {
              const { state } = view;
              // Get the current node text content to check if it's still a valid variable
              const node = state.doc.nodeAt(selection.from);
              
              if (node && node.isText) {
                const text = node.text;
                const hasValidVariable = text && text.match(/^\{[a-zA-Z][a-zA-Z0-9_]*\}$/);
                
                // If no longer a valid variable format, update the data-variable attribute
                // which our CSS will use to control styling
                if (!hasValidVariable) {
                  const tr = state.tr;
                  state.doc.nodesBetween(from - 10, to + 10, (node, pos) => {
                    if (node.isText && node.marks.some(mark => mark.type.name === 'variable')) {
                      // Instead of removing the mark, update its attributes
                      const existingMark = node.marks.find(m => m.type.name === 'variable');
                      if (existingMark) {
                        // We'll keep the mark but set data-variable to 'editing' to trigger CSS changes
                        tr.addMark(
                          pos, 
                          pos + node.nodeSize, 
                          state.schema.marks.variable.create({
                            class: 'editor-variable',
                            'data-variable': 'editing'
                          })
                        );
                      }
                    }
                    return true;
                  });
                  
                  view.dispatch(tr);
                } else {
                  // If it's a valid variable, ensure it has the proper attribute
                  const varName = text?.slice(1, -1);
                  const tr = state.tr;
                  state.doc.nodesBetween(from - 10, to + 10, (node, pos) => {
                    if (node.isText && node.marks.some(mark => mark.type.name === 'variable')) {
                      tr.addMark(
                        pos, 
                        pos + node.nodeSize, 
                        state.schema.marks.variable.create({
                          class: 'editor-variable',
                          'data-variable': varName
                        })
                      );
                    }
                    return true;
                  });
                  
                  view.dispatch(tr);
                }
              }
            }, 10);
          }
        }
        return false;
      }
    }
  });
};

// Create a custom mark for variables
const VariableMark = Mark.create({
  name: 'variable',
  
  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },
  
  addAttributes() {
    return {
      class: {
        default: 'editor-variable'
      },
      'data-variable': {
        default: null
      }
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'span.editor-variable',
        getAttrs: (node) => {
          const element = node as HTMLElement;
          const text = element.textContent || '';
          
          // Accept all variable marks during parsing, we'll handle styling via CSS
          return {};
        }
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },
  
  // Critical settings to prevent variables spanning across nodes
  inclusive: false,
  excludes: '_', // Exclude all other marks
  spanning: false, // Prevent spanning across nodes
  keepOnSplit: false,
  
  // Add the custom plugin to handle variable editing
  addProseMirrorPlugins() {
    return [createVariablePlugin()];
  }
});

export default VariableMark;
