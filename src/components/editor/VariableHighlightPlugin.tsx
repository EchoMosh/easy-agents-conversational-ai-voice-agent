
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isVariableNode } from './VariableNode';
import { LexicalNode, NodeMutation, $getRoot } from 'lexical';

// This plugin highlights variable nodes and provides proper styling
export function VariableHighlightPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Function to scan all nodes and detect variables
    const scanForVariables = () => {
      editor.update(() => {
        const root = $getRoot();
        const children = root.getChildren();
        
        for (const child of children) {
          const textNodes = child.getChildren();
          for (const textNode of textNodes) {
            if ($isVariableNode(textNode)) {
              // Apply styling if needed here
              // This is usually handled by the VariableNode's createDOM method
            }
          }
        }
      });
    };

    // Listen for node mutations
    const removeListener = editor.registerMutationListener((mutationList) => {
      for (const [node, mutation] of Object.entries(mutationList)) {
        if (mutation === NodeMutation.CREATED) {
          scanForVariables();
        }
      }
    });

    // Initial scan
    scanForVariables();

    return () => {
      removeListener();
    };
  }, [editor]);

  return null;
}
