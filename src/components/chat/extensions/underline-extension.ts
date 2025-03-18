
import { Mark, mergeAttributes } from '@tiptap/core'

export const Underline = Mark.create({
  name: 'underline',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  parseHTML() {
    return [
      {
        tag: 'u',
      },
      {
        style: 'text-decoration',
        getAttrs: (value) => {
          return typeof value === 'string' && value.includes('underline') ? {} : false;
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['u', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setUnderline: () => ({ commands }) => {
        return commands.setMark('underline')
      },
      toggleUnderline: () => ({ commands }) => {
        return commands.toggleMark('underline')
      },
      unsetUnderline: () => ({ commands }) => {
        return commands.unsetMark('underline')
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-u': () => this.editor.commands.toggleMark(this.name),
    }
  },
})

export default Underline
