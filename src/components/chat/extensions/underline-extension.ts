
import { Mark, markInputRule, markPasteRule, mergeAttributes } from '@tiptap/core';

export const Underline = Mark.create({
  name: 'underline',
  
  // Default priority is 100, we set a higher value to ensure this mark is applied first
  priority: 110,
  
  // Specify our attribute for this mark
  addAttributes() {
    return {};
  },
  
  // How to parse the HTML
  parseHTML() {
    return [
      { tag: 'u' },
      { style: 'text-decoration=underline' },
    ];
  },
  
  // How to render the HTML
  renderHTML({ HTMLAttributes }) {
    return ['u', mergeAttributes(HTMLAttributes), 0];
  },
  
  // Commands that can be called from the editor - fixed return type
  addCommands() {
    return {
      setUnderline: () => ({ commands }) => {
        return commands.setMark(this.name);
      },
      toggleUnderline: () => ({ commands }) => {
        return commands.toggleMark(this.name);
      },
      unsetUnderline: () => ({ commands }) => {
        return commands.unsetMark(this.name);
      },
    };
  },
  
  // Keyboard shortcut
  addKeyboardShortcuts() {
    return {
      'Mod-u': () => this.editor.commands.toggleMark(this.name),
    };
  },
  
  // Add input rules for markdown-like syntax
  addInputRules() {
    return [
      markInputRule({
        find: /(?:__)([^_]+)(?:__)$/,
        type: this.type,
      }),
    ];
  },
  
  // Add paste rules to handle pasting underlined content
  addPasteRules() {
    return [
      markPasteRule({
        find: /(?:__)([^_]+)(?:__)/g,
        type: this.type,
      }),
    ];
  },
});
