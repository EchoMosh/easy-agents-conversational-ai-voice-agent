
import { useEditor, EditorContent, Mark, mergeAttributes } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { useCallback, useEffect, useRef, useState } from 'react';
import { VariableSelector } from '../ai-agent-speaks/variable-selector';

// Create a custom mark for variables
const VariableMark = Mark.create({
  name: 'variable',
  
  addAttributes() {
    return {
      class: {
        default: 'editor-variable'
      }
    };
  },
  
  parseHTML() {
    return [
      {
        tag: 'span.editor-variable',
      },
    ];
  },
  
  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  }
});

interface TipTapGreetingEditorProps {
  value: string;
  onChange: (value: string) => void;
}

// Valid variable format: {variableName} - alphanumeric and underscore only
const VALID_VARIABLE_REGEX = /^\{[a-zA-Z0-9_]+\}$/;

export function TipTapGreetingEditor({ value, onChange }: TipTapGreetingEditorProps) {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [showVariableSelector, setShowVariableSelector] = useState(false);
  const [variableSelectorPosition, setVariableSelectorPosition] = useState({ x: 0, y: 0 });
  const [triggerChar, setTriggerChar] = useState<'#' | null>(null);
  const [showTip, setShowTip] = useState(true);

  const editor = useEditor({
    extensions: [
      StarterKit,
      VariableMark,
    ],
    content: value || '<p></p>',
    onUpdate: ({ editor }) => {
      const htmlContent = editor.getHTML();
      onChange(htmlContent);
      
      // Hide the tip when user starts typing
      if (editor.getText().trim() !== '') {
        setShowTip(false);
      } else {
        setShowTip(true);
      }
      
      // Check if # was just typed
      const selection = editor.view.state.selection;
      if (selection.empty) {
        const position = selection.$from.pos;
        const textBefore = editor.view.state.doc.textBetween(
          Math.max(0, position - 1),
          position,
          ''
        );
        
        if (textBefore === '#') {
          // Show the full-screen variable selector
          setTriggerChar('#');
          setShowVariableSelector(true);
        }
      }
      
      // Check for invalid variables immediately after an update
      setTimeout(() => {
        checkInvalidVariables(editor);
      }, 0);
    },
    autofocus: false,
    // Improve HTML parsing to correctly handle variable spans
    parseOptions: {
      preserveWhitespace: 'full',
    },
  });

  // Function to check for invalid variables
  const checkInvalidVariables = (editor: any) => {
    // Find all variable spans in the editor
    const variableSpans = editor.view.dom.querySelectorAll('.editor-variable');
    
    variableSpans.forEach((node: Element) => {
      const text = node.textContent || '';
      
      // Check if the content is a valid variable format
      const isValidVariable = VALID_VARIABLE_REGEX.test(text);
      
      if (!isValidVariable) {
        // Get the position of this node in the editor
        const nodePos = editor.view.posAtDOM(node, 0);
        
        if (nodePos !== null) {
          // Remove the variable styling from this invalid variable
          editor.chain()
            .setTextSelection({ from: nodePos, to: nodePos + text.length })
            .unsetMark('variable')
            .run();
        }
      }
    });
  };

  // Add key input handlers to detect when a variable is being edited
  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // For any key that could modify variable content
      if (event.key === 'Backspace' || event.key === 'Delete' || 
          /^[a-zA-Z0-9_{}]$/.test(event.key)) {
        // Run check immediately after key event
        setTimeout(() => {
          checkInvalidVariables(editor);
        }, 0);
      }
    };

    // Add the event listener to the editor DOM
    const editorDOM = editor.view.dom;
    editorDOM.addEventListener('keydown', handleKeyDown);
    
    return () => {
      editorDOM.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor]);

  // Also check for invalid variables on mouse clicks which could place cursor inside variables
  useEffect(() => {
    if (!editor) return;
    
    const handleMouseUp = () => {
      setTimeout(() => {
        checkInvalidVariables(editor);
      }, 0);
    };
    
    const editorDOM = editor.view.dom;
    editorDOM.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      editorDOM.removeEventListener('mouseup', handleMouseUp);
    };
  }, [editor]);

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      // Fix: Better handle parsing of HTML with variable spans
      editor.commands.setContent(value || '<p></p>');
      
      // Show/hide tip based on content
      if (editor.getText().trim() === '') {
        setShowTip(true);
      } else {
        setShowTip(false);
      }
      
      // Check for invalid variables after content is set
      setTimeout(() => {
        if (editor.isEditable) {
          checkInvalidVariables(editor);
        }
      }, 10);
    }
  }, [value, editor]);

  const handleClick = useCallback(() => {
    if (editor && !editor.isFocused) {
      editor.commands.focus('end');
    }
  }, [editor]);

  // Enhanced click handling to ensure focus
  useEffect(() => {
    const container = editorContainerRef.current;
    if (!container) return;

    const focusEditor = () => {
      if (editor && !editor.isFocused) {
        editor.commands.focus('end');
      }
    };

    container.addEventListener('click', focusEditor);
    return () => {
      container.removeEventListener('click', focusEditor);
    };
  }, [editor]);

  // Auto-focus when the component mounts
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (editor) {
        editor.commands.focus('end');
      }
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [editor]);

  const handleInsertVariable = useCallback((variable: string) => {
    if (editor) {
      // Remove the trigger character
      if (triggerChar) {
        editor.commands.command(({ tr, dispatch }) => {
          if (dispatch) {
            const position = editor.view.state.selection.$from.pos;
            tr.delete(position - 1, position);
            dispatch(tr);
          }
          return true;
        });
      }
      
      // Fixed: Use only one pair of curly braces for the variable
      const variableText = `{${variable}}`;
      
      console.log("Inserting variable:", variableText); // Debug log
      
      editor.chain()
        .focus()
        .insertContent({
          type: 'text',
          text: variableText,
          marks: [
            {
              type: 'variable',
              attrs: {
                class: 'editor-variable'
              }
            }
          ]
        })
        .unsetMark('variable') // Important: Unset the variable mark after insertion
        .run();
      
      editor.commands.focus('end');
      setShowVariableSelector(false);
      setShowTip(false); // Hide tip after inserting a variable
    }
  }, [editor, triggerChar]);

  if (!editor) {
    return <div className="p-2 text-sm text-gray-500">Loading editor...</div>;
  }

  return (
    <div 
      ref={editorContainerRef}
      className="border rounded-md p-2 bg-white dark:bg-gray-800/50 min-h-[100px] text-sm cursor-text relative nodrag"
      onClick={handleClick}
    >
      {showTip && (
        <div className="absolute top-2 left-2 text-sm text-gray-400 dark:text-gray-500 pointer-events-none">
          Tip: Type <kbd className="px-1 rounded bg-gray-100 dark:bg-gray-700">#</kbd> to insert a variable
        </div>
      )}
      
      <EditorContent editor={editor} className="prose dark:prose-invert prose-sm max-w-none cursor-text nodrag" />
      
      {showVariableSelector && (
        <VariableSelector 
          onSelectVariable={handleInsertVariable} 
          triggerChar="#" 
          isFullScreen={true}
        />
      )}
      
      <style>
        {`
        .ProseMirror {
          outline: none;
          min-height: 80px;
          cursor: text;
          padding-top: ${showTip ? '0' : '0'};
        }

        .ProseMirror p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        
        .editor-variable {
          display: inline-block;
          background-color: rgba(99, 102, 241, 0.1);
          color: #6366f1;
          border-radius: 0.25rem;
          padding: 0 0.25rem;
          font-weight: 500;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        
        .dark .editor-variable {
          background-color: rgba(99, 102, 241, 0.2);
          color: #818cf8;
        }
        `}
      </style>
    </div>
  );
}
