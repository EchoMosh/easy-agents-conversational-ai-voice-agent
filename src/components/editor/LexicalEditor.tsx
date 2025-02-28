
import { useEffect, useRef } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposerContext';
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

// This plugin is responsible for setting the initial value
function InitialValuePlugin({ value }: { value: string }) {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    editor.update(() => {
      const root = $getRoot();
      if (root.getTextContent() === '') {
        if (value) {
          const paragraph = $createParagraphNode();
          paragraph.append($createTextNode(value));
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
        onChange(textContent);
      }
    });
  }

  // Method to expose insert variable command to parent
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

  return (
    <div className={`editor-container nodrag ${className}`}>
      <LexicalComposer initialConfig={initialConfig}>
        <RichTextPlugin
          contentEditable={<ContentEditable className="editor-input" />}
          placeholder={<div className="editor-placeholder">{placeholder}</div>}
          ErrorBoundary={({ children }) => <div>{children}</div>}
        />
        <OnChangePlugin onChange={handleEditorChange} />
        <HistoryPlugin />
        <InitialValuePlugin value={value} />
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

// Plugin to capture the editor instance
function CaptureEditorPlugin({ onCaptureEditor }: { onCaptureEditor: (editor: LexicalEditorType) => void }) {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    onCaptureEditor(editor);
  }, [editor, onCaptureEditor]);
  
  return null;
}

// Export the command for external use
export { INSERT_VARIABLE_COMMAND };
