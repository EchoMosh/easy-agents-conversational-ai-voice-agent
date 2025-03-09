
import React from 'react';

interface EditorTipProps {
  show: boolean;
}

export function EditorTip({ show }: EditorTipProps) {
  if (!show) return null;
  
  return (
    <div className="absolute top-2 left-2 text-sm text-gray-400 dark:text-gray-500 pointer-events-none">
      Tip: Type <kbd className="px-1 rounded bg-gray-100 dark:bg-gray-700">#</kbd> to insert a variable
    </div>
  );
}
