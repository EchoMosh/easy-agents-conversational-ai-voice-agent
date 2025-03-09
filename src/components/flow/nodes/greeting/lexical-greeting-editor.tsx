
import { useCallback, useEffect, useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { VariableSelector } from '../variable-mention/variable-selector';
import { $createTextNode } from 'lexical';
import { cn } from '@/lib/utils';
import { TextNode } from 'lexical';

interface VariableNodeProps {
  id: string;
  children: string[];
}

class VariableNode extends TextNode {
  __id: string;

  static getType(): string {
    return 'variable';
  }

  static clone(node: VariableNode): VariableNode {
    return new VariableNode(node.__id, node.__text);
  }

  constructor(id: string, text: string) {
    super(text);
    this.__id = id;
  }

  createDOM(config: any): HTMLElement {
    const dom = document.createElement('span');
    dom.className = 'inline-block px-1 py-0.5 rounded text-indigo-700 bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-900/30 font-medium text-sm variable-node';
    dom.textContent = this.__text;
    return dom;
  }

  updateDOM(): boolean {
    // Returning false tells Lexical this node doesn't need
    // to re-create its DOM element
    return false;
  }

  getVariableId(): string {
    return this.__id;
  }
}

// Register the Variable node type with the appropriate conversions
const initialConfig = {
  namespace: 'GreetingEditor',
  theme: {
    paragraph: 'greeting-paragraph',
    text: {
      bold: 'greeting-bold',
      italic: 'greeting-italic',
      underline: 'greeting-underline',
      variable: 'greeting-variable'
    }
  },
  onError: (error: Error) => {
    console.error('Lexical Editor Error:', error);
  },
  nodes: [VariableNode]
};

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
}

function VariablePlugin({ showVariableSelector, setShowVariableSelector, onSelectVariable }: {
  showVariableSelector: boolean;
  setShowVariableSelector: (show: boolean) => void;
  onSelectVariable: (id: string) => void;
}) {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '@' && !showVariableSelector) {
        e.preventDefault();
        
        editor.update(() => {
          // Insert the @ character
          const textNode = $createTextNode('@');
          $getRoot().getLastDescendant()?.insertAfter(textNode);
        });
        
        setShowVariableSelector(true);
      }
    };

    // Use a proper Lexical command for keydown
    return editor.registerRootListener((rootElement: HTMLElement | null) => {
      if (rootElement) {
        rootElement.addEventListener('keydown', handleKeyDown);
        return () => {
          rootElement.removeEventListener('keydown', handleKeyDown);
        };
      }
      return () => {};
    });
  }, [editor, setShowVariableSelector, showVariableSelector]);

  return showVariableSelector ? (
    <VariableSelector
      text=""
      onSelectVariable={(variableId) => {
        editor.update(() => {
          // Remove the @ character
          const lastDescendant = $getRoot().getLastDescendant();
          if (lastDescendant?.getTextContent() === '@') {
            lastDescendant.remove();
          }
          
          // Create a variable node
          const variableText = `{{${variableId}}}`;
          const variableNode = new VariableNode(variableId, variableText);
          
          // Insert it
          const selection = $getRoot().getLastDescendant();
          selection?.insertAfter(variableNode);
          
          // Add a space after the variable
          const spaceNode = $createTextNode(' ');
          variableNode.insertAfter(spaceNode);
          
          // Set selection after the space
          spaceNode.select();
        });
        
        onSelectVariable(variableId);
        setShowVariableSelector(false);
      }}
      onClose={() => setShowVariableSelector(false)}
    />
  ) : null;
}

function TextChangePlugin({ onChange }: { onChange: (text: string) => void }) {
  const [editor] = useLexicalComposerContext();
  
  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const text = root.getTextContent();
        onChange(text);
      });
    });
  }, [editor, onChange]);
  
  return null;
}

function EditorValuePlugin({ value }: { value: string }) {
  const [editor] = useLexicalComposerContext();
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (!isInitialized && value) {
      editor.update(() => {
        const root = $getRoot();
        
        // Clear editor content
        root.clear();
        
        // Parse the value string to extract variables
        const regex = /\{\{([^}]+)\}\}/g;
        let lastIndex = 0;
        let match;
        
        // Convert the string with variables into text and variable nodes
        while ((match = regex.exec(value)) !== null) {
          if (match.index > lastIndex) {
            const textBefore = value.substring(lastIndex, match.index);
            const textNode = $createTextNode(textBefore);
            root.append(textNode);
          }
          
          const variableId = match[1];
          const variableText = match[0]; // {{variableId}}
          const variableNode = new VariableNode(variableId, variableText);
          root.append(variableNode);
          
          lastIndex = match.index + match[0].length;
        }
        
        // Append any remaining text
        if (lastIndex < value.length) {
          const textAfter = value.substring(lastIndex);
          const textNode = $createTextNode(textAfter);
          root.append(textNode);
        }
      });
      
      setIsInitialized(true);
    }
  }, [editor, value, isInitialized]);
  
  return null;
}

export function LexicalGreetingEditor({ value, onChange }: EditorProps) {
  const [showVariableSelector, setShowVariableSelector] = useState(false);
  
  const handleSelectVariable = useCallback((variableId: string) => {
    // Variable selection is handled in the VariablePlugin
    console.log("Variable selected:", variableId);
  }, []);
  
  const handleTextChange = useCallback((text: string) => {
    onChange(text);
  }, [onChange]);
  
  return (
    <div className="flex flex-col gap-2 greeting-editor">
      <LexicalComposer initialConfig={initialConfig}>
        <div className={cn(
          "w-full border border-gray-200 dark:border-gray-700 rounded-lg min-h-[100px] break-words focus-within:ring-1 focus-within:ring-blue-400 dark:focus-within:ring-blue-600 focus-within:border-blue-400 dark:focus-within:border-blue-600",
          showVariableSelector ? "opacity-50" : ""
        )}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="w-full p-2 text-sm bg-white/50 dark:bg-gray-800/50 resize-y min-h-[100px] outline-none focus:outline-none"
                style={{
                  fontWeight: 500, // Medium font weight
                  color: '#333', // Darker text color
                }}
              />
            }
            placeholder={
              <div className="absolute top-[10px] left-[10px] text-sm text-gray-400 pointer-events-none">
                Type @ to insert a variable...
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <HistoryPlugin />
          <VariablePlugin
            showVariableSelector={showVariableSelector}
            setShowVariableSelector={setShowVariableSelector}
            onSelectVariable={handleSelectVariable}
          />
          <TextChangePlugin onChange={handleTextChange} />
          <EditorValuePlugin value={value} />
        </div>
      </LexicalComposer>

      <style jsx global>
        {`
        .greeting-paragraph {
          margin: 0;
          position: relative;
        }
        
        .greeting-variable {
          display: inline-block;
          background-color: rgba(99, 102, 241, 0.1);
          color: #6366f1;
          border-radius: 0.25rem;
          padding: 0 0.25rem;
          font-weight: 500;
          margin: 0 2px;
        }
        
        .dark .greeting-variable {
          background-color: rgba(99, 102, 241, 0.2);
          color: #818cf8;
        }
        `}
      </style>
    </div>
  );
}
