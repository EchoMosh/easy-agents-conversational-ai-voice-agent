
import { Mark, mergeAttributes } from '@tiptap/react';

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

  // New method to actively prevent splitting behavior
  keepOnSplit: false
});

export default VariableMark;
