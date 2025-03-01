
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Mail } from 'lucide-react';

interface EmailNodeProps {
  data: {
    label: string;
    subject?: string;
    template?: string;
  };
  isConnectable?: boolean;
}

export function EmailNode({ data, isConnectable }: EmailNodeProps) {
  return (
    <div className="relative rounded-lg border-2 border-purple-500 bg-white dark:bg-gray-800 p-3 w-48 shadow-md">
      <div className="font-semibold text-purple-700 dark:text-purple-200 text-sm mb-1 flex items-center">
        <Mail className="h-3 w-3 mr-1" /> Email
      </div>
      <div className="text-gray-700 dark:text-gray-300 text-xs">
        {data.label}
      </div>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={isConnectable}
        className="w-2 h-2 bg-purple-500"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        isConnectable={isConnectable}
        className="w-2 h-2 bg-purple-500"
      />
    </div>
  );
}
