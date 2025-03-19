
import { Mark, markPasteRule, mergeAttributes, Command } from '@tiptap/core';
import { toggleMark } from '@tiptap/pm/commands';
import { EditorState } from '@tiptap/pm/state';

export const Underline = Mark.create({
  name: 'underline',
  
  // Default priority is 100, we set a higher value to ensure this mark is applied first
  priority: 110,
  
  // Specify our attribute for this mark
  addAttributes() {
    return {
      // We can add more attributes here if needed
    };
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
  
  // Commands - properly typed to return a Command object
  addCommands() {
    return {
      setUnderline: () => ({ commands }): Command => {
        return commands.setMark('underline');
      },
      toggleUnderline: () => ({ commands }): Command => {
        return commands.toggleMark('underline');
      },
      unsetUnderline: () => ({ commands }): Command => {
        return commands.unsetMark('underline');
      },
    };
  },
  
  // Keyboard shortcut
  addKeyboardShortcuts() {
    return {
      'Mod-u': ({ editor }) => {
        return editor.commands.toggleMark('underline');
      },
    };
  },
});
