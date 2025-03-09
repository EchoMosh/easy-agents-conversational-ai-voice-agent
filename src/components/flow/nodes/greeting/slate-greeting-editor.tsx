
import { useState, useCallback, useMemo, useEffect } from 'react';
import { createEditor, Descendant, Element as SlateElement, Text, Range, Editor } from 'slate';
import { Slate, Editable, withReact, ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';
import { VariableSelector } from '../variable-mention/variable-selector';
import { cn } from '@/lib/utils';

// Define custom element types
type CustomElement = { type: 'paragraph' | 'variable'; children: (CustomText)[]; variableId?: string };
type CustomText = { text: string; bold?: boolean; italic?: boolean };

// Fix the circular type reference issues by properly extending types
declare module 'slate' {
  interface CustomTypes {
    Editor: ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

// Element renderer
const Element = (props: any) => {
  const { attributes, children, element } = props;
  
  switch (element.type) {
    case 'variable':
      return (
        <span 
          {...attributes}
          data-variable-id={element.variableId}
          contentEditable={false}
          className="inline-block px-1 py-0.5 rounded text-indigo-700 bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-900/30 font-medium text-sm variable-node mx-0.5"
        >
          {children}
          {!ReactEditor.isFocused(props.editor) && props.editor.isInline(element) && <span contentEditable={false}>&nbsp;</span>}
        </span>
      );
    default:
      return <p {...attributes} className="greeting-paragraph">{children}</p>;
  }
};

// Leaf renderer
const Leaf = (props: any) => {
  const { attributes, children } = props;
  return <span {...attributes}>{children}</span>;
};

// Helper to extract plain text from Slate document
const slateToPlainText = (nodes: Descendant[]): string => {
  return nodes.map(node => {
    if (Text.isText(node)) {
      return node.text;
    } else if (SlateElement.isElement(node) && node.type === 'variable') {
      return `{{${node.variableId}}}`;
    } else if (SlateElement.isElement(node)) {
      return slateToPlainText(node.children);
    }
    return '';
  }).join('');
};

// Parse text with {{variables}} into Slate nodes
const parseTextWithVariables = (text: string): Descendant[] => {
  if (!text) {
    return [{ type: 'paragraph', children: [{ text: '' }] }];
  }

  const nodes: Descendant[] = [];
  const regex = /\{\{([^}]+)\}\}/g;
  let lastIndex = 0;
  let match;
  
  // Create an array of text and variable nodes
  const paragraphChildren: (CustomText | { type: 'variable', variableId: string, children: CustomText[] })[] = [];
  
  while ((match = regex.exec(text)) !== null) {
    // Add text before variable
    if (match.index > lastIndex) {
      const textBefore = text.substring(lastIndex, match.index);
      paragraphChildren.push({ text: textBefore });
    }
    
    // Add variable element
    const variableId = match[1];
    paragraphChildren.push({ 
      type: 'variable', 
      variableId, 
      children: [{ text: variableId }] 
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining text
  if (lastIndex < text.length) {
    const textAfter = text.substring(lastIndex);
    paragraphChildren.push({ text: textAfter });
  }
  
  // If we have parts, add them to a paragraph
  if (paragraphChildren.length > 0) {
    // Type assertion to satisfy TypeScript
    nodes.push({ 
      type: 'paragraph', 
      children: paragraphChildren as any 
    });
  } else {
    // Empty document
    nodes.push({ type: 'paragraph', children: [{ text: '' }] });
  }
  
  return nodes;
};

interface EditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function SlateGreetingEditor({ value, onChange }: EditorProps) {
  // Track variable selector visibility
  const [showVariableSelector, setShowVariableSelector] = useState(false);
  // Track @ trigger position for variable insertion
  const [targetRange, setTargetRange] = useState<Range | null>(null);
  
  // Update the editor useMemo to be more robust
  const editor = useMemo(() => {
    const slateEditor = withReact(withHistory(createEditor()));
    
    // Override functions as before
    const { isVoid, isInline } = slateEditor;
    
    slateEditor.isVoid = element => {
      return element.type === 'variable' ? false : isVoid(element);
    };
    
    slateEditor.isInline = element => {
      return element.type === 'variable' ? true : isInline(element);
    };
    
    return slateEditor;
  }, []);
  
  // Add a state for editor content
  const [editorContent, setEditorContent] = useState<Descendant[]>(() => 
    parseTextWithVariables(value)
  );
  
  // Replace the initialValue useMemo with this useEffect
  useEffect(() => {
    const parsedValue = parseTextWithVariables(value);
    setEditorContent(parsedValue);
  }, [value]);
  
  // Handle editor changes
  const handleEditorChange = (newValue: Descendant[]) => {
    setEditorContent(newValue);
    
    // Convert Slate document to plain text with variables
    const plainText = slateToPlainText(newValue);
    onChange(plainText);
    
    // Check for @ character to trigger variable selector
    const { selection } = editor;
    
    if (selection && Range.isCollapsed(selection)) {
      const [start] = Range.edges(selection);
      const charBeforeSelection = Editor.before(editor, start, { unit: 'character' });
      const beforeRange = charBeforeSelection && Editor.range(editor, charBeforeSelection, start);
      const beforeText = beforeRange && Editor.string(editor, beforeRange);
      
      // If user types @, show variable selector
      if (beforeText === '@') {
        setTargetRange(beforeRange);
        setShowVariableSelector(true);
        return;
      }
    }
    
    setTargetRange(null);
  };
  
  // Handle variable selection
  const handleSelectVariable = useCallback((variableId: string) => {
    if (targetRange) {
      // Delete the @ character
      editor.deleteBackward('character');
      
      // Insert the variable node
      const variableNode: CustomElement = {
        type: 'variable',
        variableId: variableId,
        children: [{ text: variableId }],
      };
      
      editor.insertNode(variableNode);
      // Add a space after
      editor.insertText(' ');
    }
    
    setShowVariableSelector(false);
  }, [editor, targetRange]);

  // Handle keydown events for variable deletion
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Get the current selection
    const { selection } = editor;
    
    if (selection && !Range.isCollapsed(selection)) {
      // Check if selection contains a variable node
      const [node] = Editor.node(editor, selection);
      
      if (SlateElement.isElement(node) && node.type === 'variable') {
        // Allow deletion with backspace or delete keys
        if (e.key === 'Backspace' || e.key === 'Delete') {
          editor.deleteFragment();
          e.preventDefault();
        }
      }
    } else if (e.key === 'Backspace' && selection) {
      // Check if the previous node is a variable
      const [start] = Range.edges(selection);
      const prevNodeEntry = Editor.previous(editor, { at: start });
      
      if (prevNodeEntry) {
        const [prevNode] = prevNodeEntry;
        if (SlateElement.isElement(prevNode) && prevNode.type === 'variable') {
          editor.deleteBackward('character');
          e.preventDefault();
        }
      }
    }
  };
  
  // Add explicit focus handling function
  const focusEditor = useCallback(() => {
    ReactEditor.focus(editor);
    // Log for debugging
    console.log('Focus requested on editor');
  }, [editor]);
  
  // Improve click handling to ensure the cursor is properly set
  const handleEditorClick = (e: React.MouseEvent) => {
    // Stop propagation to prevent parent handlers from interfering
    e.stopPropagation();
    
    // Log for debugging
    console.log('Editable clicked at', e.clientX, e.clientY);
    
    // Force focus
    ReactEditor.focus(editor);
    
    // Try to place cursor at click position
    try {
      // If there's no selection, set one at the end
      if (!editor.selection) {
        const point = Editor.end(editor, []);
        editor.selection = { anchor: point, focus: point };
        editor.onChange();
      }
    } catch (err) {
      console.error('Error setting cursor:', err);
    }
  };
  
  // Container click handler
  const handleContainerClick = (e: React.MouseEvent) => {
    // Prevent the default behavior
    e.preventDefault();
    
    // Focus editor and ensure cursor is visible
    focusEditor();
    
    // Try to place cursor at the end of the document
    try {
      const point = Editor.end(editor, []);
      editor.selection = { anchor: point, focus: point };
      editor.onChange();
      console.log('Set cursor position at end from container click');
    } catch (err) {
      console.error('Error setting cursor position from container click:', err);
    }
  };
  
  return (
    <div 
      className="flex flex-col gap-2 greeting-editor" 
      style={{ pointerEvents: 'auto' }}
      onClick={handleContainerClick}
    >
      <div className={cn(
        "w-full border border-gray-200 dark:border-gray-700 rounded-lg min-h-[100px] break-words focus-within:ring-1 focus-within:ring-blue-400 dark:focus-within:ring-blue-600 focus-within:border-blue-400 dark:focus-within:border-blue-600",
        showVariableSelector ? "opacity-50" : ""
      )} style={{ position: 'relative', zIndex: 10 }}>
        <Slate 
          editor={editor} 
          value={editorContent}
          onChange={handleEditorChange}
        >
          <Editable
            className="w-full p-2 text-sm bg-white/50 dark:bg-gray-800/50 resize-y min-h-[100px] outline-none focus:outline-none"
            renderElement={Element}
            renderLeaf={Leaf}
            placeholder="Type @ to insert a variable..."
            onKeyDown={handleKeyDown}
            onClick={handleEditorClick}
            style={{
              fontWeight: 500, // Medium font weight
              color: '#333', // Darker text color
              pointerEvents: 'auto',
            }}
          />
        </Slate>
      </div>
      
      {showVariableSelector && (
        <VariableSelector
          text=""
          onSelectVariable={(variableId) => {
            handleSelectVariable(variableId);
          }}
          onClose={() => setShowVariableSelector(false)}
        />
      )}
      
      <style>
        {`
        .greeting-paragraph {
          margin: 0;
          position: relative;
          line-height: 1.5;
        }
        
        .variable-node {
          user-select: all;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
        }
        `}
      </style>
    </div>
  );
}

