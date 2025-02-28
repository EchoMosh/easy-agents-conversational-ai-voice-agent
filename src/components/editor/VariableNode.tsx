
import { TextNode } from 'lexical';

export class VariableNode extends TextNode {
  static getType(): string {
    return 'variable';
  }

  static clone(node: VariableNode): VariableNode {
    return new VariableNode(node.__text, node.__key);
  }

  createDOM(config: Record<string, any>): HTMLElement {
    const dom = document.createElement('span');
    dom.classList.add('editor-variable');
    dom.textContent = this.__text;
    return dom;
  }

  updateDOM(): boolean {
    // Return false to indicate DOM hasn't changed
    return false;
  }
}

export function $createVariableNode(text: string): VariableNode {
  return new VariableNode(text);
}

export function $isVariableNode(node: any): boolean {
  return node instanceof VariableNode;
}
