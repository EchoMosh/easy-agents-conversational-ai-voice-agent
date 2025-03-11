
import React from 'react';
import { Hash, AtSign } from 'lucide-react';

interface EditorTipProps {
  show: boolean;
}

export function EditorTip({ show }: EditorTipProps) {
  if (!show) return null;
  
  return (
    <div className="absolute top-12 left-1/2 -translate-x-1/2 text-sm bg-black/90 text-white px-3 py-2 rounded-lg shadow-lg pointer-events-none z-10 flex items-center gap-2 whitespace-nowrap">
      <span>Type</span>
      <div className="flex items-center justify-center h-5 w-5 bg-gray-700 rounded-full">
        <Hash className="h-3 w-3" />
      </div>
      <span>or</span>
      <div className="flex items-center justify-center h-5 w-5 bg-gray-700 rounded-full">
        <AtSign className="h-3 w-3" />
      </div>
      <span>to insert a variable</span>
      <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-black/90"></div>
    </div>
  );
}
