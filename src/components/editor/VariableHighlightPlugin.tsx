
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { TextNode } from 'lexical';
import { $getRoot } from 'lexical';

export function VariableHighlightPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const textNodes: TextNode[] = [];

        // Collect all text nodes
        root.getChildren().forEach(paragraph => {
          paragraph.getChildren().forEach(node => {
            if (node instanceof TextNode) {
              textNodes.push(node);
            }
          });
        });

        // Process each text node for variable patterns
        textNodes.forEach(textNode => {
          const text = textNode.getTextContent();
          const variableRegex = /{{([^}]+)}}/g;
          let match;
          let lastIndex = 0;
          const segments = [];

          // Find all variable matches
          while ((match = variableRegex.exec(text)) !== null) {
            // Add text before the variable if there is any
            if (match.index > lastIndex) {
              segments.push({
                text: text.substring(lastIndex, match.index),
                isVariable: false
              });
            }

            // Add the variable
            segments.push({
              text: match[0], // The full match {{variable}}
              isVariable: true
            });

            lastIndex = match.index + match[0].length;
          }

          // Add any remaining text after the last variable
          if (lastIndex < text.length) {
            segments.push({
              text: text.substring(lastIndex),
              isVariable: false
            });
          }

          // If we found variables, replace the node content
          if (segments.length > 1) {
            // This is where we would replace the content with styled variable nodes
            // For now, we're just using CSS to style the variables
          }
        });
      });
    });
  }, [editor]);

  return null;
}
