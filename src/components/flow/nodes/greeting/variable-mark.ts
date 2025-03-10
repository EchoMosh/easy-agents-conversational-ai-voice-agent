
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
          
          // Reject if it contains line breaks, spaces, or other special characters
          if (text.includes('\n') || text.includes('\r') || text.includes(' ') || 
              text.includes('\t') || text.includes('\u00A0')) {
            return false;
          }
          
          // Also check for any DOM nesting - variables should be flat text
          if (element.querySelector('br') || element.querySelector('p') || 
              element.querySelector('div') || element.children.length > 0) {
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
  keepOnSplit: false, // Do not keep marks when splitting nodes
  
  // Additional method to handle splitting - remove marks
  onSplit() {
    return null; // Return null to indicate the mark should not be preserved
  }
});

export default VariableMark;
