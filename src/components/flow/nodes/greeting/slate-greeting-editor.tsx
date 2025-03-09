
import { useState, useCallback, useMemo } from 'react';
import { createEditor, Descendant, Element as SlateElement, Text, Editor, Range, Point } from 'slate';
import { Slate, Editable, withReact, ReactEditor } from 'slate-react';
import { withHistory } from 'slate-history';
import { VariableSelector } from '../variable-mention/variable-selector';
import { cn } from '@/lib/utils';

// Define custom element types
type CustomElement = { type: 'paragraph' | 'variable'; children: CustomText[] } & { variableId?: string };
type CustomText = { text: string; bold?: boolean; italic?: boolean };

declare module 'slate' {
  interface CustomTypes {
    Editor: BaseEditor & ReactEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

// Variable leaf renderer
const VariableLeaf = ({ attributes, children, leaf }: any) => {
  return (
    <span 
      {...attributes}
      className="inline-block px-1 py-0.5 rounded text-indigo-700 bg-indigo-100 dark:text-indigo-300 dark:bg-indigo-900/30 font-medium text-sm"
    >
      {children}
    </span>
  );
};

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
        </span>
      );
    default:
      return <p {...attributes} className="greeting-paragraph">{children}</p>;
  }
};

// Leaf renderer
const Leaf = (props: any) => {
  const { attributes, children, leaf } = props;
  
  let className = '';
  
  return (
    <span
      {...attributes}
      className={className}
    >
      {children}
    </span>
  );
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
  
  const textParts: Descendant[] = [];
  
  while ((match = regex.exec(text)) !== null) {
    // Add text before variable
    if (match.index > lastIndex) {
      const textBefore = text.substring(lastIndex, match.index);
      textParts.push({ text: textBefore });
    }
    
    // Add variable element
    const variableId = match[1];
    textParts.push({ 
      type: 'variable', 
      variableId, 
      children: [{ text: `{{${variableId}}}` }] 
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining text
  if (lastIndex < text.length) {
    const textAfter = text.substring(lastIndex);
    textParts.push({ text: textAfter });
  }
  
  // If we have parts, add them to a paragraph
  if (textParts.length > 0) {
    nodes.push({ type: 'paragraph', children: textParts });
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
  
  // Create a Slate editor
  const editor = useMemo(() => withHistory(withReact(createEditor())), []);
  
  // Initialize with the current value
  const initialValue = useMemo(() => parseTextWithVariables(value), [value]);
  
  // Handle value changes
  const handleChange = (newValue: Descendant[]) => {
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
      Editor.deleteFragment(editor, {
        at: targetRange,
      });
      
      // Insert the variable node
      const variableNode: CustomElement = {
        type: 'variable',
        variableId: variableId,
        children: [{ text: `{{${variableId}}}` }],
      };
      
      Editor.insertNodes(editor, variableNode);
      // Add a space after
      Editor.insertText(editor, ' ');
    }
    
    setShowVariableSelector(false);
  }, [editor, targetRange]);
  
  // Handle key down events to trigger variable selector
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === '@') {
      // Let the @ character be inserted normally
      // The onChange handler will detect it and show the variable selector
    }
  }, []);
  
  return (
    <div className="flex flex-col gap-2 greeting-editor">
      <div className={cn(
        "w-full border border-gray-200 dark:border-gray-700 rounded-lg min-h-[100px] break-words focus-within:ring-1 focus-within:ring-blue-400 dark:focus-within:ring-blue-600 focus-within:border-blue-400 dark:focus-within:border-blue-600",
        showVariableSelector ? "opacity-50" : ""
      )}>
        <Slate 
          editor={editor} 
          initialValue={initialValue}
          onChange={handleChange}
        >
          <Editable
            className="w-full p-2 text-sm bg-white/50 dark:bg-gray-800/50 resize-y min-h-[100px] outline-none focus:outline-none"
            renderElement={Element}
            renderLeaf={Leaf}
            placeholder="Type @ to insert a variable..."
            onKeyDown={handleKeyDown}
            style={{
              fontWeight: 500, // Medium font weight
              color: '#333', // Darker text color
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
      
      <style jsx global>{`
        .greeting-paragraph {
          margin: 0;
          position: relative;
        }
        
        .variable-node {
          user-select: all;
        }
      `}</style>
    </div>
  );
}
