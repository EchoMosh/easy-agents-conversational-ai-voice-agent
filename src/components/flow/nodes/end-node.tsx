
import { Handle, Position } from '@xyflow/react';
import { X } from 'lucide-react';

export function EndNode() {
  return (
    <div className="relative group bg-gradient-to-br from-rose-50/90 to-white dark:from-gray-900 dark:to-gray-800 rounded-xl border border-rose-100/50 dark:border-gray-700/50 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.05)] dark:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.5),0_2px_4px_-2px_rgba(0,0,0,0.25)] backdrop-blur-xl p-4 min-w-[200px] transition-all duration-300 bg-[length:200%_200%] animate-breathing hover:shadow-[0_0_30px_-5px_rgba(244,63,94,0.3)] dark:hover:shadow-[0_0_30px_-5px_rgba(244,63,94,0.2)] hover:translate-y-[-2px] hover:z-10">
      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/[0.02] to-transparent dark:from-rose-500/[0.05] rounded-xl pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100" />
      <div className="fixed inset-0 -z-10 bg-rose-500/[0.01] dark:bg-rose-400/[0.02] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <Handle 
        type="target" 
        position={Position.Left} 
        className="w-2 h-4 !bg-rose-400 rounded-sm border-none transition-all duration-300 hover:!bg-rose-500" 
      />
      <div className="flex items-center gap-2 pb-1">
        <span className="text-rose-500 dark:text-rose-400 bg-rose-100/50 dark:bg-rose-900/50 p-1.5 rounded-md">
          <X className="h-4 w-4" />
        </span>
        <span className="font-medium text-rose-700 dark:text-rose-300">End Conversation</span>
      </div>
      <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-rose-500/[0.03] pointer-events-none" />
    </div>
  );
}
