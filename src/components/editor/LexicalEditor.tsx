
import { useEffect, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createParagraphNode, EditorState, LexicalEditor as LexicalEditorType, $createTextNode } from 'lexical';
import { VariableNode } from './VariableNode';
import { VariablePlugin, INSERT_VARIABLE_COMMAND } from './VariablePlugin';
import { VariableHighlightPlugin } from './VariableHighlightPlugin';
import './editor.css';
import { Variable } from '../flow/nodes/variable-mention/variable-selector';

// Helper function to normalize text by removing excessive line breaks
function normalizeText(text: string): string {
  // Replace consecutive newlines with a single one and trim leading/trailing newlines
  return text.replace(/\n{3,}/g, '\n\n').replace(/^\n+|\n+$/g, '');
}

function InitialValuePlugin({ value }: { value: string }) {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    editor.update(() => {
      const root = $getRoot();
      if (root.getTextContent() === '') {
        if (value) {
          // Normalize the value before setting it
          const normalizedValue = normalizeText(value);
          const paragraph = $createParagraphNode();
          paragraph.append($createTextNode(normalizedValue));
          root.append(paragraph);
        }
      }
    });
  }, [editor, value]);
  
  return null;
}

interface LexicalEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  onAtMention?: () => void;
  insertVariable?: (varId: string) => void;
  variables?: Variable[];
}

export function LexicalEditor({ 
  value = '', 
  onChange, 
  placeholder = 'Type something...',
  className = '',
  onAtMention,
  insertVariable,
  variables = []
}: LexicalEditorProps) {
  const editorRef = useRef<LexicalEditorType | null>(null);
  
  // Normalize the input value to remove excessive newlines
  const normalizedValue = normalizeText(value);

  const initialConfig = {
    namespace: 'FlowNodeEditor',
    theme: {
      paragraph: 'editor-paragraph',
      text: {
        base: 'editor-text',
        underline: 'editor-text-underline',
      },
      variable: 'editor-variable'
    },
    onError: (error: Error) => {
      console.error('Lexical Editor Error:', error);
    },
    nodes: [VariableNode]
  };

  function handleEditorChange(editorState: EditorState) {
    editorState.read(() => {
      const root = $getRoot();
      const textContent = root.getTextContent();
      if (onChange) {
        // Normalize output text to prevent excessive newlines
        onChange(normalizeText(textContent));
      }
    });
  }

  useEffect(() => {
    if (insertVariable) {
      const originalInsertVariable = insertVariable;
      insertVariable = (varId: string) => {
        if (editorRef.current) {
          editorRef.current.dispatchCommand(INSERT_VARIABLE_COMMAND, varId);
        }
        originalInsertVariable(varId);
      };
    }
  }, [insertVariable]);

  function captureEditor(editor: LexicalEditorType) {
    editorRef.current = editor;
  }

  const containerStyle = {
    width: '250px',
    maxWidth: '250px', 
    minWidth: '0',
    overflow: 'hidden',
    flex: '1 1 auto'
  };

  const contentEditableStyle = {
    width: '100%',
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    wordBreak: 'break-word' as const,
    overflowWrap: 'break-word' as const,
    whiteSpace: 'pre-wrap' as const,
    hyphens: 'auto' as const
  };

  return (
    <div className={`editor-container nodrag ${className}`} style={containerStyle}>
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextPlugin
          contentEditable={<ContentEditable className="editor-input" style={contentEditableStyle} />}
          placeholder={<div className="editor-placeholder">{placeholder}</div>}
          ErrorBoundary={({ children }) => <div>{children}</div>}
        />
        <OnChangePlugin onChange={handleEditorChange} />
        <HistoryPlugin />
        <InitialValuePlugin value={normalizedValue} />
        <VariablePlugin 
          onAtMention={onAtMention}
          variables={variables}
        />
        <VariableHighlightPlugin />
        <CaptureEditorPlugin onCaptureEditor={captureEditor} />
      </LexicalComposer>
    </div>
  );
}

function CaptureEditorPlugin({ onCaptureEditor }: { onCaptureEditor: (editor: LexicalEditorType) => void }) {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    onCaptureEditor(editor);
  }, [editor, onCaptureEditor]);
  
  return null;
}

export { INSERT_VARIABLE_COMMAND };
