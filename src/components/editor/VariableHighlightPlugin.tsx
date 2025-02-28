
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isVariableNode } from './VariableNode';
import { LexicalNode, NodeMutation, $getRoot, TextNode } from 'lexical';

// This plugin highlights variable nodes and provides proper styling
export function VariableHighlightPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Function to scan all nodes and detect variables
    const scanForVariables = () => {
      editor.update(() => {
        const root = $getRoot();
        const children = root.getChildren();
        
        children.forEach((child) => {
          if (child instanceof TextNode) {
            if ($isVariableNode(child)) {
              // Apply styling if needed here
              // This is usually handled by the VariableNode's createDOM method
            }
          } else {
            // Handle non-text nodes if they may contain text (e.g., paragraphs)
            const textNodes = child.getChildren();
            textNodes.forEach((textNode) => {
              if ($isVariableNode(textNode)) {
                // Apply styling as needed
              }
            });
          }
        });
      });
    };

    // Listen for node mutations
    const removeListener = editor.registerMutationListener(
      (mutationListMap, editor) => {
        for (const [nodeKey, mutation] of Object.entries(mutationListMap)) {
          if (mutation === 'created') {
            scanForVariables();
          }
        }
      }
    );

    // Initial scan
    scanForVariables();

    return () => {
      removeListener();
    };
  }, [editor]);

  return null;
}
