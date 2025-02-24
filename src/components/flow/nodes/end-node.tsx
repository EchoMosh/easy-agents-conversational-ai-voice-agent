
import { Handle, Position } from '@xyflow/react';

export function EndNode() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-4 min-w-[200px]">
      <Handle type="target" position={Position.Left} className="w-3 h-3 rounded-full bg-gray-300 border-2 border-white dark:border-gray-800" />
      <div className="flex items-center gap-2">
        <span className="text-red-500">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6"/><path d="M9 9l6 6"/></svg>
        </span>
        <span className="font-medium dark:text-white">End Conversation</span>
      </div>
    </div>
  );
}
