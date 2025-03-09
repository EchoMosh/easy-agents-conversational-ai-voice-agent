
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
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  }
});

export default VariableMark;
