
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
          
          // Immediately reject any variable that doesn't match the exact pattern
          if (!text.match(/^\{[a-zA-Z][a-zA-Z0-9_]{1,19}\}$/)) {
            return false;
          }
          
          // Reject if it contains line breaks or spaces
          if (text.includes('\n') || text.includes('\r') || text.includes(' ')) {
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
  
  // Prevent spanning across nodes with these critical settings
  inclusive: false,
  excludes: '_', // Exclude all other marks
  spanning: false, // Prevent spanning across nodes
  keepOnSplit: false
});

export default VariableMark;
