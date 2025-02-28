
import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createTextNode,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  LexicalCommand,
  TextNode
} from 'lexical';
import { $createVariableNode } from './VariableNode';

export const INSERT_VARIABLE_COMMAND: LexicalCommand<string> = createCommand();

export interface Variable {
  id: string;
  name: string;
}

export function VariablePlugin({ 
  onAtMention,
  variables = []
}: { 
  onAtMention?: () => void;
  variables?: Variable[];
}) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    // Handle @ key press for at-mentions
    const removeKeyDownListener = editor.registerTextContentListener(
      (text) => {
        const lastChar = text[text.length - 1];
        if (lastChar === '@' && onAtMention) {
          onAtMention();
        }
      }
    );

    // Register command for inserting variables
    const removeCommandListener = editor.registerCommand(
      INSERT_VARIABLE_COMMAND,
      (variableId) => {
        const selection = $getSelection();
        
        if ($isRangeSelection(selection)) {
          // Find the variable name from its ID
          const variable = variables.find(v => v.id === variableId) || { name: variableId };
          const variableNode = $createVariableNode(variable.name);
          selection.insertNodes([variableNode]);
          return true;
        }
        
        return false;
      },
      COMMAND_PRIORITY_EDITOR
    );

    return () => {
      removeKeyDownListener();
      removeCommandListener();
    };
  }, [editor, onAtMention, variables]);

  return null;
}
