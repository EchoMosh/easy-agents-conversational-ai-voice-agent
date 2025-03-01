
import React, {
  useRef,
  useState,
  useEffect,
  forwardRef,
} from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useDebouncedCallback } from 'use-debounce';

// Create a simple command for variable insertion
export const INSERT_VARIABLE_COMMAND = 'INSERT_VARIABLE_COMMAND';

export interface LexicalEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onAtMention?: () => void;
}

// Define a basic editor configuration
const getEditorConfig = (placeholder?: string) => {
  return {
    namespace: 'GreetingEditor',
    theme: {
      paragraph: 'mb-1',
      text: {
        bold: 'font-bold',
        italic: 'italic',
        underline: 'underline',
        strikethrough: 'line-through',
      },
    },
    onError: (error: Error) => {
      console.error('Lexical Editor Error:', error);
    },
    nodes: [],
  };
};

export const LexicalEditor = forwardRef<any, LexicalEditorProps>(
  ({ value, onChange, placeholder, className, onAtMention }, ref) => {
    const [editorValue, setEditorValue] = useState(value);
    const debouncedOnChange = useDebouncedCallback((newValue) => {
      onChange(newValue);
    }, 500);

    useEffect(() => {
      debouncedOnChange(editorValue);
    }, [editorValue, debouncedOnChange]);

    useEffect(() => {
      setEditorValue(value);
    }, [value]);

    return (
      <LexicalComposer initialConfig={getEditorConfig(placeholder)}>
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
            <OnChangePlugin onChange={(editorState) => {
              editorState.read(() => {
                const editorContent = editorState.toJSON();
                setEditorValue(JSON.stringify(editorContent));
              });
            }} />
          </div>
          <div className="text-xs text-gray-500 mt-1 text-right">
            {editorValue ? JSON.stringify(editorValue).length : 0} characters
          </div>
        </div>
      </LexicalComposer>
    );
  }
);

LexicalEditor.displayName = 'LexicalEditor';
