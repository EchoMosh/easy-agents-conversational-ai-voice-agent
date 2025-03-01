
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isVariableNode } from './VariableNode';
import { LexicalNode, $getRoot, TextNode, NodeMutation } from 'lexical';

// This plugin highlights variable nodes and provides proper styling
export function VariableHighlightPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Function to scan all nodes and detect variables
    const scanForVariables = () => {
      editor.update(() => {
        const root = $getRoot();
        const textNodes: TextNode[] = [];
        
        // Helper function to recursively collect all text nodes
        const collectTextNodes = (node: LexicalNode) => {
          if (node instanceof TextNode) {
            textNodes.push(node);
          }
          
          // Check if node is a parent node with children method
          if ('getChildren' in node && typeof node.getChildren === 'function') {
            const children = node.getChildren();
            children.forEach(collectTextNodes);
          }
        };
        
        // Start collecting from root
        collectTextNodes(root);
        
        // Process all found text nodes
        textNodes.forEach(textNode => {
          if ($isVariableNode(textNode)) {
            // Apply styling if needed here
            // This is usually handled by the VariableNode's createDOM method
          }
        });
      });
    };

    // Listen for node mutations
    const removeListener = editor.registerMutationListener(
      TextNode,
      (mutations: Map<string, NodeMutation>) => {
        for (const [nodeKey, mutation] of mutations.entries()) {
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
