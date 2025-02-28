
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useState } from 'react';
import { $getSelection, $isRangeSelection, COMMAND_PRIORITY_EDITOR, TextNode, LexicalCommand, createCommand } from 'lexical';
import { $createVariableNode } from './VariableNode';
import { Variable } from '../flow/nodes/variable-mention/variable-selector';

interface VariablePluginProps {
  onAtMention?: () => void;
  variables?: Variable[];
}

export const INSERT_VARIABLE_COMMAND: LexicalCommand<string> = createCommand('INSERT_VARIABLE');

export function VariablePlugin({ 
  onAtMention,
  variables = []
}: VariablePluginProps) {
  const [editor] = useLexicalComposerContext();
  const [prevText, setPrevText] = useState('');

  useEffect(() => {
    // Create a custom command for inserting variables
    const removeInsertVariableListener = editor.registerCommand(
      INSERT_VARIABLE_COMMAND,
      (varId) => {
        editor.update(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            // Remove the @ character if it exists
            const anchorNode = selection.anchor.getNode();
            if (anchorNode instanceof TextNode) {
              const textContent = anchorNode.getTextContent();
              const atCharIndex = textContent.lastIndexOf('@');
              
              if (atCharIndex >= 0) {
                // Delete the @ character
                anchorNode.spliceText(atCharIndex, 1, '');
                
                // Insert the variable format
                const variableText = `{{${varId}}}`;
                selection.insertText(variableText);
              } else {
                // Just insert the variable if no @ was found
                const variableText = `{{${varId}}}`;
                selection.insertText(variableText);
              }
            }
          }
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );

    // Handle @ input for variable selector trigger
    const removeTextContentListener = editor.registerTextContentListener((text) => {
      if (text.includes('@') && text !== prevText) {
        // Only trigger if @ is a new character
        if (!prevText.includes('@') || text.split('@').length > prevText.split('@').length) {
          if (onAtMention) {
            onAtMention();
          }
        }
        setPrevText(text);
      }
    });

    return () => {
      removeInsertVariableListener();
      removeTextContentListener();
    };
  }, [editor, onAtMention, prevText]);

  return null;
}
