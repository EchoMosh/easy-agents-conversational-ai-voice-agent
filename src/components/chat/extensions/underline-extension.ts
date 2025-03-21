
import { Mark, mergeAttributes } from '@tiptap/core';
import { markRaw } from 'vue';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    underline: {
      /**
       * Set an underline mark
       */
      setUnderline: () => ReturnType;
      /**
       * Toggle an underline mark
       */
      toggleUnderline: () => ReturnType;
      /**
       * Unset an underline mark
       */
      unsetUnderline: () => ReturnType;
    };
  }
}

export const UnderlineExtension = Mark.create({
  name: 'underline',

  defaultOptions: {
    HTMLAttributes: {},
  },

  parseHTML() {
    return [
      { tag: 'u' },
      { style: 'text-decoration', getAttrs: (value) => value === 'underline' },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['u', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setUnderline: () => ({ commands }) => {
        return commands.setMark('underline');
      },
      toggleUnderline: () => ({ commands }) => {
        return commands.toggleMark('underline');
      },
      unsetUnderline: () => ({ commands }) => {
        return commands.unsetMark('underline');
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      'Mod-u': () => this.editor.commands.toggleUnderline(),
      'Mod-U': () => this.editor.commands.toggleUnderline(),
    };
  },
});
