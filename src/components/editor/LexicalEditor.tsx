import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import {
  LexicalComposer,
  LexicalComposerProps,
  useLexicalComposerContext,
} from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { TRANSFORMERS } from '@lexical/markdown';
import { useLexicalTheme } from '@/hooks/useLexicalTheme';
import { MentionsPlugin } from './plugins/MentionsPlugin';
import { EmojisPlugin } from './plugins/EmojisPlugin';
import { CharactersCounter } from './ui/CharactersCounter';
import { Toolbar } from './ui/Toolbar';
import { INSERT_VARIABLE_COMMAND } from './commands';
import { VariableNode } from './nodes/VariableNode';
import { useEditorConfig } from './config';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useDebounce } from '@/hooks/useDebounce';
import { Label } from '@/components/ui/label';

export { INSERT_VARIABLE_COMMAND };

export interface LexicalEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onAtMention?: () => void;
}

export const LexicalEditor = forwardRef<any, LexicalEditorProps>(
  ({ value, onChange, placeholder, className, onAtMention }, ref) => {
    const editorConfig = useEditorConfig(placeholder, onAtMention);
    const [editorValue, setEditorValue] = useState(value);
    const debouncedValue = useDebounce(editorValue, 500);

    useEffect(() => {
      onChange(debouncedValue);
    }, [debouncedValue, onChange]);

    useEffect(() => {
      setEditorValue(value);
    }, [value]);

    return (
      <LexicalComposer initialConfig={editorConfig}>
        <div className="relative">
          <div className="w-full">
            <RichTextPlugin
              contentEditable={
                <ContentEditable className={`${className} focus:outline-none`} />
              }
              placeholder={
                <div className="text-gray-500 dark:text-gray-400">{placeholder}</div>
              }
              ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <AutoFocusPlugin />
            <MentionsPlugin onAtMention={onAtMention} />
            <EmojisPlugin />
            <OnChangePlugin onChange={(editorState) => {
              // Convert editorState to JSON string
              editorState.read(() => {
                const editorContent = editorState.toJSON();
                setEditorValue(JSON.stringify(editorContent));
              });
            }} />
          </div>
          <CharactersCounter />
        </div>
      </LexicalComposer>
    );
  }
);

LexicalEditor.displayName = 'LexicalEditor';
