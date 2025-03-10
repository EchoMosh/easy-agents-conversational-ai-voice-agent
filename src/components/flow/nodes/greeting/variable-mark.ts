
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
          // Handle backspace, delete and other editing keys
          if (event.key === 'Backspace' || event.key === 'Delete' || /^[a-zA-Z0-9_]$/.test(event.key)) {
            // Let the default handler process the event
            // Then schedule a check to remove invalid variable styling
            setTimeout(() => {
              const { state, dispatch } = view;
              const { doc, selection } = state;
              const { from, to } = selection;
              
              // Find all variable marks in the current node
              const node = doc.nodeAt(from);
              if (!node) return;
              
              const tr = state.tr;
              let modified = false;
              
              // Check text content of each variable mark
              doc.nodesBetween(from - 10, to + 10, (node, pos) => {
                if (node.isText && node.marks.some(mark => mark.type.name === 'variable')) {
                  const text = node.text;
                  
                  // If text doesn't match variable pattern anymore, remove the mark
                  if (text && !text.match(/^\{[a-zA-Z][a-zA-Z0-9_]*\}$/)) {
                    tr.removeMark(
                      pos, 
                      pos + node.nodeSize, 
                      state.schema.marks.variable
                    );
                    modified = true;
                  }
                }
                return true;
              });
              
              if (modified) {
                dispatch(tr);
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
          // Only parse as variable if it's a clean variable format
          const element = node as HTMLElement;
          const text = element.textContent || '';
          
          // Reject any variable with newlines, spaces, or non-variable format
          if (text.includes('\n') || text.includes('\r') || text.includes(' ') || !text.match(/^\{[a-zA-Z][a-zA-Z0-9_]{1,19}\}$/)) {
            return false;
          }
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
