
import { Mark, mergeAttributes } from '@tiptap/react';

// Create a custom mark for variables
const VariableMark = Mark.create({
  name: 'variable',
  
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
          // Only parse as variable if it doesn't contain newlines
          const element = node as HTMLElement;
          const text = element.textContent || '';
          if (text.includes('\n') || text.includes('\r')) {
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
  
  // Prevent the mark from spanning across paragraphs and exclude other marks
  inclusive: false,
  excludes: '_', // Exclude all other marks
  spanning: false // Explicitly prevent spanning across nodes
});

export default VariableMark;
