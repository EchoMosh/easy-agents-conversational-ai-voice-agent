
import { Handle, Position } from '@xyflow/react';
import { X } from 'lucide-react';

export function EndNode() {
  return (
    <div className="bg-gradient-to-br from-rose-50/90 to-white dark:from-gray-900 dark:to-gray-800 rounded-xl border border-rose-100/50 dark:border-gray-700/50 shadow-xl backdrop-blur-sm p-4 min-w-[200px]">
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-2 h-4 !bg-rose-400 rounded-sm border-none" 
      />
      <div className="flex items-center gap-2 pb-1">
        <span className="text-rose-500 dark:text-rose-400 bg-rose-100/50 dark:bg-rose-900/50 p-1.5 rounded-md">
          <X className="h-4 w-4" />
        </span>
        <span className="font-medium text-rose-700 dark:text-rose-300">End Conversation</span>
      </div>
    </div>
  );
}
