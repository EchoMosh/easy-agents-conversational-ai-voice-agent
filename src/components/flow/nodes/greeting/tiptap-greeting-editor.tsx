
import { EditorContent } from '@tiptap/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { VariableSelector } from '../ai-agent-speaks/variable-selector';
import { EditorTip } from './editor-tip';
import { useTiptapEditor } from './use-tiptap-editor';
import { editorStyles } from './editor-styles';
import { Portal } from '@radix-ui/react-portal';
import { Hash, AtSign, Sparkles } from 'lucide-react';

interface TipTapGreetingEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export function TipTapGreetingEditor({ value, onChange }: TipTapGreetingEditorProps) {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [showVariableSelector, setShowVariableSelector] = useState(false);
  const [triggerChar, setTriggerChar] = useState<'@' | '#' | null>(null);
  const [selectorPosition, setSelectorPosition] = useState({ top: 0, left: 0 });

  const handleVariableTrigger = useCallback((char: '@' | '#', position?: { top: number, left: number }) => {
    setTriggerChar(char);
    setShowVariableSelector(true);
    
    if (position) {
      setSelectorPosition(position);
    }
  }, []);

  const { editor, showTip, insertVariable } = useTiptapEditor({
    value,
    onChange: (newValue) => {
      onChange(newValue);
    },
    onVariableTrigger: handleVariableTrigger
  });

  const handleClick = useCallback(() => {
    if (editor && !editor.isFocused) {
      editor.commands.focus('end');
    }
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

  const handleInsertVariable = useCallback((variable: string, displayStyle?: any) => {
    if (variable === '') {
      // This means the user clicked away or pressed escape
      setShowVariableSelector(false);
      // Focus back on editor
      if (editor) {
        editor.commands.focus();
      }
    } else {
      insertVariable(variable, triggerChar);
      setShowVariableSelector(false);
      // Focus back on editor after inserting
      if (editor) {
        editor.commands.focus();
      }
    }
  }, [editor, insertVariable, triggerChar]);

  // Display Coming Soon message instead of the editor
  return (
    <>
      <div className="flex flex-col items-center justify-center py-8 rounded-md w-full min-h-[240px] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-800/30">
        <div className="text-center space-y-6 max-w-md px-4">
          <div className="inline-flex items-center justify-center p-2 bg-blue-100/50 dark:bg-blue-900/30 rounded-full mb-2 opacity-0 fade-up">
            <Sparkles className="h-6 w-6 text-blue-500" />
          </div>
          <h3 className="text-xl font-medium text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 opacity-0 fade-up delay-100">
            Coming Soon
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 opacity-0 fade-up delay-200">
            The Conversation Designer is being developed to help you create dynamic, 
            natural-sounding chat flows with variables that adapt to each user.
          </p>
          <div className="rounded-md bg-white/50 dark:bg-gray-800/50 p-4 border border-blue-100 dark:border-blue-800/30 text-xs text-left space-y-3 opacity-0 fade-up delay-300">
            <div className="flex items-start gap-2">
              <div className="mt-1 bg-blue-100 dark:bg-blue-900/50 p-1 rounded">
                <Hash className="h-3 w-3 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-200">Use # to insert system variables</p>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Like date, time, or conversation context</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-1 bg-indigo-100 dark:bg-indigo-900/50 p-1 rounded">
                <AtSign className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-200">Use @ to insert contact variables</p>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Like name, email, or custom fields</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-blue-500 dark:text-blue-400 opacity-0 fade-up delay-400">
            We're working hard to bring you this feature soon!
          </p>
        </div>
      </div>
      <style>{editorStyles}</style>
    </>
  );
}
