
import { Handle, Position } from '@xyflow/react';
import { X } from 'lucide-react';

export function EndNode() {
  return (
    <div className="relative group">
      <div className="absolute inset-0 bg-gradient-to-br from-rose-500/[0.02] to-transparent dark:from-rose-500/[0.05] rounded-2xl pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100" />
      
      <Handle 
        type="target" 
        position={Position.Left}
      />
      
      <div className="node-header">
        <span className="node-icon">
          <X className="h-4 w-4" />
        </span>
        <span className="font-medium text-rose-700 dark:text-rose-300">End Conversation</span>
      </div>
      
      <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-rose-500/[0.03] pointer-events-none" />
    </div>
  );
}
